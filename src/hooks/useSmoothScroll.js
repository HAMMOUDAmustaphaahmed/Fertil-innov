// Défilement fluide (Lenis) synchronisé avec GSAP ScrollTrigger. Client uniquement.
import { useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

let lenis = null;
export const getLenis = () => lenis;
export function setScrollLocked(locked) { if (!lenis) return; locked ? lenis.stop() : lenis.start(); }

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return undefined;
    let cancelled = false;
    let tick;
    const sync = () => ScrollTrigger.update();
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      // Resynchronise aussi sur le défilement natif (barre de défilement, ancres, restauration au rechargement,
      // retour brusque en haut) : sinon ScrollTrigger peut garder une ancienne position et figer le hero.
      window.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('scrollend', sync);
      tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      // Défilement bloqué tant que le loader d'index.html est affiché.
      if (document.documentElement.classList.contains('fi-loading')) {
        lenis.stop();
        window.addEventListener('fi:loader-done', () => lenis?.start(), { once: true });
      }
    });
    return () => {
      cancelled = true;
      if (tick) gsap.ticker.remove(tick);
      window.removeEventListener('scroll', sync); window.removeEventListener('scrollend', sync);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}
