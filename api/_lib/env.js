// Lecture centralisée des variables d'environnement (Vercel → Settings → Environment Variables).
// Les valeurs par défaut correspondent aux garde-fous décrits dans le README.

import { compatOf } from './providers.js';

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();

export const env = {
  // Fournisseur du modèle : 'anthropic' (Claude, défaut) ou 'groq' (gratuit, compatible OpenAI).
  provider,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  // Groq : chaque modèle a son propre quota (8 000 tokens/min sur le palier gratuit) → on répartit
  // Petit Pois, le Chef et le filtre/traducteur sur trois modèles différents, avec un repli si l'un sature.
  model: process.env.POIS_MODEL || process.env.LEA_MODEL || (provider === 'groq' ? 'openai/gpt-oss-120b' : 'claude-sonnet-5'),
  chefModel: process.env.CHEF_MODEL || (provider === 'groq' ? 'qwen/qwen3.8-27b' : ''),
  fallbackModels: (process.env.FALLBACK_MODELS || (provider === 'groq' ? 'qwen/qwen3.8-27b,openai/gpt-oss-120b,openai/gpt-oss-20b' : '')).split(',').map((s) => s.trim()).filter(Boolean),
  translateModel: process.env.TRANSLATE_MODEL || (provider === 'groq' ? 'openai/gpt-oss-20b' : 'claude-haiku-4-5'),
  guardEnabled: (process.env.POIS_GUARD || process.env.LEA_GUARD || 'on') !== 'off',
  guardModel: process.env.POIS_GUARD_MODEL || process.env.LEA_GUARD_MODEL || (provider === 'groq' ? 'openai/gpt-oss-20b' : 'claude-haiku-4-5'),
  offtopicStrikes: num(process.env.CHAT_OFFTOPIC_STRIKES, 3),

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  tablePrefix: process.env.SUPABASE_TABLE_PREFIX || 'fi_',
  storageBucket: process.env.SUPABASE_BUCKET || 'fertil',

  sessionSecret: process.env.SESSION_SECRET,

  // Emails : mailjet (SMTP, gratuit) · gmail (mot de passe d'application) · resend (domaine vérifié).
  emailProvider: (process.env.EMAIL_PROVIDER || (process.env.MAILJET_API_KEY ? 'mailjet' : process.env.GMAIL_USER ? 'gmail' : 'resend')).toLowerCase(),
  mailjetKey: process.env.MAILJET_API_KEY,
  mailjetSecret: process.env.MAILJET_SECRET_KEY,
  mailjetSender: process.env.MAILJET_SENDER,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  resendKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || '',
  companyEmail: process.env.COMPANY_EMAIL || process.env.BAKERY_EMAIL,   // boîte qui reçoit les demandes

  // Garde-fous
  maxMessagesPerSession: num(process.env.CHAT_MAX_MESSAGES_PER_SESSION, 20),
  maxMessagesPerIpPerDay: num(process.env.CHAT_MAX_MESSAGES_PER_IP_PER_DAY, 80),
  maxSessionsPerIpPerDay: num(process.env.CHAT_MAX_SESSIONS_PER_IP_PER_DAY, 10),
  minIntervalMs: num(process.env.CHAT_MIN_INTERVAL_MS, 2500),
  maxInputChars: num(process.env.CHAT_MAX_INPUT_CHARS, 500),
  historyTurns: num(process.env.CHAT_HISTORY_TURNS, 12),
  dailyTokenBudget: num(process.env.CHAT_DAILY_TOKEN_BUDGET, 2_000_000),
  maxOutputTokens: num(process.env.CHAT_MAX_OUTPUT_TOKENS, 1200),
  maxLeadsPerSession: num(process.env.LEADS_MAX_PER_SESSION, 2),
  maxLeadsPerEmailPerDay: num(process.env.LEADS_MAX_PER_EMAIL_PER_DAY, 3),

  siteUrl: (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, ''),
  cronSecret: process.env.CRON_SECRET,
  // Adresse appelée pour régénérer les pages pré-rendues : hook de déploiement Vercel, ou tout autre hook (DEPLOY_HOOK_URL).
  deployHook: process.env.VERCEL_DEPLOY_HOOK_URL || process.env.DEPLOY_HOOK_URL || '',

  adminPassword: process.env.ADMIN_PASSWORD,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,

  // Production : déploiement Vercel de production, ou serveur autonome (server.mjs, NODE_ENV=production) hors Vercel.
  isProd: process.env.VERCEL_ENV === 'production' || (!process.env.VERCEL && process.env.NODE_ENV === 'production'),
};

// ---------------------------------------------------------------------------
// Réglages de l'IA modifiables sans toucher au serveur (espace de pilotage, voir vault.js et ai.js).
// Les variables du serveur restent le réglage de secours : applyAi(null) y revient.
// ---------------------------------------------------------------------------
const AI_KEYS = ['provider', 'anthropicKey', 'groqKey', 'model', 'chefModel', 'fallbackModels', 'translateModel', 'guardModel',
  'maxMessagesPerSession', 'maxMessagesPerIpPerDay', 'dailyTokenBudget', 'maxOutputTokens'];
const BASE = Object.fromEntries(AI_KEYS.map((k) => [k, Array.isArray(env[k]) ? [...env[k]] : env[k]]));
const MODELS = {
  groq: { model: 'openai/gpt-oss-120b', chefModel: 'qwen/qwen3.8-27b', fallbackModels: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'], translateModel: 'openai/gpt-oss-20b', guardModel: 'openai/gpt-oss-20b' },
  anthropic: { model: 'claude-sonnet-5', chefModel: '', fallbackModels: [], translateModel: 'claude-haiku-4-5', guardModel: 'claude-haiku-4-5' },
};
export const defaultModels = (p) => MODELS[p === 'groq' ? 'groq' : 'anthropic'];
export const baseAi = () => ({ provider: BASE.provider, model: BASE.model, hasKey: { anthropic: !!BASE.anthropicKey, groq: !!BASE.groqKey } });
// providerId : fournisseur réellement utilisé (openai, mistral…). « provider » reste le FORMAT d'API attendu par le
// reste du code : 'anthropic', ou 'groq' pour tout fournisseur compatible OpenAI. compat : adresse de ce fournisseur.
env.aiEnabled = true; env.aiExtra = ''; env.aiSource = 'serveur'; env.providerId = env.provider; env.compat = null;

export function applyAi(cfg) {
  for (const k of AI_KEYS) env[k] = Array.isArray(BASE[k]) ? [...BASE[k]] : BASE[k];
  env.aiEnabled = true; env.aiExtra = ''; env.aiSource = 'serveur'; env.providerId = env.provider; env.compat = null;
  if (!cfg) return;
  env.aiEnabled = cfg.enabled !== false;
  env.aiExtra = cfg.extra || '';
  const ownKey = cfg.apiKey && cfg.apiKeyProvider === cfg.provider;
  const compat = cfg.provider ? compatOf(cfg.provider, cfg.baseUrl) : null;
  if (cfg.provider === 'anthropic' || cfg.provider === 'groq') {
    const keyField = cfg.provider === 'groq' ? 'groqKey' : 'anthropicKey';
    // Changement de fournisseur : uniquement s'il existe une clé pour lui (saisie dans l'espace, ou déjà sur le serveur).
    if (cfg.provider !== env.provider && (ownKey || BASE[keyField])) {
      env.provider = cfg.provider; env.providerId = cfg.provider;
      Object.assign(env, { ...defaultModels(cfg.provider), fallbackModels: [...defaultModels(cfg.provider).fallbackModels] });
    }
    if (ownKey && cfg.provider === env.provider) env[keyField] = cfg.apiKey;
    if (cfg.provider === env.provider) { if (cfg.model) env.model = cfg.model; if (cfg.guardModel) env.guardModel = cfg.guardModel; }
  } else if (compat && ownKey && cfg.model) {
    // Fournisseur compatible OpenAI : un seul modèle pour tous les rôles (Petit Pois, le Chef, traduction, filtre).
    env.provider = 'groq'; env.providerId = cfg.provider; env.compat = compat; env.groqKey = cfg.apiKey;
    env.model = cfg.model; env.chefModel = cfg.model; env.translateModel = cfg.model; env.guardModel = cfg.guardModel || cfg.model; env.fallbackModels = [];
  }
  for (const k of ['maxMessagesPerSession', 'maxMessagesPerIpPerDay', 'dailyTokenBudget', 'maxOutputTokens']) if (Number.isFinite(cfg.limits?.[k])) env[k] = cfg.limits[k];
  env.aiSource = 'espace de pilotage';
}

export function assertEnv(keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    const err = new Error(`Configuration incomplète : ${missing.join(', ')}`);
    err.code = 'CONFIG';
    throw err;
  }
}
