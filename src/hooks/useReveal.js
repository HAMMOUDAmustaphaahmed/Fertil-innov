// Révélation au défilement des éléments .reveal d'un conteneur (une seule fois, en lot),
// avec une légère bascule 3D (l'élément se redresse en montant).
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
    gsap.set(items, { opacity: 0, y: 44, rotationX: -14, transformPerspective: 1000, transformOrigin: '50% 100%' });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: 'auto' }),
    });
  }, { scope: ref, dependencies: deps });
  return ref;
}
