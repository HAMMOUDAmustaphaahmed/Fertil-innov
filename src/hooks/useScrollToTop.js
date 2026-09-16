// Remonte en haut à chaque changement de page (sauf ancre #...), et défile vers l'ancre sinon.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from './useSmoothScroll';

export function useScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 90;
        const l = getLenis();
        setTimeout(() => (l ? l.scrollTo(y, { duration: 1 }) : window.scrollTo({ top: y, behavior: 'smooth' })), 60);
        return;
      }
    }
    const l = getLenis();
    if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
  }, [pathname, hash]);
}
