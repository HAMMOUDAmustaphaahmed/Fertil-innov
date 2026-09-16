// Révélation au défilement des éléments .reveal d'un conteneur (une seule fois, en lot).
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';

export function useReveal(deps = [], externalRef = null) {
  const own = useRef(null);
  const ref = externalRef || own;
  useGSAP(() => {
    const all = [...(ref.current?.querySelectorAll('.reveal') || [])];
    // Les éléments dans un conteneur « sticky » sont mal mesurés par ScrollTrigger : affichés directement.
    const stuck = all.filter((el) => el.closest('[class*="sticky"]'));
    if (stuck.length) gsap.set(stuck, { opacity: 1 });
    const items = all.filter((el) => !stuck.includes(el));
    if (!items.length) return;
    if (prefersReducedMotion()) { gsap.set(items, { opacity: 1 }); return; }
    gsap.set(items, { opacity: 0, y: 28 });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    });
  }, { scope: ref, dependencies: deps });
  return ref;
}
