// Effets de défilement communs à toutes les pages (montés une fois par page, voir FxScope dans App).
// Identiques sur ordinateur et mobile ; seule l'interaction change (souris : survol, tactile : appui).
//  - titres h2 : rideau (clip-path) qui se lève
//  - images de contenu : ouverture en clip-path arrondi + légère parallaxe
//  - cartes .card : inclinaison 3D au pointeur (survol ou appui) + reflet
//  - boutons .btn / .fx-magnetic : attraction magnétique (souris) ou rebond (tactile)
//  - sections sombres : s'ouvrent comme une carte qui prend toute la largeur
// Exclusions : hero d'accueil (.hero-scene), éléments [data-fx-off], contenus « sticky ».
import { useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

const SKIP = '.hero-scene, [data-fx-off], .marquee, [class*="sticky"]';
const ok = (el) => !el.closest(SKIP);

export function usePageFx(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return undefined;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const offs = [];
    const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); offs.push(() => el.removeEventListener(type, fn, opts)); };

    const ctx = gsap.context(() => {
      // 1. Titres : rideau
      root.querySelectorAll('section h2').forEach((el) => {
        if (!ok(el)) return;
        gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 30 }, {
          clipPath: 'inset(-20% -5% -25% -5%)', yPercent: 0, duration: 1.1, ease: 'expo.out', clearProps: 'clipPath',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // 2. Images de contenu
      root.querySelectorAll('section img').forEach((img) => {
        if (!ok(img) || img.closest('.hero-page')) return;
        const w = Number(img.getAttribute('width')) || img.clientWidth;
        if (w && w < 200) return; // icônes, logos
        gsap.fromTo(img, { clipPath: 'inset(14% 10% 14% 10% round 28px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath',
          scrollTrigger: { trigger: img, start: 'top 90%', once: true },
        });
        // Parallaxe seulement si le parent rogne et que l'image n'a pas déjà un zoom au survol
        const parent = img.parentElement;
        if (parent && getComputedStyle(parent).overflow === 'hidden' && !/scale/.test(img.className)) {
          gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: parent, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      });

      // 3. Sections sombres : carte arrondie qui s'élargit
      root.querySelectorAll('section.bg-fi-deep').forEach((el) => {
        if (!ok(el) || el.classList.contains('hero-page') || el.querySelector('[class*="sticky"]')) return;
        gsap.fromTo(el, { clipPath: `inset(0% ${fine ? 4 : 2.5}% 0% ${fine ? 4 : 2.5}% round 48px)` }, {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', clearProps: 'clipPath',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.6 },
        });
      });

      // 4. Petites lignes (kickers) : l'espacement se resserre
      root.querySelectorAll('.kicker').forEach((el) => {
        if (!ok(el)) return;
        gsap.from(el, { letterSpacing: '0.35em', opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });
    }, root);

    // 5. Cartes 3D : survol (souris) ou appui (tactile)
    root.querySelectorAll('.card, .fx-tilt').forEach((card) => {
      if (!ok(card)) return;
      card.classList.add('fx-shine');
      gsap.set(card, { transformPerspective: 1000 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const tilt = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
        ry((x - 0.5) * 10); rx((0.5 - y) * 8);
        card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`); card.style.setProperty('--shine', '1');
      };
      const reset = () => { rx(0); ry(0); card.style.setProperty('--shine', '0'); };
      if (fine) { on(card, 'pointermove', tilt); on(card, 'pointerleave', reset); }
      else { on(card, 'pointerdown', tilt, { passive: true }); on(card, 'pointerup', reset); on(card, 'pointercancel', reset); on(card, 'pointerleave', reset); }
    });

    // 6. Boutons : attraction magnétique (souris) / rebond (tactile)
    root.closest('body')?.querySelectorAll('.btn, .btn-primary, .btn-accent, .btn-ghost, .btn-light, .fx-magnetic').forEach((b) => {
      if (b.dataset.fxBound || b.closest('[data-fx-off]')) return;
      b.dataset.fxBound = '1';
      offs.push(() => { delete b.dataset.fxBound; gsap.set(b, { clearProps: 'x,y,scale' }); });
      if (fine) {
        const mx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3.out' });
        const my = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3.out' });
        on(b, 'pointermove', (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.3); });
        on(b, 'pointerleave', () => { mx(0); my(0); });
      } else {
        on(b, 'pointerdown', () => gsap.to(b, { scale: 0.95, duration: 0.12, overwrite: 'auto' }), { passive: true });
        const up = () => gsap.to(b, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        on(b, 'pointerup', up); on(b, 'pointercancel', up);
      }
    });

    // Les mesures changent quand les images / polices arrivent
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const t = setTimeout(refresh, 600);
    return () => { clearTimeout(t); window.removeEventListener('load', refresh); offs.forEach((f) => f()); ctx.revert(); };
  }, [ref]);
}
