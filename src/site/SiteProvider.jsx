// Configuration du site pilotée par le propriétaire (via le Chef / Telegram / admin).
// Ordre de priorité : configuration injectée au pré-rendu (window.__SITE__) →
// cache de session → défauts du code, puis rafraîchie depuis /api/site au montage.
// La palette est appliquée en variables CSS, la police via Google Fonts.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ENTREPRISE, HORAIRES_SEMAINE } from '../data/infos';
import { SERVICES, ACTIVITES, EXPERTISE, FORMATIONS, FAQ, BLOG, EQUIPE, PARTENAIRES, REALISATIONS, POURQUOI, PROCESSUS, CHIFFRES } from '../data/site';

export const FONT_PRESETS = {
  bricolage: { display: 'Bricolage Grotesque', sans: 'Manrope', css: 'family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Manrope:wght@400;500;600;700' },
  poppins: { display: 'Poppins', sans: 'Poppins', css: 'family=Poppins:wght@300;400;500;600;700;800' },
  sora: { display: 'Sora', sans: 'Inter', css: 'family=Sora:wght@300..800&family=Inter:wght@400;500;600' },
  outfit: { display: 'Outfit', sans: 'DM Sans', css: 'family=Outfit:wght@300..800&family=DM+Sans:wght@400;500;600;700' },
  jakarta: { display: 'Plus Jakarta Sans', sans: 'Plus Jakarta Sans', css: 'family=Plus+Jakarta+Sans:wght@300..800' },
};

export const PALETTE_DEFAULT = {
  primary: '#2e7d32', secondary: '#4caf50', accent: '#8bc34a', dark: '#237a45', deep: '#0f2e13',
  light: '#c8e6c9', mint: '#e8f5e9', bg: '#f9fbf8', text: '#263238', soil: '#5d3f24', loam: '#a67c52',
};

export const IMAGES_DEFAULT = {
  hero: '/images/hero.webp', sol_profil: '/images/sol-profil.webp', petit_pois: '/images/petit-pois.webp',
  logo: '/images/logo.webp', logo_rond: '/images/logo-rond.webp', contact: '/images/contact.webp',
  activite_approche: '/images/labo-analyse.webp', activite_microorganismes: '/images/microscope.webp', activite_biofertilisation: '/images/racines.webp',
  activite_rehabilitation: '/images/site-rehabilite.webp', activite_innovation: '/images/labo-recherche.webp', og: '/images/hero.webp',
};

export const SITE_DEFAULT = {
  nom: ENTREPRISE.nom,
  nomCourt: ENTREPRISE.nomCourt,
  slogan: { fr: 'Redonnons vie aux sols, cultivons l’avenir', en: 'Bringing soils back to life, growing the future', es: 'Devolvamos la vida a los suelos, cultivemos el futuro' },
  textes: {},
  entreprise: { ...ENTREPRISE },
  horaires: HORAIRES_SEMAINE,
  palette: PALETTE_DEFAULT,
  police: 'bricolage',
  images: IMAGES_DEFAULT,
  listes: { services: SERVICES, activites: ACTIVITES, expertise: EXPERTISE, formations: FORMATIONS, faq: FAQ, blog: BLOG, equipe: EQUIPE, partenaires: PARTENAIRES, realisations: REALISATIONS, pourquoi: POURQUOI },
  processus: PROCESSUS,
  chiffres: CHIFFRES,
  version: 0,
};

const SiteContext = createContext(SITE_DEFAULT);
const CACHE_KEY = 'fi-site';
const isBrowser = typeof window !== 'undefined';

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export function applyPalette(palette) {
  if (!isBrowser) return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries({ ...PALETTE_DEFAULT, ...(palette || {}) })) {
    const rgb = hexToRgb(v);
    if (rgb) root.style.setProperty(`--fi-${k}`, rgb);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && palette?.dark) meta.setAttribute('content', palette.dark);
}

export function applyFonts(preset) {
  if (!isBrowser) return;
  const f = FONT_PRESETS[preset] || FONT_PRESETS.bricolage;
  let link = document.getElementById('site-fonts');
  if (!link) { link = document.createElement('link'); link.id = 'site-fonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
  const href = `https://fonts.googleapis.com/css2?${f.css}&display=swap`;
  if (link.href !== href) link.href = href;
  document.documentElement.style.setProperty('--font-display', `"${f.display}"`);
  document.documentElement.style.setProperty('--font-sans', `"${f.sans}"`);
}

export function mergeSite(data) {
  if (!data) return SITE_DEFAULT;
  return {
    ...SITE_DEFAULT, ...data,
    textes: { ...(data.textes || {}) },
    entreprise: { ...SITE_DEFAULT.entreprise, ...(data.entreprise || {}) },
    palette: { ...PALETTE_DEFAULT, ...(data.palette || {}) },
    images: { ...IMAGES_DEFAULT, ...(data.images || {}) },
    listes: { ...SITE_DEFAULT.listes, ...(data.listes || {}) },
    chiffres: { ...SITE_DEFAULT.chiffres, ...(data.chiffres || {}) },
  };
}

export function SiteProvider({ children, initial }) {
  const [site, setSite] = useState(() => {
    if (initial) return mergeSite(initial);
    if (isBrowser && window.__SITE__) return mergeSite(window.__SITE__);
    try {
      const cached = isBrowser ? JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null') : null;
      return cached ? mergeSite(cached) : SITE_DEFAULT;
    } catch { return SITE_DEFAULT; }
  });

  useEffect(() => {
    let alive = true;
    fetch('/api/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const merged = mergeSite(data);
        setSite(merged);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignoré */ }
      })
      .catch(() => { /* hors ligne : on garde les défauts */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => { applyPalette(site.palette); }, [site.palette]);
  useEffect(() => { applyFonts(site.police); }, [site.police]);

  const value = useMemo(() => site, [site]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}

/** Props <img> pour un emplacement : src configuré + repli sur l'image d'origine si elle ne charge pas. */
export function useImage() {
  const { images } = useContext(SiteContext);
  return (slot) => ({
    src: images[slot] || IMAGES_DEFAULT[slot],
    onError: (e) => { const d = IMAGES_DEFAULT[slot]; if (d && !e.currentTarget.src.endsWith(d)) e.currentTarget.src = d; },
  });
}

/** Résout l'image d'un élément de liste : URL absolue, ou nom de fichier dans /images. */
export function imgSrc(v) {
  if (!v) return '';
  if (/^(https?:)?\/\//.test(v) || v.startsWith('/')) return v;
  return `/images/${v}.webp`;
}
