import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { LangProvider } from './i18n/LangProvider';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollToTop } from './hooks/useScrollToTop';
import Home from './pages/Home';

// Pages secondaires en lazy-loading (le pré-rendu les charge de toute façon côté serveur).
const Services = lazy(() => import('./pages/Services'));
const Activites = lazy(() => import('./pages/Activites'));
const Expertise = lazy(() => import('./pages/Expertise'));
const Formations = lazy(() => import('./pages/Formations'));
const Chiffres = lazy(() => import('./pages/Chiffres'));
const Blog = lazy(() => import('./pages/Blog'));
const Faq = lazy(() => import('./pages/Faq'));
const Contact = lazy(() => import('./pages/Contact'));
const Guide = lazy(() => import('./pages/Guide'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
  { path: '/contact', Component: Contact },
];
const PREFIXES = ['', '/en', '/es'];


function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-fi-light border-t-fi-primary animate-spin" aria-label="Chargement" />
    </div>
  );
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
              <Routes location={location}>
                {PREFIXES.flatMap((prefix) => PAGES.map(({ path, Component }) => (
                  <Route key={prefix + path} path={prefix + path || '/'} element={<Component />} />
                )))}
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
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
  useEffect(() => { document.documentElement.classList.add('js'); }, []);
  return (
    <MotionConfig reducedMotion="user">
      <LangProvider>
        <AppContent />
      </LangProvider>
    </MotionConfig>
  );
}
