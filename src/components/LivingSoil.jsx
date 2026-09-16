// Illustration animée du hero : un sol vivant. Une pousse au-dessus de la ligne de sol,
// des racines qui se dessinent, un réseau mycorhizien qui se déploie et des nutriments
// (N, P, K, H₂O, CO₂) qui pulsent autour des nodules. Dessiné en SVG, animé par GSAP
// (trait qui se trace, pulsations), respecte prefers-reduced-motion.
import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';

const ROOTS = [
  'M200 236 C 196 270, 178 300, 150 330 S 118 380, 96 420',
  'M200 236 C 204 275, 224 305, 252 335 S 292 380, 312 424',
  'M200 236 C 200 280, 194 330, 198 380 S 206 430, 200 470',
  'M176 300 C 160 306, 140 300, 124 314',
  'M226 306 C 246 310, 262 300, 282 316',
  'M150 330 C 136 350, 120 352, 108 372',
  'M252 335 C 268 352, 284 356, 294 380',
  'M196 380 C 176 392, 160 404, 150 430',
  'M202 400 C 222 410, 240 424, 246 452',
];
// Hyphes mycorhiziennes : fins filaments qui partent des racines
const HYPHAE = [
  'M124 314 c -14 6 -30 4 -44 14 s -22 22 -30 30', 'M108 372 c -12 10 -24 8 -34 24', 'M96 420 c -10 14 -20 18 -28 36',
  'M282 316 c 16 4 30 2 44 14 s 20 20 30 28', 'M294 380 c 14 8 24 10 34 26', 'M312 424 c 8 14 16 22 24 36',
  'M150 430 c -10 10 -22 14 -30 30', 'M246 452 c 8 12 22 16 30 30', 'M200 470 c -4 14 -2 24 2 36',
  'M140 300 c -12 -6 -26 -4 -40 -2', 'M262 300 c 14 -6 26 -4 40 0',
];
const NODES = [
  { x: 124, y: 314, r: 5 }, { x: 108, y: 372, r: 4 }, { x: 96, y: 420, r: 5 }, { x: 282, y: 316, r: 5 }, { x: 294, y: 380, r: 4 }, { x: 312, y: 424, r: 5 },
  { x: 150, y: 430, r: 4 }, { x: 246, y: 452, r: 4 }, { x: 200, y: 470, r: 5 }, { x: 176, y: 300, r: 3.5 }, { x: 226, y: 306, r: 3.5 },
];
const LABELS = [
  { x: 62, y: 296, t: 'N' }, { x: 340, y: 292, t: 'P' }, { x: 58, y: 440, t: 'K' }, { x: 344, y: 456, t: 'Fe' },
  { x: 118, y: 500, t: 'H₂O' }, { x: 280, y: 508, t: 'CO₂' },
];

export default function LivingSoil({ className = '' }) {
  const ref = useRef(null);
  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    const strokes = [...q('.root'), ...q('.hypha')];
    strokes.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
    if (prefersReducedMotion()) { gsap.set(strokes, { strokeDashoffset: 0 }); gsap.set([...q('.node'), ...q('.label'), ...q('.leaf')], { opacity: 1, scale: 1 }); return; }
    gsap.set([...q('.node'), ...q('.label')], { opacity: 0, transformOrigin: 'center', scale: 0.4 });
    gsap.set(q('.leaf'), { opacity: 0, transformOrigin: '200px 236px', scale: 0.6 });
    const tl = gsap.timeline({ delay: 0.6, defaults: { ease: 'power2.out' } });
    tl.to(q('.leaf'), { opacity: 1, scale: 1, duration: 0.9, stagger: 0.12 }, 0)
      .to(q('.root'), { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: 'power1.inOut' }, 0.2)
      .to(q('.hypha'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.08, ease: 'power1.inOut' }, 1.1)
      .to(q('.node'), { opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(2)' }, 1.6)
      .to(q('.label'), { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 }, 2.2);
    // Vie du sol : nodules qui pulsent, nutriments qui flottent, feuilles qui respirent.
    gsap.to(q('.node'), { scale: 1.35, opacity: 0.55, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.2, from: 'random' }, delay: 2.4 });
    q('.label').forEach((l, i) => gsap.to(l, { y: i % 2 ? 6 : -6, duration: 2.6 + (i % 3) * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2.8 }));
    gsap.to(q('.plant'), { rotate: 1.5, transformOrigin: '200px 236px', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });
    gsap.to(q('.glow'), { opacity: 0.9, scale: 1.08, transformOrigin: 'center', duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }, { scope: ref });

  return (
    <svg ref={ref} viewBox="0 0 400 560" className={className} aria-hidden fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ls-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgb(139 195 74)" stopOpacity="0.55" /><stop offset="100%" stopColor="rgb(139 195 74)" stopOpacity="0" /></radialGradient>
        <linearGradient id="ls-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5d3f24" stopOpacity="0.55" /><stop offset="100%" stopColor="#0f2e13" stopOpacity="0" /></linearGradient>
      </defs>
      {/* halo de vie autour des racines */}
      <ellipse className="glow" cx="200" cy="380" rx="170" ry="150" fill="url(#ls-glow)" opacity="0.6" />
      {/* horizon de sol */}
      <rect x="20" y="236" width="360" height="300" rx="150" fill="url(#ls-soil)" />
      <line x1="30" y1="236" x2="370" y2="236" stroke="rgb(139 195 74)" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
      {/* pousse */}
      <g className="plant">
        <path d="M200 236 C 200 200, 202 170, 200 136" stroke="#8bc34a" strokeWidth="5" strokeLinecap="round" />
        <path className="leaf" d="M200 176 C 168 176, 146 154, 140 122 C 176 120, 200 142, 200 176 Z" fill="#8bc34a" />
        <path className="leaf" d="M200 156 C 232 156, 254 134, 260 102 C 224 100, 200 122, 200 156 Z" fill="#a5d86a" />
        <path className="leaf" d="M200 136 C 188 122, 190 104, 200 92 C 210 104, 212 122, 200 136 Z" fill="#c8e6c9" />
        <path className="leaf" d="M200 176 C 176 176, 160 164, 152 148" stroke="#0f2e13" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
        <path className="leaf" d="M200 156 C 224 156, 240 144, 248 128" stroke="#0f2e13" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* racines */}
      {ROOTS.map((d, i) => <path key={i} className="root" d={d} stroke="#e8f5e9" strokeOpacity="0.9" strokeWidth={i < 3 ? 3 : 2} strokeLinecap="round" />)}
      {/* réseau mycorhizien */}
      {HYPHAE.map((d, i) => <path key={i} className="hypha" d={d} stroke="#8bc34a" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />)}
      {/* nodules / bactéries */}
      {NODES.map((n, i) => <circle key={i} className="node" cx={n.x} cy={n.y} r={n.r} fill="#c8e6c9" stroke="#8bc34a" strokeWidth="1.5" />)}
      {/* nutriments */}
      {LABELS.map((l) => (
        <g key={l.t} className="label">
          <circle cx={l.x} cy={l.y} r="17" fill="#0f2e13" fillOpacity="0.55" stroke="#8bc34a" strokeOpacity="0.7" strokeWidth="1.2" />
          <text x={l.x} y={l.y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#c8e6c9" fontFamily="var(--font-display), sans-serif">{l.t}</text>
        </g>
      ))}
    </svg>
  );
}
