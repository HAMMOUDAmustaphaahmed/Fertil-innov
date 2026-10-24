// Icônes du site : traits fins + touches lime, dessinées à l'entrée dans l'écran (trait qui se trace,
// accents qui éclosent), légère respiration au survol. Remplacent les émojis et les anciennes images
// d'icônes. <Icon emoji="🔬" /> accepte aussi les émojis saisis par le propriétaire (repli : l'émoji).
import { useEffect, useRef, useState } from 'react';

const A = 'rgb(var(--fi-accent))';
// l : trait animé ; a : accent (remplissage lime) ; s : trait secondaire (fin)
const ICONS = {
  microscope: (
    <>
      <path className="l" pathLength="1" d="M21 5h8l-2 15h-4z" />
      <path className="l" pathLength="1" d="M29 12c9 2 11 11 6 19" />
      <path className="l" pathLength="1" d="M25 20v9M14 31h22M17 43c0-7 4-11 11-11M9 43h30" />
      <circle className="a" cx="25" cy="25" r="3" fill={A} />
    </>
  ),
  petri: (
    <>
      <path className="l" pathLength="1" d="M7 25a17 7.5 0 1 0 34 0a17 7.5 0 1 0-34 0" />
      <path className="l" pathLength="1" d="M7 25v5a17 7.5 0 0 0 34 0v-5" />
      <circle className="a" cx="17" cy="24.5" r="2.6" fill={A} /><circle className="a" cx="27" cy="22.5" r="3.2" fill={A} />
      <circle className="a" cx="24" cy="28" r="1.8" fill={A} /><circle className="a" cx="33" cy="26.5" r="1.6" fill={A} />
    </>
  ),
  sprout: (
    <>
      <path className="l" pathLength="1" d="M7 33h34M24 33V19" />
      <path className="l" pathLength="1" d="M24 23c-8 0-12-5-12-11 7 0 12 4 12 11zM24 19c0-7 5-11 12-11 0 7-5 11-12 11z" />
      <path className="s" pathLength="1" d="M24 33c0 4-3 6-6 9M24 33c0 4 3 6 6 9M24 33v10" />
      <circle className="a" cx="15" cy="40" r="1.7" fill={A} /><circle className="a" cx="33" cy="39" r="1.7" fill={A} /><circle className="a" cx="24" cy="45" r="1.4" fill={A} />
    </>
  ),
  leaves: (
    <>
      <path className="l" pathLength="1" d="M10 38C10 22 20 12 38 10c0 18-10 28-26 28z" />
      <path className="l" pathLength="1" d="M10 38L30 18M18 30h8M22 26v-7" />
      <path className="s" pathLength="1" d="M6 43h36" />
      <circle className="a" cx="34" cy="38" r="4" fill={A} />
    </>
  ),
  remediation: (
    <>
      <path className="l" pathLength="1" d="M10 24a14 14 0 0 1 23-10.7M34 8v6h-6M38 24a14 14 0 0 1-23 10.7M14 40v-6h6" />
      <path className="a" d="M24 31c-4-1-6-4-5-9 5 0 7 4 5 9zm0 0c1-5 4-8 9-7 0 5-4 7-9 7z" fill={A} />
    </>
  ),
  magnifier: (
    <>
      <path className="l" pathLength="1" d="M9 20a11 11 0 1 0 22 0a11 11 0 1 0-22 0M28 28l12 12" />
      <rect className="a" x="15" y="18" width="10" height="4.5" rx="2.25" fill={A} transform="rotate(-25 20 20)" />
    </>
  ),
  dna: (
    <>
      <path className="l" pathLength="1" d="M16 4c0 10 16 10 16 20s-16 10-16 20" />
      <path className="l" pathLength="1" d="M32 4c0 10-16 10-16 20s16 10 16 20" />
      <path className="a-s" d="M18 10h12M20 16h8M20 32h8M18 38h12" stroke={A} />
    </>
  ),
  testtube: (
    <>
      <path className="l" pathLength="1" d="M17 6h14M20 6v29a4 4 0 0 0 8 0V6" />
      <path className="a" d="M20 24h8v11a4 4 0 0 1-8 0z" fill={A} />
      <circle className="s" cx="24" cy="18" r="1.4" /><circle className="s" cx="25.5" cy="13" r="1" />
    </>
  ),
  vials: (
    <>
      <path className="l" pathLength="1" d="M7 39h34M10 39v4M38 39v4" />
      <path className="l" pathLength="1" d="M12 12v21a3 3 0 0 0 6 0V12M21 12v21a3 3 0 0 0 6 0V12M30 12v21a3 3 0 0 0 6 0V12M11 12h8M20 12h8M29 12h8" />
      <path className="a" d="M12 24h6v9a3 3 0 0 1-6 0zM21 20h6v13a3 3 0 0 1-6 0zM30 27h6v6a3 3 0 0 1-6 0z" fill={A} />
    </>
  ),
  chart: (
    <>
      <path className="l" pathLength="1" d="M7 41h34M7 7v34" />
      <rect className="a" x="12" y="27" width="6" height="14" rx="1.5" fill={A} />
      <rect className="a" x="22" y="19" width="6" height="22" rx="1.5" fill={A} />
      <rect className="a" x="32" y="11" width="6" height="30" rx="1.5" fill={A} />
    </>
  ),
  drop: (
    <>
      <path className="l" pathLength="1" d="M24 5c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" />
      <path className="a" d="M19 30a5 5 0 0 0 5 5" stroke={A} fill="none" />
      <path className="s" pathLength="1" d="M8 45c4-2 8-2 12 0s8 2 12 0 6-1 8 0" />
    </>
  ),
  globe: (
    <>
      <path className="l" pathLength="1" d="M7 24a17 17 0 1 0 34 0a17 17 0 1 0-34 0M24 7c-7 6-7 28 0 34M24 7c7 6 7 28 0 34M8 24h32" />
      <path className="a" d="M30 16c-3 0-5-2-5-6 4 0 6 2 5 6zm0 0c0-4 3-6 7-5 0 4-3 6-7 5z" fill={A} />
    </>
  ),
  growth: (
    <>
      <path className="l" pathLength="1" d="M7 41h34M7 7v34M11 34l8-8 6 4 12-14M31 16h6v6" />
      <circle className="a" cx="19" cy="26" r="2.3" fill={A} /><circle className="a" cx="25" cy="30" r="2.3" fill={A} />
    </>
  ),
  factory: (
    <>
      <path className="l" pathLength="1" d="M6 41V23l9 6v-6l9 6v-6l9 6V10h6v31z" />
      <path className="a" d="M36 8c-3 0-5-2-4-5 3 0 5 2 4 5zm0 0c0-3 2-5 5-5 0 3-2 5-5 5z" fill={A} />
    </>
  ),
  wheat: (
    <>
      <path className="l" pathLength="1" d="M24 44V8" />
      {[12, 19, 26, 33].map((y) => (
        <g key={y}>
          <ellipse className="a" cx="19.5" cy={y} rx="3" ry="5" transform={`rotate(-35 19.5 ${y})`} fill={A} />
          <ellipse className="a" cx="28.5" cy={y} rx="3" ry="5" transform={`rotate(35 28.5 ${y})`} fill={A} />
        </g>
      ))}
    </>
  ),
  tools: (
    <>
      <path className="l" pathLength="1" d="M31 9a8 8 0 0 0-10 10L8 32l7 7 13-13a8 8 0 0 0 10-10l-5 5-5-1-1-5z" />
      <circle className="a" cx="12" cy="35" r="2" fill={A} />
    </>
  ),
  map: (
    <>
      <path className="l" pathLength="1" d="M5 12l12-4 13 4 13-4v29l-13 4-13-4-12 4zM17 8v29M30 12v29" />
      <path className="a" d="M36 18a4 4 0 0 0-8 0c0 4 4 8 4 8s4-4 4-8z" fill={A} />
    </>
  ),
  clipboard: (
    <>
      <path className="l" pathLength="1" d="M15 9h-3a2 2 0 0 0-2 2v30a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-3M18 6h12v6H18zM16 22h10M16 29h16M16 36h8" />
      <circle className="a" cx="31" cy="22" r="3" fill={A} />
    </>
  ),
  flask: (
    <>
      <path className="l" pathLength="1" d="M18 6h12M20 6v12L9 38a3 3 0 0 0 3 4h24a3 3 0 0 0 3-4L28 18V6" />
      <path className="a" d="M14 30h20l4 8a2 2 0 0 1-2 3H12a2 2 0 0 1-2-3z" fill={A} />
      <circle className="s" cx="22" cy="24" r="1.3" /><circle className="s" cx="26" cy="21" r="1" />
    </>
  ),
  microbe: (
    <>
      <path className="l" pathLength="1" d="M12 24a12 8 0 1 0 24 0a12 8 0 1 0-24 0" transform="rotate(-25 24 24)" />
      <path className="s" pathLength="1" d="M34 15c3-3 5-1 7-4M36 22c4-1 5 2 8 1M14 33c-3 3-5 1-7 4M12 26c-4 1-5-2-8-1" />
      <circle className="a" cx="21" cy="25" r="2.4" fill={A} /><circle className="a" cx="27" cy="21.5" r="1.8" fill={A} />
    </>
  ),
  timer: (
    <>
      <path className="l" pathLength="1" d="M10 27a14 14 0 1 0 28 0a14 14 0 1 0-28 0M24 27V18M20 6h8M24 6v7M36 13l3-3" />
      <circle className="a" cx="24" cy="27" r="2.4" fill={A} />
    </>
  ),
  quote: (
    <>
      <path className="l" pathLength="1" d="M13 5h15l9 9v29H13zM28 5v9h9" />
      <path className="a-s" d="M30 25a6 6 0 1 0 0 8M19 27h9M19 31h9" stroke={A} />
    </>
  ),
  target: (
    <>
      <path className="l" pathLength="1" d="M7 25a17 17 0 1 0 34 0a17 17 0 1 0-34 0M14 25a10 10 0 1 0 20 0a10 10 0 1 0-20 0M24 25L40 9M34 9h6v6" />
      <circle className="a" cx="24" cy="25" r="3.5" fill={A} />
    </>
  ),
  mic: (
    <>
      <path className="l" pathLength="1" d="M18 9a6 6 0 0 1 12 0v13a6 6 0 0 1-12 0zM12 21a12 12 0 0 0 24 0M24 33v8M17 41h14" />
      <path className="a-s" d="M18 14h4M18 19h4" stroke={A} />
    </>
  ),
  cap: (
    <>
      <path className="l" pathLength="1" d="M5 18l19-9 19 9-19 9zM13 22v9c0 3 5 7 11 7s11-4 11-7v-9" />
      <path className="a-s" d="M41 19v12" stroke={A} /><circle className="a" cx="41" cy="33" r="2.5" fill={A} />
    </>
  ),
  people: (
    <>
      <path className="l" pathLength="1" d="M10 18a6 6 0 1 0 12 0a6 6 0 1 0-12 0M26 18a6 6 0 1 0 12 0a6 6 0 1 0-12 0M5 40c0-7 5-12 11-12s11 5 11 12M21 40c0-7 5-12 11-12s11 5 11 12" />
      <circle className="a" cx="24" cy="10" r="2.5" fill={A} />
    </>
  ),
};

const EMOJI = {
  '🔬': 'microscope', '🧫': 'petri', '🌱': 'sprout', '🌿': 'leaves', '♻': 'remediation', '🔍': 'magnifier', '🔎': 'magnifier',
  '🧬': 'dna', '🧪': 'testtube', '🧴': 'vials', '📊': 'chart', '💧': 'drop', '🌍': 'globe', '🌎': 'globe', '🌏': 'globe',
  '📈': 'growth', '🏭': 'factory', '🌾': 'wheat', '🛠': 'tools', '🗺': 'map', '📋': 'clipboard', '⚗': 'flask', '🦠': 'microbe',
  '⏱': 'timer', '💰': 'quote', '🎯': 'target', '🎙': 'mic', '🎓': 'cap', '👥': 'people',
};
/** Icône des services, par identifiant (repli : icône d'après l'émoji). */
export const SERVICE_ICON = { diagnostics: 'microscope', microbiologie: 'petri', biofertilisation: 'sprout', phytomanagement: 'leaves', remediation: 'remediation', formations: 'cap' };

export const iconFor = (emoji) => EMOJI[String(emoji || '').replace(/️/g, '')];

/** Trace l'icône quand elle entre dans l'écran (une fois). */
function useDrawn() {
  const ref = useRef(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, drawn];
}

/**
 * name : clé d'ICONS ; emoji : émoji des données (converti) ; tile : 'light' | 'dark' | null (pastille autour)
 */
export default function Icon({ name, emoji, tile = null, className = '', size = 'h-7 w-7' }) {
  const [ref, drawn] = useDrawn();
  const key = name || iconFor(emoji);
  const glyph = ICONS[key];
  const svg = glyph
    ? <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`ico ${drawn ? 'is-in' : ''} ${size}`} aria-hidden>{glyph}</svg>
    : <span className={`ico-emoji ${size} inline-flex items-center justify-center text-2xl`} aria-hidden>{emoji}</span>;
  if (!tile) return <span ref={ref} className={`inline-flex ${className}`}>{svg}</span>;
  const dark = tile === 'dark';
  return (
    <span ref={ref} className={`ico-tile relative inline-flex shrink-0 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-white ring-1 ring-white/15' : 'bg-gradient-to-br from-white to-fi-mint text-fi-dark ring-1 ring-fi-light shadow-[0_10px_24px_-14px_rgb(var(--fi-primary)/0.6)]'} ${className}`}>
      <span aria-hidden className="ico-orbit absolute inset-0 rounded-2xl" />
      {svg}
    </span>
  );
}
