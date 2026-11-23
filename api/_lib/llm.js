// Couche fournisseur LLM : Anthropic (Claude) ou Groq (API compatible OpenAI).
// Le reste du backend manipule uniquement le format "blocs" d'Anthropic
// ({type:'text'|'tool_use'|'tool_result'}), converti ici pour Groq.
//
//   LLM_PROVIDER=anthropic  → claude-opus-5 (défaut), prompt caching, effort low
//   LLM_PROVIDER=groq       → openai/gpt-oss-120b (défaut), gratuit, sans cache

import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { env, assertEnv } from './env.js';
import { ensureAi } from './ai.js';
import { PROVIDERS, compatOf, checkBaseUrl } from './providers.js';

// Clients recréés quand la clé change (elle peut être modifiée depuis l'espace de pilotage, sans redémarrage).
let anthropic; let anthropicKey;
let groq; let groqKey;
function anthropicClient() {
  if (!anthropic || anthropicKey !== env.anthropicKey) { anthropicKey = env.anthropicKey; anthropic = new Anthropic({ apiKey: anthropicKey }); }
  return anthropic;
}
// Fournisseurs compatibles OpenAI : on réutilise le client Groq (même format d'échange) en redirigeant ses appels
// vers l'adresse du fournisseur, et en adaptant les rares paramètres qui diffèrent d'un fournisseur à l'autre.
function compatFetch(compat) {
  return async (url, init = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+\/openai\/v1/, '');
    let body = init.body;
    if (typeof body === 'string' && body.startsWith('{')) {
      try {
        const j = JSON.parse(body);
        delete j.reasoning_effort; // propre à certains modèles Groq
        if (compat.tokenParam === 'max_tokens' && j.max_completion_tokens !== undefined) { j.max_tokens = j.max_completion_tokens; delete j.max_completion_tokens; }
        if (j.stream) j.stream_options = { include_usage: true }; // consommation de tokens en fin de flux
        body = JSON.stringify(j);
      } catch { /* corps inchangé */ }
    }
    return fetch(`${compat.baseUrl}${path}`, { ...init, body });
  };
}
function openAiClient({ apiKey, compat, maxRetries = 3, timeout }) {
  return new Groq({ apiKey, maxRetries, ...(timeout ? { timeout } : {}), ...(compat && !compat.groq ? { fetch: compatFetch(compat) } : {}) });
}
function groqClient() {
  const sig = `${env.groqKey}|${env.compat?.baseUrl || ''}`;
  if (!groq || groqKey !== sig) { groqKey = sig; groq = openAiClient({ apiKey: env.groqKey, compat: env.compat }); }
  return groq;
}

const PING_TOOL = [{ type: 'function', function: { name: 'ping', description: 'Outil de test : à appeler une fois.', parameters: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] } } }];

/**
 * Essai réel d'un réglage (fournisseur, clé, modèle) avant de l'enregistrer. Ne lève jamais.
 * Deux vérifications : le modèle répond, et il sait appeler un outil — indispensable à Petit Pois, qui
 * enregistre les demandes de devis par un appel d'outil.
 */
export async function probe({ provider, apiKey, model, baseUrl }) {
  const t0 = Date.now();
  try {
    let reply; let tools = false;
    if (PROVIDERS[provider]?.format === 'anthropic') {
      const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
      const res = await client.messages.create({ model, max_tokens: 30, messages: [{ role: 'user', content: 'Réponds par un seul mot : prêt' }] });
      reply = res.content.find((b) => b.type === 'text')?.text || '';
      tools = true; // tous les modèles Claude savent appeler des outils
    } else {
      const compat = compatOf(provider, baseUrl);
      if (!compat) return { ok: false, ms: 0, erreur: checkBaseUrl(baseUrl).erreur || 'Fournisseur inconnu.' };
      const client = openAiClient({ apiKey, compat, maxRetries: 0, timeout: 25_000 });
      const extra = compat.groq && isReasoningModel(model) ? { reasoning_effort: 'low' } : {};
      const res = await client.chat.completions.create({ model, max_completion_tokens: 200, temperature: 0, messages: [{ role: 'user', content: 'Réponds par un seul mot : prêt' }], ...extra });
      reply = res.choices?.[0]?.message?.content || '';
      try {
        const r2 = await client.chat.completions.create({ model, max_completion_tokens: 300, temperature: 0, tools: PING_TOOL, tool_choice: 'auto', messages: [{ role: 'user', content: 'Appelle l’outil ping avec ok = true. Ne réponds rien d’autre.' }], ...extra });
        tools = (r2.choices?.[0]?.message?.tool_calls || []).some((c) => c.function?.name === 'ping');
      } catch { tools = false; }
    }
    const ms = Date.now() - t0;
    if (!tools) return { ok: false, ms, reply: String(reply).trim().slice(0, 80), erreur: 'Ce modèle répond, mais il ne sait pas appeler d’outils : Petit Pois ne pourrait pas enregistrer les demandes de devis. Choisissez un autre modèle.' };
    return { ok: true, ms, reply: String(reply).trim().slice(0, 80), outils: true };
  } catch (e) {
    const status = e?.status;
    const why = status === 401 || status === 403 ? 'Clé refusée par le fournisseur.' : status === 404 ? 'Modèle ou adresse introuvable chez ce fournisseur.' : status === 429 ? 'Quota du fournisseur atteint (ou crédit épuisé).' : (e?.message || 'Erreur inconnue').slice(0, 160);
    return { ok: false, ms: Date.now() - t0, erreur: why, statut: status || null };
  }
}

/** Modèles réellement disponibles chez le fournisseur pour cette clé (liste demandée au fournisseur). Ne lève jamais. */
export async function listModels({ provider, apiKey, baseUrl }) {
  try {
    const ctl = AbortSignal.timeout(15_000);
    let url; let headers;
    if (PROVIDERS[provider]?.format === 'anthropic') { url = 'https://api.anthropic.com/v1/models?limit=100'; headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }; }
    else {
      const compat = compatOf(provider, baseUrl);
      if (!compat) return { ok: false, erreur: checkBaseUrl(baseUrl).erreur || 'Fournisseur inconnu.' };
      url = `${compat.baseUrl}/models`; headers = { authorization: `Bearer ${apiKey}` };
    }
    const r = await fetch(url, { headers, signal: ctl });
    if (!r.ok) return { ok: false, erreur: r.status === 401 || r.status === 403 ? 'Clé refusée par le fournisseur.' : `Le fournisseur a répondu ${r.status}.` };
    const j = await r.json();
    const list = (Array.isArray(j) ? j : j.data || j.models || []).map((m) => String(m.id || m.name || '').replace(/^models\//, '')).filter(Boolean);
    // Les modèles qui ne servent pas à converser (images, voix, vecteurs, modération) sont écartés.
    const chat = list.filter((id) => !/embed|whisper|tts|audio|image|dall-e|moderation|rerank|guard|vision-preview|transcribe|speech|imagen|veo|aqa/i.test(id));
    return { ok: true, modeles: [...new Set(chat)].sort().slice(0, 300) };
  } catch (e) {
    return { ok: false, erreur: (e?.message || 'Erreur inconnue').slice(0, 160) };
  }
}

export function providerInfo() {
  return { provider: env.providerId || env.provider, label: PROVIDERS[env.providerId || env.provider]?.label || env.provider, model: env.model, guardModel: env.guardModel, source: env.aiSource, enabled: env.aiEnabled };
}

/**
 * Un tour de génération en streaming.
 * @param {object} p
 * @param {string} p.system            prompt système (stable, mis en cache chez Anthropic)
 * @param {Array}  p.tools             définitions d'outils au format Anthropic
 * @param {Array}  p.messages          historique au format Anthropic (blocs)
 * @param {number} p.maxTokens
 * @param {(delta:string)=>void} p.onText
 * @returns {Promise<{content: Array, stop_reason: string, usage: object}>}
 */
export async function runTurn(p) {
  await ensureAi();
  if (env.provider !== 'groq') return anthropicTurn(p);
  const primary = p.model || env.model;
  try {
    return await groqTurn(p);
  } catch (e) {
    // Quota du modèle saturé (429) ou incident (5xx) : on bascule sur un modèle de repli plutôt que d'échouer.
    if (!(e?.status === 429 || e?.status >= 500)) throw e;
    const alt = env.fallbackModels.find((m) => m !== primary);
    if (!alt) throw e;
    console.warn(`[llm] ${primary} indisponible (${e.status}) → repli sur ${alt}`);
    return groqTurn({ ...p, model: alt });
  }
}
// runTurn permet de surcharger le modèle par appel (p.model) — utilisé par le Chef.

/** Réponse courte non streamée (filtre de périmètre). */
export async function complete({ system, user, maxTokens = 10, model }) {
  await ensureAi();
  if (env.provider === 'groq') {
    assertEnv(['groqKey']);
    const res = await groqClient().chat.completions.create({
      model: model || env.guardModel,
      max_completion_tokens: maxTokens,
      temperature: 0,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      ...(isReasoningModel(model || env.guardModel) ? { reasoning_effort: 'low' } : {}),
    });
    return res.choices?.[0]?.message?.content || '';
  }
  assertEnv(['anthropicKey']);
  const res = await anthropicClient().messages.create({
    model: model || env.guardModel,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.find((b) => b.type === 'text')?.text || '';
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------
async function anthropicTurn(p) {
  const { system, tools, messages, maxTokens, onText } = p;
  assertEnv(['anthropicKey']);
  const anthropic = anthropicClient();

  // Deuxième point de cache : fin du dernier tour assistant, pour que la
  // conversation précédente soit relue depuis le cache au tour suivant.
  const msgs = messages.map((m) => ({ ...m }));
  for (let i = msgs.length - 2; i >= 0; i--) {
    const m = msgs[i];
    if (m.role === 'assistant' && Array.isArray(m.content) && m.content.length) {
      const blocks = m.content.map((b) => ({ ...b }));
      blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: { type: 'ephemeral' } };
      msgs[i] = { ...m, content: blocks };
      break;
    }
  }

  const s = anthropic.messages.stream({
    model: p.model || env.model,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    tools,
    messages: msgs,
    output_config: { effort: 'low' },
  });
  s.on('text', onText);
  const message = await s.finalMessage();
  return { content: message.content, stop_reason: message.stop_reason, usage: message.usage };
}

// ---------------------------------------------------------------------------
// Groq (compatible OpenAI)
// ---------------------------------------------------------------------------
const isReasoningModel = (m) => /gpt-oss|qwen3|deepseek/i.test(m || '') && !/compound/i.test(m || '');

function textOf(content) {
  if (typeof content === 'string') return content;
  return (content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// Historique Anthropic → messages OpenAI.
function toOpenAiMessages(system, messages) {
  const out = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'user') {
      const results = Array.isArray(m.content) ? m.content.filter((b) => b.type === 'tool_result') : [];
      if (results.length) {
        for (const r of results) {
          out.push({ role: 'tool', tool_call_id: r.tool_use_id, content: typeof r.content === 'string' ? r.content : JSON.stringify(r.content) });
        }
      } else {
        out.push({ role: 'user', content: textOf(m.content) });
      }
    } else if (m.role === 'assistant') {
      const blocks = Array.isArray(m.content) ? m.content : [{ type: 'text', text: String(m.content) }];
      const toolCalls = blocks
        .filter((b) => b.type === 'tool_use')
        .map((b) => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input || {}) } }));
      const msg = { role: 'assistant', content: textOf(blocks) || null };
      if (toolCalls.length) msg.tool_calls = toolCalls;
      out.push(msg);
    }
  }
  return out;
}

function toOpenAiTools(tools) {
  return tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
}

async function groqTurn(p) {
  const { system, tools, messages, maxTokens, onText } = p;
  const model = p.model || env.model;
  assertEnv(['groqKey']);
  const groq = groqClient(); // 3 essais avec attente, puis repli sur un autre modèle (runTurn)

  const stream = await groq.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    temperature: 0.4,
    stream: true,
    messages: toOpenAiMessages(system, messages),
    tools: toOpenAiTools(tools),
    tool_choice: 'auto',
    ...(isReasoningModel(model) ? { reasoning_effort: 'low' } : {}),
  });

  let text = '';
  const calls = new Map(); // index → { id, name, args }
  let finish = null;
  let usage = null;
  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    if (choice?.delta?.content) {
      text += choice.delta.content;
      onText(choice.delta.content);
    }
    for (const tc of choice?.delta?.tool_calls || []) {
      const cur = calls.get(tc.index) || { id: tc.id, name: '', args: '' };
      if (tc.id) cur.id = tc.id;
      if (tc.function?.name) cur.name += tc.function.name;
      if (tc.function?.arguments) cur.args += tc.function.arguments;
      calls.set(tc.index, cur);
    }
    if (choice?.finish_reason) finish = choice.finish_reason;
    if (chunk.x_groq?.usage) usage = chunk.x_groq.usage;
    if (chunk.usage) usage = chunk.usage;
  }

  const content = [];
  if (text) content.push({ type: 'text', text });
  for (const c of [...calls.values()]) {
    let input = {};
    try { input = c.args ? JSON.parse(c.args) : {}; } catch { input = { _raw: c.args }; }
    content.push({ type: 'tool_use', id: c.id || `call_${Math.random().toString(36).slice(2, 10)}`, name: c.name, input });
  }
  const stop_reason = calls.size ? 'tool_use' : finish === 'length' ? 'max_tokens' : 'end_turn';
  return {
    content,
    stop_reason,
    usage: {
      input_tokens: usage?.prompt_tokens || 0,
      output_tokens: usage?.completion_tokens || 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Garde-fou anti « un instant » : certains modèles annoncent une action
// (« je lance l'enregistrement… ») et terminent leur tour sans appeler l'outil.
// Le serveur relance alors le modèle avec une consigne explicite.
// ---------------------------------------------------------------------------
const FAKE_ACTION = /un instant|je lance|je cr[ée]e |je vais cr[ée]er|je vous envoie|j'enregistre|je l'enregistre|j'effectue|je proc[èe]de|en cours d[e']|veuillez patienter|je transf[èe]re|je mets [àa] jour|je modifie|je change|je place|je m'en occupe/i;

export function looksLikeFakeAction(text, toolUses) {
  return !toolUses?.length && FAKE_ACTION.test(String(text || ''));
}

export const NUDGE_TEXT = "[Système : tu as annoncé une action mais aucun outil n'a été appelé — rien n'a été fait. Appelle MAINTENANT l'outil approprié avec les informations déjà collectées (par exemple create_order avec tous les champs). Ne réponds avec du texte qu'après avoir reçu le résultat de l'outil.]";
