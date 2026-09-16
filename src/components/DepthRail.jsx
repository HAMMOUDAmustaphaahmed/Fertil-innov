// Rail de profondeur (accueil, écrans larges) : la page se lit comme un profil de sol.
// Un repère descend avec le défilement ; l'horizon de la section visible est mis en avant.
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useLang } from '../i18n/LangProvider';

export const HORIZONS = [
  { id: 'surface', key: 'horizon_surface', depth: '0 cm' },
  { id: 'rhizo', key: 'horizon_rhizo', depth: '5 cm' },
  { id: 'a', key: 'horizon_a', depth: '30 cm' },
  { id: 'b', key: 'horizon_b', depth: '80 cm' },
  { id: 'roche', key: 'horizon_roche', depth: '150 cm' },
];

export default function DepthRail({ scope }) {
  const { t } = useLang();
  const [active, setActive] = useState('surface');
  const marker = useRef(null);

  // useEffect (et non useGSAP/useLayoutEffect) : le rail est un enfant de la div dont il
  // lit le ref ; les refs des parents ne sont attachés qu'après les layout effects des
  // enfants, donc scope.current serait encore null (visible en production, masqué en dev par StrictMode).
  useEffect(() => {
    const root = scope?.current;
    if (!root || !marker.current) return undefined;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => gsap.set(marker.current, { top: `${self.progress * 100}%` }),
      });
      root.querySelectorAll('[data-horizon]').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setActive(el.dataset.horizon); } });
      });
    }, root);
    return () => ctx.revert();
  }, [scope]);

  return (
    <aside aria-hidden className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 h-[52vh] flex-col justify-between pointer-events-none mix-blend-difference text-white">
      <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/30" />
      <span ref={marker} className="absolute -left-[1px] h-3 w-3 -translate-y-1/2 rounded-full bg-fi-accent ring-4 ring-fi-accent/25 transition-[top] duration-150" style={{ top: 0 }} />
      {HORIZONS.map((h) => (
        <div key={h.id} className="relative pl-6">
          <span className={`absolute left-[3px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full transition-colors ${active === h.id ? 'bg-fi-accent' : 'bg-white/40'}`} />
          <p className={`font-display text-[11px] leading-tight transition-colors ${active === h.id ? 'text-white font-semibold' : 'text-white/45'}`}>{t(h.key)}</p>
          <p className="text-[10px] text-white/35 tabular-nums">{h.depth}</p>
        </div>
      ))}
    </aside>
  );
}
