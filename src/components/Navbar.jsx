import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { useLang, LANG_LABEL, localePath } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { LANGS } from '../data/infos';
import { openPois } from '../lib/pois';
import { setScrollLocked } from '../hooks/useSmoothScroll';

const LINKS = [
  { to: '/services', key: 'nav_services' },
  { to: '/activites', key: 'nav_activites' },
  { to: '/expertise', key: 'nav_expertise' },
  { to: '/formations', key: 'nav_formations' },
  { to: '/chiffres', key: 'nav_chiffres' },
  { to: '/blog', key: 'nav_blog' },
  { to: '/sols', key: 'nav_guide' },
  { to: '/faq', key: 'nav_faq' },
];

function LangSwitch({ dark }) {
  const { lang, path, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={t('nav_langue')}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors min-h-[40px] ${dark ? 'text-white/90 hover:bg-white/10' : 'text-fi-dark hover:bg-fi-mint'}`}>
        <Globe size={16} aria-hidden /> {lang} <ChevronDown size={14} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-40 rounded-2xl bg-white shadow-leaf border border-fi-light p-1.5 z-50">
            {LANGS.map((l) => (
              <li key={l} role="option" aria-selected={l === lang}>
                <Link to={localePath(path, l)} onClick={() => setOpen(false)} hrefLang={l} lang={l}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${l === lang ? 'bg-fi-mint text-fi-dark font-semibold' : 'text-fi-text hover:bg-fi-bg'}`}>
                  {LANG_LABEL[l]} <span className="text-xs uppercase text-fi-primary/70">{l}</span>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { t, p, lang } = useLang();
  const site = useSite();
  const img = useImage();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dark = false; // header toujours clair (fond menthe fixe)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setScrollLocked(true);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; setScrollLocked(false); };
  }, [open]);

  return (
    <>
    <header className={`fixed inset-x-0 top-0 z-40 bg-fi-mint border-b border-fi-light/70 transition-shadow duration-300 ${scrolled ? 'shadow-soft' : ''}`} style={{ height: 'var(--header-h)' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-fi-dark">{lang === 'fr' ? 'Aller au contenu' : lang === 'en' ? 'Skip to content' : 'Ir al contenido'}</a>
      <div className="wrap h-full flex items-center justify-between gap-4">
        <Link to={p('/')} className="flex items-center shrink-0" aria-label={site.nom}>
          <img {...img('logo')} alt={site.nom} width={150} height={52} className="h-10 sm:h-11 w-auto" />
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5" aria-label="Navigation principale">
          {LINKS.map(({ to, key }) => (
            <NavLink key={to} to={p(to)} className={({ isActive }) => `rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${isActive ? (dark ? 'bg-white/15 text-white' : 'bg-fi-mint text-fi-dark') : dark ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-fi-text/80 hover:text-fi-dark hover:bg-fi-mint'}`}>
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LangSwitch dark={dark && !open} />
          <Link to={p("/contact")} className={`hidden md:inline-flex whitespace-nowrap ${dark ? "btn-light" : "btn-primary"} !py-2.5 !px-5 text-sm`}>{t('nav_bouton')}</Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu"
            className={`xl:hidden inline-flex h-11 w-11 items-center justify-center rounded-full ${dark && !open ? 'text-white hover:bg-white/10' : 'text-fi-dark hover:bg-fi-mint'}`}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

    </header>
      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-nav" aria-label="Navigation mobile" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="xl:hidden fixed inset-x-0 bottom-0 z-40 bg-fi-bg overflow-y-auto" data-lenis-prevent style={{ top: 'var(--header-h)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <ul className="wrap py-4 flex flex-col xl:hidden">
              <li><NavLink to={p('/')} end className={({ isActive }) => `block rounded-2xl px-4 py-3.5 text-lg font-display font-semibold ${isActive ? 'bg-fi-mint text-fi-dark' : 'text-fi-text'}`}>{t('nav_accueil')}</NavLink></li>
              {LINKS.map(({ to, key }) => (
                <li key={to}><NavLink to={p(to)} className={({ isActive }) => `block rounded-2xl px-4 py-3.5 text-lg font-display font-semibold ${isActive ? 'bg-fi-mint text-fi-dark' : 'text-fi-text'}`}>{t(key)}</NavLink></li>
              ))}
              <li className="mt-3 px-2"><Link to={p('/contact')} className="btn-primary w-full">{t('nav_bouton')}</Link></li>
              <li className="mt-2 px-2"><button type="button" onClick={() => { setOpen(false); openPois(); }} className="btn-ghost w-full">{t('hero_bouton_2')}</button></li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
