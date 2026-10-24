// Point d'entrée unique pour GSAP : enregistre les plugins une seule fois (côté client).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
// Les animations sont voulues sur tous les appareils : on ignore « réduire les animations » (souvent activé
// d'office sur mobile par le mode économie d'énergie), qui coupait le loader, la scène 3D et les animations.
export const prefersReducedMotion = () => false;
