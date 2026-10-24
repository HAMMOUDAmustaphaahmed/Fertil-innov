import { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { LangProvider } from './i18n/LangProvider';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollToTop } from './hooks/useScrollToTop';
import { usePageFx } from './hooks/usePageFx';
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
const Guide = lazyPage(() => import('./pages/Guide'));
const Equipe = lazyPage(() => import('./pages/Equipe'));
const Admin = lazy(() => import('./pages/Admin'));
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
  { path: '/sols', Component: Guide },
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
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Navbar />}
      <main id="main-content" className="flex-grow">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
              <FxScope off={isAdmin}>
                <Routes location={location}>
                  {PREFIXES.flatMap((prefix) => PAGES.map(({ path, Component }) => (
                    <Route key={prefix + path} path={prefix + path || '/'} element={<Component />} />
                  )))}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </FxScope>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <Chatbot />}
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
    <MotionConfig reducedMotion="user">
      <LangProvider>
        <AppContent />
      </LangProvider>
    </MotionConfig>
  );
}
