// Langue courante déduite de l'URL : /… (français), /en/…, /es/…
// Fournit t(cle) (textes d'interface, surcharges du propriétaire incluses),
// L(objet multilingue) et p(chemin) pour construire un lien dans la langue courante.
import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LANGS, DEFAULT_LANG } from '../data/infos';
import { texte } from '../data/content';
import { L as pick } from '../data/site';
import { useSite } from '../site/SiteProvider';

const LangContext = createContext({ lang: DEFAULT_LANG });

export const LANG_LABEL = { fr: 'Français', en: 'English', es: 'Español' };
export const LOCALE = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' };

/** Langue et chemin « nu » (sans préfixe) à partir d'un pathname. */
export function splitPath(pathname) {
  const m = /^\/(en|es)(\/|$)/.exec(pathname);
  if (m) return { lang: m[1], path: pathname.slice(m[1].length + 1) || '/' };
  return { lang: DEFAULT_LANG, path: pathname || '/' };
}

/** Chemin localisé : localePath('/services', 'en') → '/en/services'. */
export function localePath(path, lang) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

export function LangProvider({ children }) {
  const { pathname } = useLocation();
  const { lang, path } = splitPath(pathname);
  const site = useSite();
  const value = useMemo(() => ({
    lang: LANGS.includes(lang) ? lang : DEFAULT_LANG,
    path,
    t: (key) => texte(site.textes, key, lang),
    L: (v) => pick(v, lang),
    p: (to) => localePath(to, lang),
  }), [lang, path, site.textes]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
