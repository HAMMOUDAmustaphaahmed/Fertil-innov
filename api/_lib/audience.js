// Mesure d'audience sans cookie et sans donnée personnelle.
// Chaque page vue incrémente des compteurs agrégés par jour dans la table des compteurs (fi_counters) :
//   pv:2026-11-23:p:/services   pages vues de cette page ce jour-là
//   pv:2026-11-23:v             visites (chargements du site)
//   pv:2026-11-23:s:google      visites par provenance
//   pv:2026-11-23:d:mobile      visites par type d'appareil
// Rien d'autre n'est enregistré : ni adresse IP, ni identifiant de visiteur, ni cookie, ni stockage dans le
// navigateur. Aucun bandeau de consentement n'est donc nécessaire. Les valeurs sont volontairement limitées à des
// listes fermées (pages connues, provenances connues) : personne ne peut créer de compteurs arbitraires.
import { store } from './store.js';
import { parisNow, LANGS } from '../../src/data/infos.js';

const KEEP = 10 * 365 * 24 * 3600; // « fenêtre » de dix ans : les compteurs journaliers ne sont jamais remis à zéro
// Pages du site (mêmes chemins que le pré-rendu) ; toute autre adresse est comptée comme « autre ».
export const PAGES = ['/', '/services', '/activites', '/expertise', '/formations', '/chiffres', '/blog', '/equipe', '/faq', '/contact', '/mentions-legales'];

// Provenance → libellé. Tout site non listé est regroupé sous « autre site ».
const SOURCES = [
  [/(^|\.)gemini\.google\.com$/, 'gemini'], [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)qwant\.com$/, 'qwant'], [/(^|\.)ecosia\.org$/, 'ecosia'], [/(^|\.)yahoo\./, 'yahoo'], [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'], [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)(twitter\.com|x\.com|t\.co)$/, 'x'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'], [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'], [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)(claude\.ai|anthropic\.com)$/, 'claude'], [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
];
const BOTS = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|pingdom|uptime|facebookexternalhit|embedly|curl|wget|python|httpclient/i;

const bareHost = (h) => String(h || '').split(',')[0].trim().toLowerCase().replace(/^www\./, '').split(':')[0];

export function normalizePath(raw) {
  const p = String(raw || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (p.length > 80) return 'autre';
  const m = /^\/(en|es)(?=\/|$)/.exec(p);
  const lang = m && LANGS.includes(m[1]) ? m[1] : 'fr';
  const bare = (m ? p.slice(m[0].length) : p) || '/';
  if (!PAGES.includes(bare)) return 'autre';
  return lang === 'fr' ? bare : bare === '/' ? `/${lang}` : `/${lang}${bare}`;
}

export function classifySource(referrer, host) {
  if (!referrer) return 'direct';
  let h;
  try { h = bareHost(new URL(referrer).hostname); } catch { return 'direct'; }
  if (!h || h === bareHost(host)) return 'direct'; // rechargement de la page
  for (const [rx, label] of SOURCES) if (rx.test(h)) return label;
  return 'autre site';
}

export const isBot = (ua) => !ua || BOTS.test(ua);
export const deviceOf = (ua) => (/iPad|Tablet/i.test(ua) ? 'tablette' : /Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : 'ordinateur');

/** Enregistre une page vue. entry = premier affichage après un chargement complet du site (= une visite). */
export async function recordHit({ path, referrer, entry, ua, host }) {
  const day = parisNow().isoDate;
  const s = store();
  const keys = [`pv:${day}:p:${normalizePath(path)}`];
  if (entry) keys.push(`pv:${day}:v`, `pv:${day}:s:${classifySource(referrer, host)}`, `pv:${day}:d:${deviceOf(ua)}`);
  await Promise.all(keys.map((k) => s.bumpCounter(k, KEEP)));
}

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Synthèse des N derniers jours (aujourd'hui compris). */
export async function audienceSince(jours = 7) {
  const n = Math.max(1, Math.min(366, Number(jours) || 7));
  const today = parisNow().isoDate;
  return audienceRange(addDays(today, -(n - 1)), today);
}

/** Synthèse entre deux jours (AAAA-MM-JJ, bornes comprises). */
export async function audienceRange(du, au) {
  const n = Math.round((Date.parse(`${au}T12:00:00Z`) - Date.parse(`${du}T12:00:00Z`)) / 86_400_000) + 1;
  const rows = await store().listCounters(`pv:${du}`, `pv:${au}:~`);
  const out = { periode_jours: n, visites: 0, pages_vues: 0, pages: {}, provenances: {}, appareils: {}, par_jour: {} };
  for (const { key, count } of rows) {
    const [, day, kind, ...rest] = key.split(':');
    const value = rest.join(':');
    const c = Number(count) || 0;
    const d = (out.par_jour[day] ||= { visites: 0, pages_vues: 0 });
    if (kind === 'v') { out.visites += c; d.visites += c; }
    else if (kind === 'p') { out.pages_vues += c; d.pages_vues += c; out.pages[value] = (out.pages[value] || 0) + c; }
    else if (kind === 's') out.provenances[value] = (out.provenances[value] || 0) + c;
    else if (kind === 'd') out.appareils[value] = (out.appareils[value] || 0) + c;
  }
  const sorted = (o, max) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, max));
  out.pages = sorted(out.pages, 10); out.provenances = sorted(out.provenances, 10); out.appareils = sorted(out.appareils, 5);
  out.par_jour = Object.fromEntries(Object.entries(out.par_jour).sort());
  return out;
}
