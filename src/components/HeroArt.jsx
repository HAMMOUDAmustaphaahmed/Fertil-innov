// Visuels animés propres à chaque page intérieure (en-tête). Même rendu sur mobile et ordinateur ;
// chaque visuel réagit aussi au défilement (rotation / parallaxe via la variable --ph-p, 0 → 1).
//  petri     Services    : boîtes de Petri en orbite
//  dna       Activités   : double hélice 3D (R&D)
//  rings     Formations  : cernes de croissance qui se tracent
//  contours  Chiffres    : courbes de niveau / données qui ondulent
//  network   Équipe      : réseau de personnes, signaux qui circulent
//  waves     Blog        : ondes de diffusion + égaliseur
//  horizons  Guide       : horizons de sol en parallaxe
//  bubbles   FAQ         : bulles de culture qui montent (certaines « ? »)
//  radar     Contact     : radar et points de présence
import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Boucle d'animation qui ne tourne que lorsque l'élément est visible. */
function useLoop(ref, draw) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0; let visible = true; const t0 = performance.now();
    const tick = (now) => { draw((now - t0) / 1000); raf = visible ? requestAnimationFrame(tick) : 0; };
    if (reduced()) { draw(0); return undefined; }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
    io.observe(el); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [ref, draw]);
}

function Petri() {
  const dishes = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div className="art-spin absolute right-[-12%] top-1/2 aspect-square w-[min(110vw,44rem)] -translate-y-1/2 md:right-[-4%]">
      <div className="absolute inset-[6%] rounded-full border border-dashed border-white/15" />
      {dishes.map((i) => {
        const a = (i / dishes.length) * Math.PI * 2;
        return (
          <div key={i} className="art-counter absolute h-[22%] w-[22%]" style={{ left: `${50 + Math.cos(a) * 44 - 11}%`, top: `${50 + Math.sin(a) * 44 - 11}%` }}>
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.35)" strokeWidth="3" />
              <circle cx="50" cy="50" r="38" fill="rgb(139 195 74 / 0.10)" />
              {[[38, 42, 7], [60, 36, 5], [55, 60, 9], [36, 62, 4], [66, 55, 3]].map(([x, y, r], k) => (
                <circle key={k} cx={(x + i * 7) % 70 + 15} cy={y} r={r} fill={k % 2 ? '#c8e6c9' : '#8bc34a'} opacity="0.85" />
              ))}
              <ellipse cx="36" cy="26" rx="16" ry="5" fill="white" opacity="0.15" transform="rotate(-30 36 26)" />
            </svg>
          </div>
        );
      })}
      <div className="absolute inset-[34%] rounded-full bg-fi-accent/15 blur-3xl" />
    </div>
  );
}

function Dna() {
  const ref = useRef(null);
  const N = 22;
  useLoop(ref, (t) => {
    const svg = ref.current; if (!svg) return;
    const p = Number(getComputedStyle(svg).getPropertyValue('--ph-p')) || 0;
    const ph = t * 0.9 + p * 6;
    svg.querySelectorAll('[data-r]').forEach((g) => {
      const i = Number(g.dataset.r); const a = ph + i * 0.55;
      const x1 = 100 + Math.sin(a) * 60; const x2 = 100 - Math.sin(a) * 60; const z = Math.cos(a);
      const [l, b1, b2] = g.children;
      l.setAttribute('x1', x1); l.setAttribute('x2', x2); l.setAttribute('opacity', 0.25 + 0.35 * Math.abs(z));
      b1.setAttribute('cx', x1); b1.setAttribute('r', 4 + z * 2); b1.setAttribute('opacity', 0.55 + 0.45 * z);
      b2.setAttribute('cx', x2); b2.setAttribute('r', 4 - z * 2); b2.setAttribute('opacity', 0.55 - 0.45 * z);
    });
  });
  return (
    <svg ref={ref} viewBox="0 0 200 460" className="absolute right-[2%] top-1/2 h-[120%] -translate-y-1/2 rotate-[18deg] md:right-[8%]" aria-hidden>
      {Array.from({ length: N }, (_, i) => (
        <g key={i} data-r={i}>
          <line y1={20 + i * 20} y2={20 + i * 20} stroke="#c8e6c9" strokeWidth="2" strokeLinecap="round" />
          <circle cy={20 + i * 20} fill="#8bc34a" />
          <circle cy={20 + i * 20} fill="#e8f5e9" />
        </g>
      ))}
    </svg>
  );
}

function Rings() {
  const rings = Array.from({ length: 9 }, (_, i) => i);
  const path = (i) => {
    const r = 18 + i * 11; const pts = [];
    for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2; const w = 1 + 0.05 * Math.sin(a * 3 + i) + 0.03 * Math.sin(a * 7 + i * 2); pts.push(`${(120 + Math.cos(a) * r * w).toFixed(1)},${(120 + Math.sin(a) * r * w).toFixed(1)}`); }
    return `M${pts.join('L')}Z`;
  };
  return (
    <svg viewBox="0 0 240 240" className="art-spin-slow absolute right-[-18%] top-1/2 aspect-square w-[min(120vw,46rem)] -translate-y-1/2 md:right-[-6%]" fill="none" aria-hidden>
      {rings.map((i) => <path key={i} className="art-ring" pathLength="1" d={path(i)} stroke={i % 3 === 0 ? '#8bc34a' : 'rgb(232 245 233 / 0.35)'} strokeWidth={i % 3 === 0 ? 1.6 : 0.8} style={{ animationDelay: `${i * 0.18}s` }} />)}
      <circle cx="120" cy="120" r="6" fill="#8bc34a" />
      <path d="M120 120 L 214 96" stroke="#c8e6c9" strokeWidth="0.8" strokeDasharray="2 3" />
    </svg>
  );
}

function Contours() {
  const ref = useRef(null);
  const L = 9;
  useLoop(ref, (t) => {
    const svg = ref.current; if (!svg) return;
    svg.querySelectorAll('path').forEach((pth, i) => {
      let d = '';
      for (let x = 0; x <= 400; x += 10) {
        const y = 40 + i * 30 + Math.sin(x * 0.02 + t * 0.6 + i * 0.7) * (10 + i * 1.5) + Math.sin(x * 0.045 - t * 0.4) * 6;
        d += `${x ? 'L' : 'M'}${x},${y.toFixed(1)}`;
      }
      pth.setAttribute('d', d);
    });
  });
  return (
    <svg ref={ref} viewBox="0 0 400 320" preserveAspectRatio="none" className="absolute inset-y-0 right-0 h-full w-full md:w-2/3" fill="none" aria-hidden>
      {Array.from({ length: L }, (_, i) => <path key={i} stroke={i === 4 ? '#8bc34a' : 'rgb(232 245 233 / 0.22)'} strokeWidth={i === 4 ? 2 : 1} />)}
    </svg>
  );
}

function Network() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const nodes = Array.from({ length: 26 }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006, r: i < 6 ? 7 : 3 + Math.random() * 2, big: i < 6 }));
    const pulses = [];
    let raf = 0; let visible = true; let w = 0; let h = 0; const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const size = () => { w = cv.clientWidth * dpr; h = cv.clientHeight * dpr; cv.width = w; cv.height = h; };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const edges = [];
      nodes.forEach((n) => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > 1) n.vx *= -1; if (n.y < 0 || n.y > 1) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]; const b = nodes[j]; const d = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
        if (d < 220 * dpr) { edges.push([a, b]); ctx.strokeStyle = `rgba(200,230,201,${(1 - d / (220 * dpr)) * 0.35})`; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke(); }
      }
      if (edges.length && Math.random() < 0.08) pulses.push({ e: edges[(Math.random() * edges.length) | 0], t: 0 });
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pu = pulses[k]; pu.t += 0.015; if (pu.t >= 1) { pulses.splice(k, 1); continue; }
        const [a, b] = pu.e; ctx.fillStyle = 'rgba(139,195,74,0.95)'; ctx.beginPath(); ctx.arc((a.x + (b.x - a.x) * pu.t) * w, (a.y + (b.y - a.y) * pu.t) * h, 3 * dpr, 0, Math.PI * 2); ctx.fill();
      }
      nodes.forEach((n) => {
        ctx.fillStyle = n.big ? 'rgba(139,195,74,0.9)' : 'rgba(232,245,233,0.7)';
        ctx.beginPath(); ctx.arc(n.x * w, n.y * h, n.r * dpr, 0, Math.PI * 2); ctx.fill();
        if (n.big) { ctx.strokeStyle = 'rgba(139,195,74,0.35)'; ctx.beginPath(); ctx.arc(n.x * w, n.y * h, n.r * 2.2 * dpr, 0, Math.PI * 2); ctx.stroke(); }
      });
      raf = visible ? requestAnimationFrame(draw) : 0;
    };
    size(); const ro = new ResizeObserver(size); ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduced()) raf = requestAnimationFrame(draw); }); io.observe(cv);
    if (reduced()) draw(); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} className="absolute inset-y-0 right-0 h-full w-full md:w-3/5" aria-hidden />;
}

function Waves() {
  return (
    <div className="absolute right-[6%] top-1/2 aspect-square w-[min(90vw,34rem)] -translate-y-1/2" aria-hidden>
      {[0, 1, 2, 3].map((i) => <span key={i} className="art-wave absolute inset-0 rounded-full border-2 border-fi-accent/50" style={{ animationDelay: `${i * 1}s` }} />)}
      <div className="absolute inset-[30%] flex items-center justify-center gap-[6%] rounded-full bg-fi-accent/15 px-[18%] py-[22%] backdrop-blur">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="art-eq w-[12%] rounded-full bg-fi-accent" style={{ animationDelay: `${i * 0.13}s` }} />)}
      </div>
    </div>
  );
}

function Horizons() {
  const bands = [
    ['#2b1c10', 'M0 40 C 80 30, 160 52, 240 40 S 400 30, 480 42 V 120 H 0Z'],
    ['rgb(var(--fi-soil))', 'M0 95 C 90 80, 170 108, 260 94 S 410 84, 480 98 V 200 H 0Z'],
    ['rgb(var(--fi-loam))', 'M0 170 C 100 156, 190 186, 280 170 S 420 160, 480 174 V 270 H 0Z'],
    ['#8f8577', 'M0 245 C 90 232, 200 260, 290 246 S 420 236, 480 248 V 330 H 0Z'],
  ];
  return (
    <svg viewBox="0 0 480 330" preserveAspectRatio="xMaxYMid slice" className="absolute inset-y-0 right-0 h-full w-full opacity-50 md:w-3/5 [mask-image:linear-gradient(90deg,transparent,#000_45%)]" aria-hidden>
      {bands.map(([c, d], i) => <path key={i} className="art-band" data-depth={i} d={d} fill={c} />)}
      {Array.from({ length: 18 }, (_, i) => <circle key={i} className="art-band" data-depth={2 + (i % 2)} cx={(i * 53) % 470} cy={190 + ((i * 37) % 120)} r={2 + (i % 4)} fill="#c9bba5" opacity="0.7" />)}
      <path className="art-root" pathLength="1" d="M240 0 C 236 60, 250 110, 238 170 S 226 250, 240 330" stroke="#ead7b7" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Bubbles() {
  const list = Array.from({ length: 22 }, (_, i) => ({ l: (i * 37) % 100, s: 10 + ((i * 13) % 34), d: 7 + (i % 6) * 1.6, del: (i * 0.7) % 9, q: i % 5 === 0 }));
  return (
    <div className="absolute inset-y-0 right-0 w-full overflow-hidden md:w-3/5" aria-hidden>
      {list.map((b, i) => (
        <span key={i} className="art-bubble absolute bottom-[-15%] flex items-center justify-center rounded-full border border-white/30 bg-white/5 font-display font-bold text-fi-accent"
          style={{ left: `${b.l}%`, width: b.s * 1.6, height: b.s * 1.6, fontSize: b.s * 0.8, animationDuration: `${b.d}s`, animationDelay: `${b.del}s` }}>{b.q ? '?' : ''}</span>
      ))}
    </div>
  );
}

function Radar() {
  return (
    <div className="absolute right-[-10%] top-1/2 aspect-square w-[min(110vw,40rem)] -translate-y-1/2 md:right-[4%]" aria-hidden>
      {[1, 0.75, 0.5, 0.25].map((k) => <span key={k} className="absolute rounded-full border border-white/15" style={{ inset: `${(1 - k) * 50}%` }} />)}
      <span className="absolute left-1/2 top-0 h-full w-px bg-white/10" /><span className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
      <span className="art-sweep absolute inset-0 rounded-full" />
      {[[58, 40], [36, 62], [70, 66]].map(([x, y], i) => (
        <span key={i} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
          <span className="map-pin block"><span className="block h-3 w-3 rounded-full bg-[#e53935] ring-2 ring-white" /></span>
        </span>
      ))}
    </div>
  );
}

const ARTS = { petri: Petri, dna: Dna, rings: Rings, contours: Contours, network: Network, waves: Waves, horizons: Horizons, bubbles: Bubbles, radar: Radar };

/** Visuel de l'en-tête ; progress (0→1) du défilement transmis par PageHero via --ph-p. */
export default function HeroArt({ variant }) {
  const ref = useRef(null);
  const Art = ARTS[variant];
  useEffect(() => {
    if (!ref.current || reduced()) return undefined;
    // Parallaxe des horizons selon la profondeur
    const bands = ref.current.querySelectorAll('.art-band');
    const st = bands.length ? gsap.to(bands, { y: (i, el) => -20 * (Number(el.dataset.depth) + 1), ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } }) : null;
    return () => { st?.scrollTrigger?.kill(); st?.kill(); };
  }, [variant]);
  if (!Art) return null;
  // Fondu vers la gauche : le texte de l'en-tête reste toujours lisible
  return <div ref={ref} aria-hidden className="ph-art pointer-events-none absolute inset-0 opacity-50 md:opacity-100 md:[mask-image:linear-gradient(90deg,transparent_25%,#000_60%)]"><Art /></div>;
}
