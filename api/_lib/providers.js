// Catalogue des fournisseurs d'IA proposés dans l'espace de pilotage.
//   format 'anthropic' : API native de Claude
//   format 'openai'    : API « chat completions » compatible OpenAI — la grande majorité des fournisseurs
// Aucun nom de modèle n'est figé ici pour les fournisseurs compatibles : la liste réelle est demandée au
// fournisseur (bouton « Charger les modèles »), puis le modèle choisi est essayé avant d'être enregistré.
//   tokenParam : nom du paramètre de longueur maximale attendu par le fournisseur.
export const PROVIDERS = {
  anthropic: { label: 'Anthropic (Claude)', format: 'anthropic', keysUrl: 'https://console.anthropic.com/settings/keys' },
  groq: { label: 'Groq', format: 'openai', native: true, baseUrl: 'https://api.groq.com/openai/v1', tokenParam: 'max_completion_tokens', keysUrl: 'https://console.groq.com/keys' },
  openai: { label: 'OpenAI', format: 'openai', baseUrl: 'https://api.openai.com/v1', tokenParam: 'max_completion_tokens', keysUrl: 'https://platform.openai.com/api-keys' },
  gemini: { label: 'Google Gemini', format: 'openai', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', tokenParam: 'max_tokens', keysUrl: 'https://aistudio.google.com/apikey' },
  mistral: { label: 'Mistral AI', format: 'openai', baseUrl: 'https://api.mistral.ai/v1', tokenParam: 'max_tokens', keysUrl: 'https://console.mistral.ai/api-keys' },
  deepseek: { label: 'DeepSeek', format: 'openai', baseUrl: 'https://api.deepseek.com/v1', tokenParam: 'max_tokens', keysUrl: 'https://platform.deepseek.com/api_keys' },
  xai: { label: 'xAI (Grok)', format: 'openai', baseUrl: 'https://api.x.ai/v1', tokenParam: 'max_tokens', keysUrl: 'https://console.x.ai' },
  openrouter: { label: 'OpenRouter', format: 'openai', baseUrl: 'https://openrouter.ai/api/v1', tokenParam: 'max_tokens', keysUrl: 'https://openrouter.ai/keys' },
  together: { label: 'Together AI', format: 'openai', baseUrl: 'https://api.together.xyz/v1', tokenParam: 'max_tokens', keysUrl: 'https://api.together.ai/settings/api-keys' },
  fireworks: { label: 'Fireworks AI', format: 'openai', baseUrl: 'https://api.fireworks.ai/inference/v1', tokenParam: 'max_tokens', keysUrl: 'https://fireworks.ai/account/api-keys' },
  cerebras: { label: 'Cerebras', format: 'openai', baseUrl: 'https://api.cerebras.ai/v1', tokenParam: 'max_tokens', keysUrl: 'https://cloud.cerebras.ai' },
  custom: { label: 'Autre (compatible OpenAI)', format: 'openai', custom: true, tokenParam: 'max_tokens' },
};
export const PROVIDER_IDS = Object.keys(PROVIDERS);

/** Adresse d'un service personnalisé : HTTPS obligatoire, et jamais une machine interne (le serveur ne doit pas pouvoir être utilisé pour sonder un réseau privé). */
export function checkBaseUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return { erreur: 'Adresse invalide (exemple : https://api.exemple.com/v1).' }; }
  if (u.protocol !== 'https:') return { erreur: 'L’adresse doit commencer par https://.' };
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':') || !h.includes('.')) return { erreur: 'Adresse interne ou adresse IP refusée : indiquez le nom de domaine public du service.' };
  if (u.username || u.password) return { erreur: 'L’adresse ne doit pas contenir d’identifiants.' };
  return { url: `${u.origin}${u.pathname.replace(/\/+$/, '')}` };
}

/** Adresse et réglages effectifs d'un fournisseur au format OpenAI. */
export function compatOf(providerId, baseUrl) {
  const p = PROVIDERS[providerId];
  if (!p || p.format !== 'openai') return null;
  const url = p.custom ? checkBaseUrl(baseUrl).url : p.baseUrl;
  return url ? { baseUrl: url, tokenParam: p.tokenParam, groq: providerId === 'groq' } : null;
}
