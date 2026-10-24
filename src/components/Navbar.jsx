// En-tête : barre flottante « verre dépoli » (dégradé terre → menthe), toujours visible, qui s'affine
// au défilement pour ne pas masquer le contenu. Indicateur de lien actif glissant, ligne de progression,
// menu mobile plein écran avec liens numérotés en cascade.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ChevronDown, ArrowRight, ArrowUpRight } from 'lucide-react';
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
  { to: '/equipe', key: 'nav_equipe' },
  { to: '/blog', key: 'nav_blog' },
  { to: '/sols', key: 'nav_guide' },
  { to: '/faq', key: 'nav_faq' },
];
const EASE = [0.16, 1, 0.3, 1];

/** Drapeaux en SVG (les émojis drapeaux ne s'affichent pas sous Windows). */
function Flag({ lang, className = 'h-4 w-6' }) {
  const common = { viewBox: '0 0 30 20', className: `${className} shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]`, 'aria-hidden': true, preserveAspectRatio: 'none' };
  if (lang === 'fr') return <svg {...common}><rect width="10" height="20" fill="#002395" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ED2939" /></svg>;
  if (lang === 'es') return <svg {...common}><rect width="30" height="20" fill="#AA151B" /><rect y="5" width="30" height="10" fill="#F1BF00" /></svg>;
  return ( // Royaume-Uni
    <svg {...common}>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
    </svg>
  );
}

function LangSwitch() {
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
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-semibold uppercase tracking-wider text-fi-dark transition-colors hover:bg-white/70 min-h-[40px]`}>
        <Flag lang={lang} className="h-[15px] w-[22px]" /> {lang} <ChevronDown size={13} aria-hidden className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.2, ease: EASE }}
            className="absolute right-0 mt-3 w-44 origin-top-right rounded-2xl bg-white/95 backdrop-blur-xl shadow-leaf border border-white p-1.5 z-50">
            {LANGS.map((l) => (
              <li key={l} role="option" aria-selected={l === lang}>
                <Link to={localePath(path, l)} onClick={() => setOpen(false)} hrefLang={l} lang={l}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${l === lang ? 'bg-fi-mint text-fi-dark font-semibold' : 'text-fi-text hover:bg-fi-bg'}`}>
                  <span className="flex items-center gap-2.5"><Flag lang={l} /> {LANG_LABEL[l]}</span> {l === lang && <span className="h-1.5 w-1.5 rounded-full bg-fi-primary" aria-hidden />}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bouton menu : deux traits qui se croisent en X. */
function Burger({ open, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu"
      className="xl:hidden relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-fi-dark text-white shadow-leaf transition-transform active:scale-95">
      <span className="sr-only">Menu</span>
      <span aria-hidden className={`absolute h-[2px] w-[18px] rounded-full bg-current transition-transform duration-500 ${open ? 'rotate-45' : '-translate-y-[4px]'}`} style={{ transitionTimingFunction: 'cubic-bezier(.16,1,.3,1)' }} />
      <span aria-hidden className={`absolute h-[2px] rounded-full bg-current transition-all duration-500 ${open ? 'w-[18px] -rotate-45' : 'w-[12px] translate-x-[3px] translate-y-[4px]'}`} style={{ transitionTimingFunction: 'cubic-bezier(.16,1,.3,1)' }} />
    </button>
  );
}

export default function Navbar() {
  const { t, p, lang } = useLang();
  const site = useSite();
  const img = useImage();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

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
      <motion.div aria-hidden className="fixed left-0 right-0 top-0 z-[45] h-[3px] origin-left bg-gradient-to-r from-fi-loam via-fi-accent to-fi-primary" style={{ scaleX: progress }} />
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none" style={{ height: 'var(--header-h)' }}>
        <a href="#main-content" className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-fi-dark">{lang === 'fr' ? 'Aller au contenu' : lang === 'en' ? 'Skip to content' : 'Ir al contenido'}</a>
        <div className={`px-2.5 sm:px-4 transition-[padding] duration-500 ${scrolled ? 'pt-1.5' : 'pt-2.5'}`}>
          <div className={`nav-glass pointer-events-auto mx-auto flex max-w-[86rem] items-center justify-between gap-3 rounded-full pl-4 pr-2 sm:pl-5 transition-[height,box-shadow] duration-500 ${scrolled && !open ? 'h-[3.25rem] is-scrolled' : 'h-[3.75rem]'} ${open ? 'is-scrolled' : ''}`}>
            <Link to={p('/')} className="flex items-center shrink-0" aria-label={site.nom}>
              <img {...img('logo')} alt={site.nom} width={150} height={52} className="h-9 sm:h-10 w-auto" />
            </Link>

            <nav className="hidden xl:flex items-center" aria-label="Navigation principale">
              {LINKS.map(({ to, key }) => (
                <NavLink key={to} to={p(to)} className={({ isActive }) => `group relative rounded-full px-3 py-2 text-[0.86rem] font-medium transition-colors ${isActive ? 'text-fi-dark' : 'text-fi-text/75 hover:text-fi-dark'}`}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-full bg-white shadow-[0_4px_18px_-8px_rgb(var(--fi-primary)/0.6)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                      <span className="relative">{t(key)}</span>
                      {!isActive && <span aria-hidden className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-fi-primary transition-transform duration-300 group-hover:scale-x-100" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <LangSwitch />
              <Link to={p('/contact')} className="fx-magnetic group hidden md:inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-fi-dark pl-5 pr-1.5 py-1.5 text-sm font-semibold text-white shadow-leaf transition-colors hover:bg-fi-primary">
                {t('nav_bouton')}
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fi-accent text-fi-deep transition-transform duration-500 group-hover:rotate-45"><ArrowUpRight size={16} aria-hidden /></span>
              </Link>
              <Burger open={open} onClick={() => setOpen((o) => !o)} />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-nav" aria-label="Navigation mobile" data-lenis-prevent
            initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="xl:hidden fixed inset-0 z-[39] overflow-y-auto bg-gradient-to-br from-[#efe3d0] via-fi-mint to-white"
            style={{ paddingTop: 'calc(var(--header-h) + 1rem)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <svg aria-hidden className="pointer-events-none absolute -right-24 bottom-10 h-[70vmin] w-[70vmin] text-fi-primary/10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
              <circle cx="50" cy="50" r="48" /><circle cx="50" cy="50" r="36" strokeDasharray="1 3" /><circle cx="50" cy="50" r="22" />
            </svg>
            <motion.ul className="wrap relative flex flex-col" initial="hide" animate="show" exit="hide"
              variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.25 } }, hide: { transition: { staggerChildren: 0.02, staggerDirection: -1 } } }}>
              {[{ to: '/', key: 'nav_accueil', end: true }, ...LINKS].map(({ to, key, end }, i) => (
                <motion.li key={to} variants={{ hide: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }} className="border-b border-fi-dark/10">
                  <NavLink to={p(to)} end={end} className={({ isActive }) => `group flex items-baseline gap-4 py-3.5 font-display text-[1.9rem] leading-none tracking-tight transition-colors ${isActive ? 'text-fi-primary' : 'text-fi-dark'}`}>
                    <span className="w-7 text-xs font-sans font-semibold tabular-nums text-fi-primary/60">{String(i).padStart(2, '0')}</span>
                    {t(key)}
                    <ArrowRight size={20} aria-hidden className="ml-auto self-center opacity-30 transition-transform group-active:translate-x-1" />
                  </NavLink>
                </motion.li>
              ))}
              <motion.li variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link to={p('/contact')} className="btn-primary w-full">{t('nav_bouton')}</Link>
                <button type="button" onClick={() => { setOpen(false); openPois(); }} className="btn-ghost w-full">{t('hero_bouton_2')}</button>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
