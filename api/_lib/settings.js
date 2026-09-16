// Configuration du site pilotable par le propriétaire (via le Chef / Telegram / admin) :
// nom, slogan, coordonnées, horaires, palette, police, textes, images, listes
// (services, activités, formations, FAQ, blog, équipe, partenaires, réalisations) et chiffres.
// Les valeurs du code (src/data/*) servent de défauts ; la base ne stocke que les
// surcharges (table fi_site_settings, ligne 'main').

import { store } from './store.js';
import { env } from './env.js';
import { ENTREPRISE, HORAIRES_SEMAINE } from '../../src/data/infos.js';
import { SERVICES, ACTIVITES, EXPERTISE, FORMATIONS, FAQ, BLOG, EQUIPE, PARTENAIRES, REALISATIONS, POURQUOI, PROCESSUS, CHIFFRES } from '../../src/data/site.js';

export const PALETTE_DEFAULT = {
  primary: '#2e7d32', secondary: '#4caf50', accent: '#8bc34a', dark: '#237a45', deep: '#0f2e13',
  light: '#c8e6c9', mint: '#e8f5e9', bg: '#f9fbf8', text: '#263238', soil: '#5d3f24', loam: '#a67c52',
};

// Palettes prêtes à l'emploi que le Chef peut proposer.
export const PALETTE_PRESETS = {
  'vert nature': PALETTE_DEFAULT,
  'vert profond': { ...PALETTE_DEFAULT, primary: '#1f6b3a', secondary: '#2e8b57', accent: '#7cc243', dark: '#1f6b45', deep: '#0b2a17', light: '#cfe9d6', mint: '#e6f4ea', bg: '#f7faf7' },
  'olive terre': { ...PALETTE_DEFAULT, primary: '#5f7a2c', secondary: '#7e9a3a', accent: '#b6c95a', dark: '#5a6f2a', deep: '#232e10', light: '#dfe6c4', mint: '#f0f3e3', bg: '#fafbf5', soil: '#6b4a2b', loam: '#b08a5e' },
  'bleu lagon': { ...PALETTE_DEFAULT, primary: '#1f6f8b', secondary: '#2e9cb8', accent: '#6fd3e6', dark: '#1d6a80', deep: '#0b2c37', light: '#cfe8ef', mint: '#e7f4f8', bg: '#f6fafb', soil: '#4f3f30', loam: '#9a7a5c' },
  'terracotta': { ...PALETTE_DEFAULT, primary: '#b5472a', secondary: '#d0663f', accent: '#e8a26b', dark: '#9a3d22', deep: '#3d160c', light: '#f3d9cd', mint: '#f9ede6', bg: '#fcf8f4', soil: '#5a3a22', loam: '#a8784f' },
  'nuit forêt': { ...PALETTE_DEFAULT, primary: '#3e9b5f', secondary: '#5cb87c', accent: '#a5d86a', dark: '#2e7a52', deep: '#0a1a10', light: '#cfe6d6', mint: '#e5f1e9', bg: '#f5f8f6', text: '#1b2622' },
};

// Emplacements d'images sur le site (le Chef s'en sert pour suggérer où placer une photo).
export const IMAGE_SLOTS = {
  hero: { label: "Grande image d'accueil (fond du hero)", page: 'Accueil', defaut: '/images/hero.webp' },
  sol_profil: { label: 'Accueil — image « notre processus » (coupe de sol)', page: 'Accueil', defaut: '/images/sol-profil.webp' },
  petit_pois: { label: 'Mascotte Petit Pois (chat et section assistant)', page: 'Global', defaut: '/images/petit-pois.webp' },
  logo: { label: 'Logo du header', page: 'Global', defaut: '/images/logo.webp' },
  logo_rond: { label: 'Logo rond du pied de page', page: 'Global', defaut: '/images/logo-rond.webp' },
  contact: { label: 'Bandeau de la page Contact', page: 'Contact', defaut: '/images/contact.webp' },
  activite_approche: { label: 'Activité « Notre approche »', page: 'Activités', defaut: '/images/labo-analyse.webp' },
  activite_microorganismes: { label: 'Activité « Chasseurs de microorganismes »', page: 'Activités', defaut: '/images/microscope.webp' },
  activite_biofertilisation: { label: 'Activité « Biofertilisation »', page: 'Activités', defaut: '/images/racines.webp' },
  activite_rehabilitation: { label: 'Activité « Réhabilitation »', page: 'Activités', defaut: '/images/site-rehabilite.webp' },
  activite_innovation: { label: 'Activité « Innovation »', page: 'Activités', defaut: '/images/labo-recherche.webp' },
  og: { label: 'Image de partage (réseaux sociaux, aperçu de lien)', page: 'Global', defaut: '/images/hero.webp' },
};

export const FONT_PRESETS = ['bricolage', 'poppins', 'sora', 'outfit', 'jakarta'];

export const LISTES = ['services', 'activites', 'expertise', 'formations', 'faq', 'blog', 'equipe', 'partenaires', 'realisations', 'pourquoi'];

export const DEFAULTS = {
  nom: ENTREPRISE.nom,
  nomCourt: ENTREPRISE.nomCourt,
  slogan: { fr: 'Redonnons vie aux sols, cultivons l’avenir', en: 'Bringing soils back to life, growing the future', es: 'Devolvamos la vida a los suelos, cultivemos el futuro' },
  textes: {},                                   // surcharges du registre src/data/content.js : { cle: { fr, en, es } }
  entreprise: { adresse: ENTREPRISE.adresse, codePostal: ENTREPRISE.codePostal, ville: ENTREPRISE.ville, region: ENTREPRISE.region, pays: ENTREPRISE.pays, telephone: ENTREPRISE.telephone, mobile: ENTREPRISE.mobile, email: ENTREPRISE.email, linkedin: ENTREPRISE.linkedin, siteUrl: ENTREPRISE.siteUrl, fondation: ENTREPRISE.fondation, coords: ENTREPRISE.coords, labo: ENTREPRISE.labo },
  horaires: HORAIRES_SEMAINE,
  palette: PALETTE_DEFAULT,
  police: 'bricolage',
  images: Object.fromEntries(Object.entries(IMAGE_SLOTS).map(([k, v]) => [k, v.defaut])),
  listes: { services: SERVICES, activites: ACTIVITES, expertise: EXPERTISE, formations: FORMATIONS, faq: FAQ, blog: BLOG, equipe: EQUIPE, partenaires: PARTENAIRES, realisations: REALISATIONS, pourquoi: POURQUOI },
  processus: PROCESSUS,
  chiffres: CHIFFRES,
  version: 0,
};

function deepMerge(base, patch) {
  if (Array.isArray(patch) || patch === null || typeof patch !== 'object') return patch === undefined ? base : patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v);
  return out;
}

let cache = { at: 0, value: null };
const TTL = 15_000;

/** Configuration effective (défauts + surcharges en base). Mise en cache 15 s. */
export async function getSettings({ fresh = false } = {}) {
  if (!fresh && cache.value && Date.now() - cache.at < TTL) return cache.value;
  let overrides = {};
  try { overrides = (await store().getSettings()) || {}; } catch (e) { console.error('settings', e.message); }
  const value = deepMerge(DEFAULTS, overrides);
  cache = { at: Date.now(), value };
  return value;
}

/** Applique une surcharge (fusion profonde) et renvoie la configuration effective. */
export async function updateSettings(patch) {
  const current = (await store().getSettings()) || {};
  const next = deepMerge(current, patch);
  next.version = (Number(current.version) || 0) + 1;
  await store().saveSettings(next);
  cache = { at: 0, value: null };
  return getSettings({ fresh: true });
}

/** Vue publique (front) : configuration complète, prête à afficher. */
export function publicSettings(s) {
  return s;
}

// ---------------------------------------------------------------------------
// Images : téléversement dans Supabase Storage (bucket public)
// ---------------------------------------------------------------------------
export async function uploadImage(buffer, { name = 'image', contentType = 'image/jpeg' } = {}) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg';
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const path = `${Date.now()}-${safe}.${ext}`;
  return store().uploadPublicFile(path, buffer, contentType);
}

export function isHex(s) { return /^#[0-9a-f]{6}$/i.test(String(s || '')); }
export { env };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function fetchWithTimeout(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; FertilInnovBot/1.0)', accept: 'image/*,text/html;q=0.9,*/*;q=0.8' } });
  } finally { clearTimeout(t); }
}

/** URL fournie par le propriétaire → image ré-hébergée chez nous (fichier image ou og:image d'une page). */
export async function resolveImageUrl(input, depth = 0) {
  const url = String(input || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('URL invalide (elle doit commencer par http:// ou https://).');
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`Impossible de télécharger cette adresse (HTTP ${r.status}).`);
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type.startsWith('image/')) {
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image trop lourde (max 8 Mo).');
    if (buffer.length < 8 * 1024) throw new Error('Image trop petite pour le site.');
    const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'image').replace(/\.[a-z0-9]+$/i, '');
    return { url: await uploadImage(buffer, { name, contentType: type === 'image/jpg' ? 'image/jpeg' : type }), source: 'fichier' };
  }
  if (type.includes('text/html') && depth < 1) {
    const html = (await r.text()).slice(0, 400_000);
    const meta = (prop) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'));
      return m?.[1];
    };
    const candidate = meta('og:image') || meta('og:image:secure_url') || meta('twitter:image');
    if (candidate) {
      const res = await resolveImageUrl(new URL(candidate.replace(/&amp;/g, '&'), url).href, depth + 1);
      return { ...res, source: 'page' };
    }
    throw new Error('Cette adresse est une page web sans image principale détectable.');
  }
  throw new Error(`Cette adresse ne pointe pas vers une image (type reçu : ${type || 'inconnu'}).`);
}

/** Déclenche un nouveau déploiement Vercel (pré-rendu SEO à jour) si un hook est configuré. */
let lastDeploy = 0;
export async function triggerRedeploy(reason = 'settings') {
  if (!env.deployHook) return { ok: false, raison: 'VERCEL_DEPLOY_HOOK_URL non configuré' };
  if (Date.now() - lastDeploy < 60_000) return { ok: true, note: 'déploiement déjà lancé il y a moins d’une minute' };
  lastDeploy = Date.now();
  try {
    const r = await fetch(env.deployHook, { method: 'POST' });
    return { ok: r.ok, statut: r.status, raison: reason };
  } catch (e) { return { ok: false, raison: e.message }; }
}
