// POST /api/chat { message, lang } — un message du visiteur → réponse de Petit Pois en streaming (SSE).
//
// Garde-fous appliqués dans l'ordre :
//   1. session valide (cookie signé) ou créée si quota IP non atteint
//   2. message non vide, ≤ CHAT_MAX_INPUT_CHARS
//   3. quota par session · 4. intervalle minimum · 5. quota par IP et par jour · 6. budget global de tokens
//   7. filtre de périmètre (petit modèle) → réponse fixe sans appeler Petit Pois si hors sujet
// Les compteurs vivent en base : ni le refresh ni la navigation privée ne les remettent à zéro.

import { env, assertEnv } from './_lib/env.js';
import { error, readJson, getIp, hashIp, siteOrigin } from './_lib/http.js';
import { resolveSession, remainingFor } from './_lib/session.js';
import { store } from './_lib/store.js';
import { toApiMessages, toDisplay } from './_lib/history.js';
import { buildPoisSystem, TOOLS, executeTool, contextBlock } from './_lib/petitpois.js';
import { getSettings } from './_lib/settings.js';
import { runTurn, looksLikeFakeAction, NUDGE_TEXT } from './_lib/llm.js';
import { checkScope, OFFTOPIC_REPLIES, BLOCKED_REPLY, looksOutOfScope, SAFE_REPLACEMENT } from './_lib/guard.js';
import { LANGS } from '../src/data/infos.js';

export const maxDuration = 60;
const MAX_TOOL_ROUNDS = 4;
const DAY = 60 * 60 * 24;

const MSG = {
  too_many_sessions: { fr: "Trop de nouvelles conversations aujourd'hui. Appelez-nous ou utilisez le formulaire.", en: 'Too many new conversations today. Call us or use the form.', es: 'Demasiadas conversaciones nuevas hoy. Llámenos o utilice el formulario.' },
  limit_reached: { fr: 'Vous avez atteint la limite de messages pour cette conversation.', en: 'You have reached the message limit for this conversation.', es: 'Ha alcanzado el límite de mensajes de esta conversación.' },
  ip_limit: { fr: 'Limite quotidienne atteinte. Appelez-nous ou utilisez le formulaire.', en: 'Daily limit reached. Call us or use the form.', es: 'Límite diario alcanzado. Llámenos o utilice el formulario.' },
  budget: { fr: 'Petit Pois fait une pause. Le formulaire de contact reste disponible.', en: 'Petit Pois is taking a break. The contact form remains available.', es: 'Petit Pois hace una pausa. El formulario de contacto sigue disponible.' },
  busy: { fr: 'Petit Pois est très sollicité, réessayez dans un instant.', en: 'Petit Pois is very busy, try again in a moment.', es: 'Petit Pois está muy solicitado, inténtelo de nuevo en un momento.' },
  fail: { fr: 'Petit Pois a rencontré un problème. Réessayez ou utilisez le formulaire de contact.', en: 'Petit Pois ran into a problem. Try again or use the contact form.', es: 'Petit Pois ha tenido un problema. Inténtelo de nuevo o utilice el formulario de contacto.' },
};
const t = (k, lang) => MSG[k][lang] || MSG[k].fr;

function sse(events, setCookie) {
  const headers = { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' };
  if (setCookie) headers['set-cookie'] = setCookie;
  return new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''), { headers });
}

export async function POST(request) {
  try {
    assertEnv([env.provider === 'groq' ? 'groqKey' : 'anthropicKey']);
    const body = await readJson(request);
    const lang = LANGS.includes(body?.lang) ? body.lang : 'fr';

    const { session, setCookie, reason } = await resolveSession(request, { create: true });
    if (!session) return error(429, t('too_many_sessions', lang), { code: reason || 'too_many_sessions' });

    const text = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!text) return error(400, 'Message vide.', { code: 'empty' });
    if (text.length > env.maxInputChars) return error(400, `Message trop long (max ${env.maxInputChars}).`, { code: 'too_long' });

    if (session.status === 'blocked') return error(403, BLOCKED_REPLY[lang], { code: 'blocked' });
    if (remainingFor(session) <= 0) return error(429, t('limit_reached', lang), { code: 'limit_reached', remaining: 0 });

    const last = session.last_message_at ? new Date(session.last_message_at).getTime() : 0;
    if (Date.now() - last < env.minIntervalMs) return error(429, '…', { code: 'too_fast' });

    const ipHash = hashIp(getIp(request));
    const ipCount = await store().bumpCounter(`msgs:${ipHash}`, DAY);
    if (ipCount > env.maxMessagesPerIpPerDay) return error(429, t('ip_limit', lang), { code: 'ip_limit' });
    if ((await store().todayTokens()) >= env.dailyTokenBudget) return error(503, t('budget', lang), { code: 'budget' });

    // --- Réservation du tour : compteur + message visiteur sauvegardés avant l'appel API.
    const count = await store().beginTurn(session.id, session.message_count);
    await store().saveMessage(session.id, { role: 'user', kind: 'text', content: text, displayText: text });
    const remaining = Math.max(env.maxMessagesPerSession - count, 0);
    const rows = await store().loadRows(session.id);

    // --- Filtre de périmètre : hors sujet → réponse fixe, Petit Pois n'est pas appelé.
    const scope = await checkScope(text, toDisplay(rows.slice(0, -1)));
    if (!scope.ok) {
      const strikes = await store().addStrike(session.id, env.offtopicStrikes);
      const blocked = strikes >= env.offtopicStrikes;
      const replies = OFFTOPIC_REPLIES[lang] || OFFTOPIC_REPLIES.fr;
      const reply = blocked ? BLOCKED_REPLY[lang] : replies[Math.min(strikes - 1, replies.length - 1)];
      await store().saveMessage(session.id, { role: 'assistant', kind: 'text', content: [{ type: 'text', text: reply }], displayText: reply });
      return sse([{ type: 'text', delta: reply }, { type: 'done', remaining: blocked ? 0 : remaining, blocked }], setCookie);
    }

    const messages = toApiMessages(rows);
    const settings = await getSettings();
    const systemPrompt = buildPoisSystem(settings);
    const lastMsg = messages[messages.length - 1];
    lastMsg.content = [{ type: 'text', text: lastMsg.content }, { type: 'text', text: contextBlock({ settings, lang }) }];
    if (remaining === 0) lastMsg.content.push({ type: 'text', text: "[Contexte système : c'est le dernier message autorisé pour cette conversation. Termine proprement et, si une demande est en cours, appelle handoff_to_human avec le récapitulatif.]" });

    const toolCtx = { sessionId: session.id, origin: siteOrigin(request), settings, lang };
    const encoder = new TextEncoder();
    const headers = { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' };
    if (setCookie) headers['set-cookie'] = setCookie;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        const totalUsage = { input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0 };
        let fullText = ''; let roundText = ''; let nudged = false; let cta = null; let ticket = null;
        try {
          for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            if (fullText && !/\s$/.test(fullText)) { fullText += '\n\n'; send({ type: 'text', delta: '\n\n' }); }
            roundText = '';
            const message = await runTurn({ system: systemPrompt, tools: TOOLS, messages, maxTokens: env.maxOutputTokens, onText: (delta) => { fullText += delta; roundText += delta; send({ type: 'text', delta }); } });
            for (const k of Object.keys(totalUsage)) totalUsage[k] += message.usage?.[k] || 0;
            const toolUses = message.content.filter((b) => b.type === 'tool_use');
            const textOnly = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');

            if (!nudged && round < MAX_TOOL_ROUNDS && looksLikeFakeAction(textOnly, toolUses)) {
              nudged = true;
              await store().saveMessage(session.id, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
              messages.push({ role: 'assistant', content: message.content });
              const nudge = [{ type: 'text', text: NUDGE_TEXT }];
              await store().saveMessage(session.id, { role: 'user', kind: 'tool', content: nudge, displayText: null });
              messages.push({ role: 'user', content: nudge });
              continue;
            }

            if (message.stop_reason !== 'tool_use' || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
              if (nudged) { fullText = roundText || textOnly; send({ type: 'replace', text: fullText }); }
              let displayText = fullText || textOnly;
              let content = message.content;
              if (looksOutOfScope(displayText)) {
                displayText = SAFE_REPLACEMENT[lang] || SAFE_REPLACEMENT.fr;
                content = [{ type: 'text', text: displayText }];
                send({ type: 'replace', text: displayText });
              }
              await store().saveMessage(session.id, { role: 'assistant', kind: 'text', content, displayText, meta: cta || ticket ? { cta, ticket } : null });
              break;
            }

            await store().saveMessage(session.id, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
            messages.push({ role: 'assistant', content: message.content });
            const results = [];
            for (const tu of toolUses) {
              const { result, cta: toolCta, ticket: toolTicket } = await executeTool(tu.name, tu.input, toolCtx);
              if (toolCta) cta = toolCta;
              if (toolTicket) ticket = toolTicket;
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
            }
            await store().saveMessage(session.id, { role: 'user', kind: 'tool', content: results, displayText: null });
            messages.push({ role: 'user', content: results });
          }
          if (ticket) send({ type: 'ticket', ticket });
          if (cta) send({ type: 'cta', cta });
          send({ type: 'done', remaining });
        } catch (e) {
          console.error('chat stream', e);
          if (!fullText) await store().refundTurn(session.id).catch(() => {});
          send({ type: 'error', message: e?.status === 429 ? t('busy', lang) : t('fail', lang), remaining: fullText ? remaining : remaining + 1 });
        } finally {
          await store().addUsage(totalUsage);
          controller.close();
        }
      },
    });
    return new Response(stream, { headers });
  } catch (e) {
    console.error('chat', e);
    if (e.code === 'CONFIG') return error(503, e.message, { code: 'config' });
    return error(500, 'Erreur serveur.', { code: 'server' });
  }
}
