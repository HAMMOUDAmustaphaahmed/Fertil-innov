import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, LazyMotion, MotionConfig, m } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LangProvider } from './i18n/LangProvider';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollToTop } from './hooks/useScrollToTop';
import { usePageFx } from './hooks/usePageFx';
import { POIS_EVENT } from './lib/pois';
import { ESPACE_PATH } from './data/infos';
import Home from './pages/Home';

// Pages secondaires en lazy-loading (le pré-rendu les charge de toute façon côté serveur).
// lazyPage : comme React.lazy, mais préchargeable. main.jsx précharge la page de l'URL avant
// d'hydrater : la page s'hydrate d'un seul tenant au lieu de rester suspendue (HTML pré-rendu inerte).
function lazyPage(factory) {
  let Loaded = null;
  const Lazy = lazy(factory);
  function Page(props) { return Loaded ? <Loaded {...props} /> : <Lazy {...props} />; }
  Page.preload = () => factory().then((m) => { Loaded = m.default; });
  return Page;
}
const Services = lazyPage(() => import('./pages/Services'));
const Activites = lazyPage(() => import('./pages/Activites'));
const Expertise = lazyPage(() => import('./pages/Expertise'));
const Formations = lazyPage(() => import('./pages/Formations'));
const Chiffres = lazyPage(() => import('./pages/Chiffres'));
const Blog = lazyPage(() => import('./pages/Blog'));
const Faq = lazyPage(() => import('./pages/Faq'));
const Contact = lazyPage(() => import('./pages/Contact'));
const Equipe = lazyPage(() => import('./pages/Equipe'));
const Pilotage = lazy(() => import('./pages/Pilotage'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

export const PAGES = [
  { path: '/', Component: Home },
  { path: '/services', Component: Services },
  { path: '/activites', Component: Activites },
  { path: '/expertise', Component: Expertise },
  { path: '/formations', Component: Formations },
  { path: '/chiffres', Component: Chiffres },
  { path: '/blog', Component: Blog },
  { path: '/faq', Component: Faq },
  { path: '/equipe', Component: Equipe },
  { path: '/contact', Component: Contact },
];
const PREFIXES = ['', '/en', '/es'];

/** Charge le code de la page correspondant à l'URL (avant l'hydratation). */
export function preloadRoute(pathname) {
  const bare = pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/';
  const page = PAGES.find((x) => x.path === bare.replace(/\/$/, '') || (x.path === '/' && bare === '/'));
  const C = page ? page.Component : NotFound;
  return C.preload ? C.preload().catch(() => {}) : Promise.resolve();
}


// Mesure d'audience sans cookie : une page vue par changement d'adresse, envoyée à /api/hit (voir api/_lib/audience.js).
// Rien n'est lu ni écrit dans le navigateur ; les visiteurs qui ont activé « ne pas me pister » ne sont pas comptés.
let firstHit = true;
function useAudience(pathname, off) {
  useEffect(() => {
    if (off) return;
    try {
      if (navigator.webdriver || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
      const body = JSON.stringify({ p: pathname, r: firstHit ? document.referrer : '', e: firstHit });
      firstHit = false;
      fetch('/api/hit', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'omit' }).catch(() => {});
    } catch { /* la mesure ne doit jamais gêner la navigation */ }
  }, [pathname, off]);
}

// Fonctions d'animation de Framer Motion : chargées à part, le code principal ne garde que le composant léger « m ».
const motionFeatures = () => import('./lib/motion-features').then((r) => r.default);

// Petit Pois : son code est chargé après le premier affichage (navigateur au repos), ou tout de suite si le
// visiteur clique sur un bouton « Parler à Petit Pois » avant — la commande est alors rejouée une fois le widget monté.
function ChatbotLazy() {
  const [Widget, setWidget] = useState(null);
  const pending = useRef(null);
  useEffect(() => {
    let alive = true; let started = false;
    const load = () => {
      if (started) return;
      started = true;
      import('./components/Chatbot').then((mod) => { if (alive) setWidget(() => mod.default); }).catch(() => { started = false; });
    };
    const early = (e) => { pending.current = e.detail; load(); };
    window.addEventListener(POIS_EVENT, early);
    const idle = window.requestIdleCallback ? window.requestIdleCallback(load, { timeout: 2500 }) : setTimeout(load, 1200);
    return () => {
      alive = false;
      window.removeEventListener(POIS_EVENT, early);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle);
    };
  }, []);
  useEffect(() => {
    if (!Widget || !pending.current) return;
    // Les effets du widget (son écoute de POIS_EVENT) sont déjà en place : on lui rejoue la commande reçue trop tôt.
    const detail = pending.current; pending.current = null;
    window.dispatchEvent(new CustomEvent(POIS_EVENT, { detail }));
  }, [Widget]);
  return Widget ? <Widget /> : null;
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-fi-light border-t-fi-primary animate-spin" aria-label="Chargement" />
    </div>
  );
}

// Monté à l'intérieur de Suspense : ses effets tournent une fois la page (lazy) réellement affichée.
function FxScope({ off, children }) {
  const ref = useRef(null);
  usePageFx(ref);
  return <div ref={ref} data-fx-off={off || undefined}>{children}</div>;
}

function AppContent() {
  useSmoothScroll();
  useScrollToTop();
  const location = useLocation();
  const isAdmin = location.pathname === ESPACE_PATH || location.pathname.startsWith(`${ESPACE_PATH}/`) || location.pathname.startsWith('/admin');
  useAudience(location.pathname, isAdmin);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Navbar />}
      <main id="main-content" className="flex-grow">
        {/* Suspense À L'INTÉRIEUR de chaque page animée : placé autour d'AnimatePresence, le chargement d'une page
            (lazy) remplaçait toute la transition par le fallback, qui perdait alors son état — l'ancienne page restait
            affichée, ou la nouvelle restait invisible (opacité 0), par exemple au clic sur le logo. */}
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
            <Suspense fallback={<PageFallback />}>
              <FxScope off={isAdmin}>
                <Routes location={location}>
                  {PREFIXES.flatMap((prefix) => PAGES.map(({ path, Component }) => (
                    <Route key={prefix + path} path={prefix + path || '/'} element={<Component />} />
                  )))}
                  {/* Ancien « Guide des sols » : fusionné dans la FAQ (redirection 301 aussi dans vercel.json) */}
                  {PREFIXES.map((prefix) => <Route key={`${prefix}/sols`} path={`${prefix}/sols`} element={<Navigate to={`${prefix}/faq#guide`} replace />} />)}
                  <Route path={ESPACE_PATH} element={<Pilotage />} />
                  {/* Ancienne adresse de l'espace propriétaire */}
                  <Route path="/admin" element={<Navigate to={ESPACE_PATH} replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </FxScope>
            </Suspense>
          </m.div>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatbotLazy />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('js');
    // Signal pour le loader d'index.html : l'application est montée.
    window.__fiReady = true;
    window.dispatchEvent(new Event('fi:app-ready'));
  }, []);
  return (
    <LazyMotion features={motionFeatures} strict>
      <MotionConfig reducedMotion="never">
        <LangProvider>
          <AppContent />
        </LangProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
