// Point d'entrée unique pour GSAP : enregistre les plugins une seule fois (côté client).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
// Les animations sont voulues sur tous les appareils : on ignore « réduire les animations » (souvent activé
// d'office sur mobile par le mode économie d'énergie), qui coupait le loader, la scène 3D et les animations.
export const prefersReducedMotion = () => false;

// Compromis pour les visiteurs qui ont demandé « réduire les animations » : le site garde le loader, les apparitions
// et les scènes pilotées par le défilement (elles ne bougent que si le visiteur défile), mais on retire ce qui bouge
// tout seul ou amplifie le mouvement : défilement lissé, parallaxes, boucles décoratives des en-têtes.
// Sans ce réglage système, rien ne change.
export const prefersLessMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
