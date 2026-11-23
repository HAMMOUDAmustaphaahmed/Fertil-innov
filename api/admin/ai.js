// Réglages de l'assistant IA (Petit Pois et le Chef), modifiables sans toucher au code ni à l'hébergeur.
//   GET  → réglages actuels (la clé n'est jamais renvoyée : seulement ses 4 derniers caractères)
//   POST { action: 'models', provider, apiKey?, baseUrl? } → modèles disponibles chez le fournisseur pour cette clé
//   POST { action: 'test', provider, model, apiKey?, baseUrl? } → essai réel chez le fournisseur, rien n'est enregistré
//   POST { action: 'save', ..., password }                 → essai, puis enregistrement seulement s'il réussit
// Changer la clé, le fournisseur ou l'adresse du service redemande le mot de passe du compte.
import { env, baseAi, defaultModels } from '../_lib/env.js';
import { json, error, readJson } from '../_lib/http.js';
import { adminSession, sameOrigin } from '../_lib/admin.js';
import { loadVault, loadAiConfig, saveAiConfig, confirmPassword, getAccount, AI_LIMITS } from '../_lib/vault.js';
import { ensureAi, invalidateAi } from '../_lib/ai.js';
import { probe, listModels } from '../_lib/llm.js';
import { PROVIDERS, PROVIDER_IDS } from '../_lib/providers.js';
import { broadcast } from '../_lib/telegram.js';

export const maxDuration = 60;

async function view() {
  await ensureAi({ fresh: true });
  const v = await loadVault();
  const ai = v.ai || {};
  const base = baseAi();
  return {
    actif: { enabled: env.aiEnabled, provider: env.providerId || env.provider, label: PROVIDERS[env.providerId || env.provider]?.label || env.provider, model: env.model, guardModel: env.guardModel, source: env.aiSource },
    reglages: {
      enabled: ai.enabled !== false, provider: ai.provider || base.provider, model: ai.model || '', guardModel: ai.guardModel || '', baseUrl: ai.baseUrl || '', extra: ai.extra || '',
      limits: { maxMessagesPerSession: env.maxMessagesPerSession, maxMessagesPerIpPerDay: env.maxMessagesPerIpPerDay, dailyTokenBudget: env.dailyTokenBudget, maxOutputTokens: env.maxOutputTokens },
      apiKeyHint: ai.apiKeyHint || '', apiKeyProvider: ai.apiKeyProvider || '', updatedAt: ai.updatedAt || '', updatedBy: ai.updatedBy || '',
    },
    serveur: base, // clés présentes dans les variables du serveur (réglage de secours : Anthropic et Groq uniquement)
    choix: {
      providers: PROVIDER_IDS.map((id) => ({ id, label: PROVIDERS[id].label, custom: !!PROVIDERS[id].custom, keysUrl: PROVIDERS[id].keysUrl || '', defaut: id === 'anthropic' || id === 'groq' ? defaultModels(id).model : '', cleServeur: !!base.hasKey[id] })),
      limits: AI_LIMITS,
    },
    journal: (v.journal || []).slice(0, 25),
  };
}

/** Clé à utiliser pour un fournisseur : celle saisie maintenant, sinon celle déjà enregistrée, sinon celle du serveur. */
async function resolveKey(provider, typed) {
  if (typeof typed === 'string' && typed.trim()) return typed.trim();
  const saved = await loadAiConfig();
  if (saved?.apiKey && saved.apiKeyProvider === provider) return saved.apiKey;
  if (provider === 'groq') return process.env.GROQ_API_KEY || '';
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY || '';
  return '';
}

export async function GET(request) {
  if (!adminSession(request)) return error(401, 'Non autorisé.');
  try { return json(await view()); } catch (e) { console.error('admin/ai', e); return error(500, e.message); }
}

export async function POST(request) {
  const session = adminSession(request);
  if (!session) return error(401, 'Non autorisé.');
  if (!sameOrigin(request)) return error(403, 'Requête refusée.');
  const body = await readJson(request);
  if (!body) return error(400, 'Requête invalide.');
  try {
    const provider = PROVIDERS[body.provider] ? body.provider : env.providerId || env.provider;
    const native = provider === 'anthropic' || provider === 'groq';
    const saved = await loadAiConfig();
    const baseUrl = PROVIDERS[provider].custom ? String(body.baseUrl || saved?.baseUrl || '').trim() : '';
    const model = String(body.model || '').trim() || (native ? defaultModels(provider).model : '');
    const apiKey = await resolveKey(provider, body.apiKey);

    if (body.action === 'models') {
      if (!apiKey) return json({ ok: false, erreur: 'Saisissez d’abord la clé de ce fournisseur.' });
      return json(await listModels({ provider, apiKey, baseUrl }));
    }

    if (body.action === 'test') {
      if (!apiKey) return json({ ok: false, erreur: 'Aucune clé pour ce fournisseur : saisissez-en une.' });
      if (!model) return json({ ok: false, erreur: 'Choisissez un modèle (bouton « Charger les modèles »).' });
      return json(await probe({ provider, apiKey, model, baseUrl }));
    }

    if (body.action === 'save') {
      const typedKey = typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey.trim() : undefined;
      const sensitive = typedKey !== undefined || body.clearKey === true || provider !== (saved?.provider || baseAi().provider) || (PROVIDERS[provider].custom && baseUrl !== (saved?.baseUrl || ''));
      if (sensitive && !(await confirmPassword(session.accountId, body.password))) return error(403, 'Mot de passe incorrect : il est demandé pour changer la clé, le fournisseur ou l’adresse du service.', { needPassword: true });
      const enabled = body.enabled !== false;
      // On n'enregistre un réglage actif que s'il fonctionne vraiment : le chatbot ne tombe jamais à cause d'une faute de frappe.
      if (enabled) {
        if (!apiKey) return error(400, 'Aucune clé pour ce fournisseur : saisissez-en une.');
        if (!model) return error(400, 'Choisissez un modèle (bouton « Charger les modèles »).');
        const t = await probe({ provider, apiKey, model, baseUrl });
        if (!t.ok) return error(400, `Essai refusé, rien n’a été enregistré : ${t.erreur}`, { test: t });
      }
      const patch = { enabled, provider, model: String(body.model || '').trim(), guardModel: String(body.guardModel || '').trim(), extra: body.extra, limits: body.limits };
      if (PROVIDERS[provider].custom) patch.baseUrl = baseUrl;
      if (typedKey !== undefined) patch.apiKey = typedKey; else if (body.clearKey === true) patch.apiKey = '';
      const acc = await getAccount(session.accountId);
      const { keyChanged } = await saveAiConfig(patch, { login: acc?.login });
      invalidateAi();
      if (keyChanged || provider !== (saved?.provider || baseAi().provider)) await broadcast(`🔑 Réglages de l’assistant IA modifiés depuis l’espace de pilotage par ${acc?.login || 'un administrateur'} : fournisseur ${PROVIDERS[provider].label}${keyChanged ? `, clé ${typedKey ? 'remplacée' : 'retirée'}` : ''}.`).catch(() => {});
      return json({ ok: true, ...(await view()) });
    }
    return error(400, 'Action inconnue.');
  } catch (e) {
    console.error('admin/ai', e);
    return error(400, e.message);
  }
}
