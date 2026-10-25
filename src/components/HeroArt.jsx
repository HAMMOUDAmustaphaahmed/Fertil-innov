// Visuels animés propres à chaque page intérieure (en-tête). Même rendu sur mobile et ordinateur ;
// chaque visuel réagit aussi au défilement (rotation / parallaxe via la variable --ph-p, 0 → 1).
//  petri     Services    : grande boîte de Petri, colonies qui poussent, loupe à la souris
//  dna       Activités   : double hélice d'ADN réaliste (modèle moléculaire en perspective)
//  scope     Expertise   : oculaire de microscope en fond noir, micro-organismes vivants
//  parcours  Formations  : parcours d'apprentissage dans une carotte de sol (vraies formations)
//  wood      (réserve)   : tranche de tronc, cernes, anneau de lumière, lampe à la souris
//  data      Chiffres    : champ de carottes de sol 3D, nos chiffres épinglés, soleil, pollen
//  myco      Équipe      : réseau mycorhizien, impulsions de nutriments
//  leaves    Blog        : feuilles nervurées qui dérivent dans la brise
//  iris      FAQ         : bulles irisées qui éclatent à la souris
//  rings     (réserve)   : cernes de croissance qui se tracent
//  contours  (réserve)   : courbes de niveau / données qui ondulent
//  network   (réserve)   : réseau de personnes, signaux qui circulent
//  waves     (réserve)   : ondes de diffusion + égaliseur
//  horizons  Guide       : horizons de sol en parallaxe
//  bubbles   (réserve)   : bulles de culture qui montent (certaines « ? »)
//  radar     Contact     : radar et points de présence
import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';

const reduced = () => false; // animations sur tous les appareils (voir lib/gsap.js)

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

// Canvas qui suit la taille de son élément (densité de pixels plafonnée) ; renvoie [ctx, w, h, dpr]
function fit(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.round(cv.clientWidth * dpr); const h = Math.round(cv.clientHeight * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return [cv.getContext('2d'), w, h, dpr];
}
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// Pointeur relatif à un élément (-0.5 … 0.5), partagé par les visuels qui réagissent à la souris
function usePointer(ref) {
  const pt = useRef({ x: 0, y: 0, px: -1, py: -1, in: false });
  useEffect(() => {
    const move = (e) => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      pt.current.x = (e.clientX - r.left) / r.width - 0.5; pt.current.y = (e.clientY - r.top) / r.height - 0.5;
      pt.current.px = e.clientX - r.left; pt.current.py = e.clientY - r.top;
      pt.current.in = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [ref]);
  return pt;
}

// Services : grande boîte de Petri vue de dessus. Gélose ambrée, colonies qui poussent (bactéries brillantes,
// colonies pigmentées, mycélium de champignon duveteux à cœur vert, traînée d'ensemencement), reflets du verre ;
// une loupe suit la souris au-dessus de la boîte et grossit les colonies.
function Petri() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    const R = Math.min(w, h) * 0.46; const cx = w / 2; const cy = h / 2;
    // Préparation (une fois par taille) : fond de gélose et colonies
    if (!st.current || st.current.w !== w || st.current.h !== h) {
      const r = rand(17); const Rn = (a2, b2) => a2 + r() * (b2 - a2);
      const base = document.createElement('canvas'); base.width = w; base.height = h;
      const b = base.getContext('2d');
      let g = b.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R * 0.93);
      g.addColorStop(0, '#f6e7bd'); g.addColorStop(0.6, '#ecd49a'); g.addColorStop(1, '#cfae6c');
      b.fillStyle = g; b.beginPath(); b.arc(cx, cy, R * 0.93, 0, 6.283); b.fill();
      for (let i = 0; i < 1800; i++) { const a2 = Rn(0, 6.283); const d = Math.sqrt(r()) * R * 0.92; b.fillStyle = `rgba(${r() < 0.5 ? '255,250,230' : '150,110,60'},${Rn(0.05, 0.18)})`; b.fillRect(cx + Math.cos(a2) * d, cy + Math.sin(a2) * d, dpr, dpr); }
      const cols = [];
      const place = (minD, maxD) => { const a2 = Rn(0, 6.283); const d = Rn(minD, maxD) * R; return [cx + Math.cos(a2) * d, cy + Math.sin(a2) * d]; };
      for (let i = 0; i < 26; i++) { const [x, y] = place(0.1, 0.82); cols.push({ k: 'bact', x, y, r: Rn(0.018, 0.05) * R, c: [['#fff8e1', '#e9d7a5'], ['#fffdf5', '#d8c48f'], ['#fbe9c8', '#d6b06a']][i % 3], ring: r() < 0.4, b: Rn(0.2, 2.6) }); }
      for (let i = 0; i < 7; i++) { const [x, y] = place(0.15, 0.8); cols.push({ k: 'bact', x, y, r: Rn(0.025, 0.05) * R, c: [['#ffd1dc', '#e48aa0'], ['#ffe0b2', '#f2a65a'], ['#dcedc8', '#8bc34a']][i % 3], ring: true, b: Rn(0.8, 3) }); }
      for (let i = 0; i < 3; i++) { const [x, y] = place(0.25, 0.6); const hy = []; for (let k = 0; k < 90; k++) { let a2 = Rn(0, 6.283); let px = 0; let py = 0; const seg = []; const L = Rn(0.5, 1); for (let s2 = 0; s2 < 9; s2++) { a2 += Rn(-0.35, 0.35); px += Math.cos(a2) * L / 9; py += Math.sin(a2) * L / 9; seg.push([px, py]); } hy.push(seg); } cols.push({ k: 'fung', x, y, r: Rn(0.13, 0.19) * R, hy, b: Rn(0, 1.2) }); }
      const streak = []; for (let i = 0; i < 70; i++) { const u = i / 70; streak.push({ x: cx + (u - 0.5) * R * 1.1, y: cy + R * 0.55 + Math.sin(u * 22) * R * 0.05, r: Rn(0.006, 0.012) * R, b: 1 + u * 2 }); }
      st.current = { w, h, base, cols, streak };
    }
    const { base, cols, streak } = st.current;
    const grow = (b0) => { const u = Math.min(1, Math.max(0, (t - b0) / 2.5)); return 1 - Math.pow(1 - u, 3); };
    const p = Number(getComputedStyle(cv).getPropertyValue('--ph-p')) || 0;
    const rot = t * 0.025 + p * 0.8;
    const drawDish = (c) => {
      c.save(); c.translate(cx, cy); c.rotate(rot); c.translate(-cx, -cy);
      c.drawImage(base, 0, 0);
      for (const s2 of streak) { const k2 = grow(s2.b); if (!k2) continue; c.fillStyle = 'rgba(255,248,225,0.9)'; c.beginPath(); c.arc(s2.x, s2.y, s2.r * k2, 0, 6.283); c.fill(); }
      for (const o of cols) {
        const k2 = grow(o.b); if (!k2) continue; const rr = o.r * k2;
        if (o.k === 'fung') {
          c.save(); c.translate(o.x, o.y); c.lineCap = 'round';
          c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = dpr * 0.8;
          for (const seg of o.hy) { c.beginPath(); c.moveTo(0, 0); for (const [sx, sy] of seg) c.lineTo(sx * rr, sy * rr); c.stroke(); }
          let g2 = c.createRadialGradient(0, 0, 0, 0, 0, rr); g2.addColorStop(0, 'rgba(90,140,60,0.95)'); g2.addColorStop(0.35, 'rgba(120,170,80,0.75)'); g2.addColorStop(0.55, 'rgba(250,250,240,0.7)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g2; c.beginPath(); c.arc(0, 0, rr, 0, 6.283); c.fill();
          c.restore();
        } else {
          c.fillStyle = 'rgba(80,50,20,0.25)'; c.beginPath(); c.arc(o.x + rr * 0.15, o.y + rr * 0.2, rr, 0, 6.283); c.fill();
          const g2 = c.createRadialGradient(o.x - rr * 0.35, o.y - rr * 0.4, rr * 0.05, o.x, o.y, rr);
          g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.3, o.c[0]); g2.addColorStop(1, o.c[1]);
          c.fillStyle = g2; c.beginPath(); c.arc(o.x, o.y, rr, 0, 6.283); c.fill();
          if (o.ring) { c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = dpr; c.beginPath(); c.arc(o.x, o.y, rr * 0.62, 0, 6.283); c.stroke(); }
        }
      }
      c.restore();
      // Verre : bord épais, reflets (ne tournent pas avec la boîte)
      c.lineWidth = R * 0.05; c.strokeStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.arc(cx, cy, R * 0.965, 0, 6.283); c.stroke();
      c.lineWidth = dpr * 1.5; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(cx, cy, R * 0.93, 0, 6.283); c.stroke();
      c.lineWidth = R * 0.03; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(cx, cy, R * 0.9, 3.6, 4.4); c.stroke();
      c.lineWidth = R * 0.015; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(cx, cy, R * 0.9, 0.3, 0.7); c.stroke();
    };
    ctx.clearRect(0, 0, w, h);
    // Ombre portée et halo vert
    let g = ctx.createRadialGradient(cx + R * 0.05, cy + R * 0.08, R * 0.8, cx, cy, R * 1.25); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    drawDish(ctx);
    // Loupe qui suit la souris au-dessus de la boîte
    const P = pt.current;
    if (P.in) {
      const lx = P.px * dpr; const ly = P.py * dpr;
      if (Math.hypot(lx - cx, ly - cy) < R * 0.95) {
        const lr = Math.min(w, h) * 0.11; const z = 2.6;
        ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 6.283); ctx.clip();
        ctx.fillStyle = '#d9bd80'; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
        ctx.translate(lx, ly); ctx.scale(z, z); ctx.translate(-lx, -ly); drawDish(ctx);
        ctx.restore();
        g = ctx.createRadialGradient(lx, ly, lr * 0.7, lx, ly, lr); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 6.283); ctx.fill();
        ctx.lineWidth = dpr * 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 6.283); ctx.stroke();
        ctx.lineWidth = dpr * 6; ctx.strokeStyle = 'rgba(139,195,74,0.35)'; ctx.beginPath(); ctx.arc(lx, ly, lr + dpr * 5, 0, 6.283); ctx.stroke();
      }
    }
  });
  return <canvas ref={ref} aria-hidden className="absolute right-[-38%] top-1/2 aspect-square w-[min(120vw,46rem)] -translate-y-1/2 md:right-[-6%]" />;
}

// Activités : double hélice d'ADN réaliste façon modèle moléculaire. Brins de sphères éclairées (phosphates,
// sucres) avec petit et grand sillons, paires de bases A-T / G-C en bâtonnets colorés, perspective et
// profondeur (lointain estompé, lueur des atomes proches), bokeh et nucléotides libres en arrière-plan.
// Rotation lente, accélérée au défilement ; légère inclinaison selon la souris.
const DNA_COL = { p1: '#8bc34a', s1: '#d7efb8', p2: '#4fb3a9', s2: '#c3ece6', A: '#f2c46d', T: '#e7a1a8', G: '#7fd8c8', C: '#b9a3ff' };
function sphereSprite(color, size = 96) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); const r = size / 2;
  const g = x.createRadialGradient(r * 0.68, r * 0.6, r * 0.05, r, r, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, color); g.addColorStop(0.75, color); g.addColorStop(1, 'rgba(0,0,0,0.65)');
  x.fillStyle = g; x.beginPath(); x.arc(r, r, r * 0.98, 0, 6.283); x.fill();
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(r * 1.25, r * 1.3, r * 0.9, 0, 6.283); x.fill();
  return c;
}
function Dna() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    if (!st.current) {
      const r = rand(5);
      const sprites = {}; Object.entries(DNA_COL).forEach(([k, c]) => { sprites[k] = sphereSprite(c); });
      const bokeh = Array.from({ length: 22 }, () => ({ x: r(), y: r(), s: 0.02 + r() * 0.07, a: 0.04 + r() * 0.1, v: 0.004 + r() * 0.01 }));
      const free = Array.from({ length: 9 }, (_, i) => ({ x: r(), y: r(), z: r(), k: 'ATGC'[i % 4], v: 0.01 + r() * 0.02, ph: r() * 6 }));
      const pairs = Array.from({ length: 80 }, () => (r() < 0.5 ? ['A', 'T'] : ['G', 'C'])).map((pr) => (r() < 0.5 ? pr : [pr[1], pr[0]]));
      st.current = { sprites, bokeh, free, pairs, mx: 0, my: 0 };
    }
    const S = st.current; const P = pt.current;
    S.mx += (P.x - S.mx) * 0.05; S.my += (P.y - S.my) * 0.05;
    const p = Number(getComputedStyle(cv).getPropertyValue('--ph-p')) || 0;
    ctx.clearRect(0, 0, w, h);
    // Arrière-plan : bokeh qui monte doucement
    for (const b of S.bokeh) {
      const y = ((b.y - t * b.v) % 1 + 1) % 1; const rr = b.s * Math.min(w, h);
      const g = ctx.createRadialGradient(b.x * w, y * h, 0, b.x * w, y * h, rr); g.addColorStop(0, `rgba(170,230,150,${b.a})`); g.addColorStop(1, 'rgba(170,230,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x * w, y * h, rr, 0, 6.283); ctx.fill();
    }
    // Hélice
    const R = Math.min(w * 0.2, h * 0.16); const sp = R * 0.36; const F = R * 5;
    const cx = w * 0.55 + S.mx * w * 0.04; const cy = h / 2 + S.my * h * 0.03;
    const tilt = 0.32 + S.mx * 0.12; const ct = Math.cos(tilt); const sn = Math.sin(tilt);
    const L = Math.hypot(w, h) * 1.15; const n = Math.ceil(L / sp);
    const rot = t * 0.45 + p * 5;
    const items = [];
    const proj = (ang, rad, y) => {
      const x = Math.cos(ang) * rad; const z = Math.sin(ang) * rad; const k = F / (F - z);
      const sx = x * k; const sy = y * k;
      return [cx + sx * ct - sy * sn, cy + sx * sn + sy * ct, z, k];
    };
    for (let i = 0; i < n; i++) {
      const y = -L / 2 + i * sp; const th = i * (Math.PI * 2 / 10) + rot;
      const a1 = th; const a2 = th + Math.PI * 0.78; // petit et grand sillons
      const pr = S.pairs[i % S.pairs.length];
      const P1 = proj(a1, R, y); const P2 = proj(a2, R, y);
      const S1 = proj(a1 - 0.22, R * 0.82, y + sp * 0.35); const S2 = proj(a2 + 0.22, R * 0.82, y + sp * 0.35);
      items.push({ z: P1[2], kind: 's', spr: 'p1', x: P1[0], y: P1[1], r: R * 0.17 * P1[3] });
      items.push({ z: P2[2], kind: 's', spr: 'p2', x: P2[0], y: P2[1], r: R * 0.17 * P2[3] });
      items.push({ z: S1[2], kind: 's', spr: 's1', x: S1[0], y: S1[1], r: R * 0.12 * S1[3] });
      items.push({ z: S2[2], kind: 's', spr: 's2', x: S2[0], y: S2[1], r: R * 0.12 * S2[3] });
      const M = proj((a1 + a2) / 2 + (Math.abs(a2 - a1) > Math.PI ? Math.PI : 0), R * 0.05, y + sp * 0.35);
      items.push({ z: (S1[2] + M[2]) / 2, kind: 'b', c: DNA_COL[pr[0]], x1: S1[0], y1: S1[1], x2: M[0], y2: M[1], wdt: R * 0.11 * S1[3] });
      items.push({ z: (S2[2] + M[2]) / 2, kind: 'b', c: DNA_COL[pr[1]], x1: S2[0], y1: S2[1], x2: M[0], y2: M[1], wdt: R * 0.11 * S2[3] });
    }
    items.sort((u, v) => u.z - v.z);
    for (const it of items) {
      const depth = (it.z / R + 1) / 2; // 0 loin → 1 proche
      ctx.globalAlpha = 0.3 + depth * 0.7;
      if (it.kind === 's') {
        ctx.drawImage(S.sprites[it.spr], it.x - it.r, it.y - it.r, it.r * 2, it.r * 2);
      } else {
        ctx.lineCap = 'round';
        ctx.strokeStyle = it.c; ctx.lineWidth = it.wdt; ctx.beginPath(); ctx.moveTo(it.x1, it.y1); ctx.lineTo(it.x2, it.y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = it.wdt * 0.3; ctx.beginPath(); ctx.moveTo(it.x1, it.y1 - it.wdt * 0.2); ctx.lineTo(it.x2, it.y2 - it.wdt * 0.2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    // Lueur des atomes les plus proches
    ctx.globalCompositeOperation = 'lighter';
    for (const it of items) {
      if (it.kind !== 's' || it.z < R * 0.6) continue;
      const g = ctx.createRadialGradient(it.x, it.y, 0, it.x, it.y, it.r * 2.4); g.addColorStop(0, 'rgba(180,240,140,0.16)'); g.addColorStop(1, 'rgba(180,240,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.x, it.y, it.r * 2.4, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Nucléotides libres qui dérivent
    for (const f of S.free) {
      const y = ((f.y - t * f.v) % 1 + 1) % 1; const x = f.x + Math.sin(t * 0.5 + f.ph) * 0.02; const rr = R * (0.08 + f.z * 0.1);
      ctx.globalAlpha = 0.25 + f.z * 0.45; ctx.drawImage(S.sprites[f.k], x * w - rr, y * h - rr, rr * 2, rr * 2);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-[58%]" />;
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

// Expertise : oculaire de microscope en fond noir. Micro-organismes vivants (bacilles, coques, paramécie aux
// cils battants, diatomées vitreuses, hyphes) ; la souris déplace la platine ; réticule et barre d'échelle.
function Scope() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    const R = Math.min(w, h) * 0.44; const cx = w / 2; const cy = h / 2;
    if (!st.current) {
      const r = rand(31); const Rn = (a, b) => a + r() * (b - a);
      const pos = () => [Rn(-1.3, 1.3), Rn(-1.3, 1.3)];
      st.current = {
        rods: Array.from({ length: 46 }, () => { const [x, y] = pos(); return { x, y, a: Rn(0, 6.28), l: Rn(0.035, 0.07), v: Rn(0.02, 0.06), ph: Rn(0, 6.28) }; }),
        cocci: Array.from({ length: 14 }, () => { const [x, y] = pos(); const n = 2 + ((r() * 5) | 0); return { x, y, n, a: Rn(0, 6.28), v: Rn(0.005, 0.015) }; }),
        para: Array.from({ length: 2 }, (_, i) => ({ x: i ? 0.5 : -0.6, y: i ? -0.3 : 0.4, a: Rn(0, 6.28), v: Rn(0.05, 0.08), ph: Rn(0, 6.28) })),
        diat: Array.from({ length: 7 }, (_, i) => { const [x, y] = pos(); return { x, y, a: Rn(0, 6.28), va: Rn(-0.1, 0.1), k: i % 3 === 0 ? 'c' : 'p', s: Rn(0.06, 0.1) }; }),
        hyph: Array.from({ length: 3 }, () => { let [x, y] = pos(); let a = Rn(0, 6.28); const pts = []; for (let k = 0; k < 40; k++) { a += Rn(-0.25, 0.25); x += Math.cos(a) * 0.04; y += Math.sin(a) * 0.04; pts.push([x, y]); } return pts; }),
        pan: [0, 0],
      };
    }
    const S = st.current; const P = pt.current;
    S.pan[0] += ((P.in ? -P.x * 0.6 : Math.sin(t * 0.07) * 0.2) - S.pan[0]) * 0.03;
    S.pan[1] += ((P.in ? -P.y * 0.6 : Math.cos(t * 0.05) * 0.2) - S.pan[1]) * 0.03;
    const X = (x) => cx + (x + S.pan[0]) * R; const Y = (y) => cy + (y + S.pan[1]) * R;
    ctx.clearRect(0, 0, w, h);
    // Corps de l'oculaire (bague métallique)
    let g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.12); g.addColorStop(0, '#0b0f0c'); g.addColorStop(0.4, '#3a4440'); g.addColorStop(0.7, '#1a201d'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 6.283); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, '#0d1a16'); g.addColorStop(0.8, '#060c0a'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    // Hyphes
    ctx.strokeStyle = 'rgba(190,230,210,0.22)'; ctx.lineWidth = R * 0.008;
    for (const hp of S.hyph) { ctx.beginPath(); hp.forEach(([x, y], k) => (k ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke(); }
    // Bacilles : bâtonnets lumineux qui frétillent et avancent
    for (const b of S.rods) {
      b.a += Math.sin(t * 2 + b.ph) * 0.01; b.x += Math.cos(b.a) * b.v * 0.016; b.y += Math.sin(b.a) * b.v * 0.016;
      if (b.x > 1.4) b.x = -1.4; if (b.x < -1.4) b.x = 1.4; if (b.y > 1.4) b.y = -1.4; if (b.y < -1.4) b.y = 1.4;
      const dx = Math.cos(b.a) * b.l * R / 2; const dy = Math.sin(b.a) * b.l * R / 2;
      ctx.strokeStyle = 'rgba(160,230,220,0.18)'; ctx.lineWidth = R * 0.03; ctx.beginPath(); ctx.moveTo(X(b.x) - dx, Y(b.y) - dy); ctx.lineTo(X(b.x) + dx, Y(b.y) + dy); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,255,245,0.75)'; ctx.lineWidth = R * 0.012; ctx.beginPath(); ctx.moveTo(X(b.x) - dx, Y(b.y) - dy); ctx.lineTo(X(b.x) + dx, Y(b.y) + dy); ctx.stroke();
    }
    // Coques en grappes
    for (const c of S.cocci) {
      c.x += Math.cos(c.a) * c.v * 0.016; c.y += Math.sin(c.a) * c.v * 0.016;
      for (let k = 0; k < c.n; k++) { const kx = X(c.x) + Math.cos(k * 2.1) * R * 0.018 * (k ? 1 : 0); const ky = Y(c.y) + Math.sin(k * 2.1) * R * 0.018 * (k ? 1 : 0);
        ctx.fillStyle = 'rgba(200,250,190,0.6)'; ctx.beginPath(); ctx.arc(kx, ky, R * 0.011, 0, 6.283); ctx.fill(); }
    }
    // Diatomées : coques de verre striées (pennées et centriques)
    for (const d of S.diat) {
      d.a += d.va * 0.016; ctx.save(); ctx.translate(X(d.x), Y(d.y)); ctx.rotate(d.a);
      const L = d.s * R;
      ctx.strokeStyle = 'rgba(240,250,255,0.55)'; ctx.lineWidth = dpr;
      if (d.k === 'p') {
        ctx.beginPath(); ctx.ellipse(0, 0, L, L * 0.22, 0, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,250,255,0.25)'; for (let k = -8; k <= 8; k++) { const x = (k / 8) * L * 0.9; const hh = L * 0.22 * Math.sqrt(1 - (x / L) ** 2); ctx.beginPath(); ctx.moveTo(x, -hh); ctx.lineTo(x, hh); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, L * 0.5, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,250,255,0.25)'; for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * L * 0.12, Math.sin(a) * L * 0.12); ctx.lineTo(Math.cos(a) * L * 0.48, Math.sin(a) * L * 0.48); ctx.stroke(); }
      }
      ctx.restore();
    }
    // Paramécies : corps en pantoufle, vacuoles, cils qui battent
    for (const pa of S.para) {
      pa.a += Math.sin(t * 0.4 + pa.ph) * 0.004; pa.x += Math.cos(pa.a) * pa.v * 0.016; pa.y += Math.sin(pa.a) * pa.v * 0.016;
      if (Math.hypot(pa.x, pa.y) > 1.3) pa.a += Math.PI;
      ctx.save(); ctx.translate(X(pa.x), Y(pa.y)); ctx.rotate(pa.a);
      const L = R * 0.2; const W2 = L * 0.38;
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, L); g.addColorStop(0, 'rgba(120,200,170,0.12)'); g.addColorStop(1, 'rgba(120,200,170,0.04)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, L, W2, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(210,255,235,0.6)'; ctx.lineWidth = dpr * 1.2; ctx.beginPath(); ctx.ellipse(0, 0, L, W2, 0, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = 'rgba(210,255,235,0.35)'; ctx.lineWidth = dpr * 0.8;
      for (let k = 0; k < 40; k++) { const a = (k / 40) * 6.283; const ex = Math.cos(a) * L; const ey = Math.sin(a) * W2; const beat = Math.sin(t * 9 - k * 0.6) * 0.5; const nx = Math.cos(a + beat) * L * 0.12; const ny = Math.sin(a + beat) * L * 0.12; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + nx, ey + ny); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,255,220,0.35)'; [[-0.4, 0.1, 0.12], [0.3, -0.1, 0.1], [0, 0.05, 0.16]].forEach(([vx, vy, vr]) => { ctx.beginPath(); ctx.arc(vx * L, vy * W2 * 2, vr * W2, 0, 6.283); ctx.fill(); });
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Réticule et barre d'échelle
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = dpr;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(cx + k * R * 0.05, cy - (k % 5 ? 4 : 9) * dpr); ctx.lineTo(cx + k * R * 0.05, cy + (k % 5 ? 4 : 9) * dpr); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(cx + R * 0.35, cy + R * 0.7, R * 0.2, dpr * 2);
    ctx.font = `${11 * dpr}px Manrope, sans-serif`; ctx.fillText('10 µm', cx + R * 0.38, cy + R * 0.68);
    g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = dpr * 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
    for (let k = 0; k < 90; k++) { const a = (k / 90) * 6.283 + t * 0.02; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05); ctx.lineTo(cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1); ctx.stroke(); }
  });
  return <canvas ref={ref} aria-hidden className="absolute right-[-38%] top-1/2 aspect-square w-[min(120vw,46rem)] -translate-y-1/2 md:right-[-4%]" />;
}

// Formations : tranche de tronc réaliste. Cernes de largeurs variées (bois de printemps clair, bois d'été
// sombre), moelle, écorce, fentes radiales, grain du bois ; un anneau de lumière part du cœur, année après
// année ; la souris éclaire le bois comme une lampe. La tranche tourne au défilement.
function Wood() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h] = fit(cv);
    if (!w || !h) return;
    const R = Math.min(w, h) * 0.45; const cx = w / 2; const cy = h / 2;
    if (!st.current || st.current.w !== w) {
      const r = rand(9); const Rn = (a, b) => a + r() * (b - a);
      const off = document.createElement('canvas'); off.width = w; off.height = h; const o = off.getContext('2d');
      const ph = [Rn(0, 6), Rn(0, 6), Rn(0, 6)];
      const shape = (a) => 1 + 0.05 * Math.sin(a * 2 + ph[0]) + 0.03 * Math.sin(a * 3 + ph[1]) + 0.015 * Math.sin(a * 7 + ph[2]);
      const ox = cx - R * 0.06; const oy = cy + R * 0.04; // cœur légèrement décentré
      const ring = (rad, fill) => { o.beginPath(); for (let k = 0; k <= 120; k++) { const a = (k / 120) * 6.283; const rr = rad * shape(a); const x = ox + Math.cos(a) * rr; const y = oy + Math.sin(a) * rr; if (k) o.lineTo(x, y); else o.moveTo(x, y); } o.closePath(); o.fillStyle = fill; o.fill(); };
      // Écorce
      ring(R, '#3b2414'); ring(R * 0.97, '#5a3820'); ring(R * 0.93, '#2f1c0f');
      // Cernes, de l'extérieur vers le cœur
      const radii = []; let rad = R * 0.9; while (rad > R * 0.03) { radii.push(rad); rad -= R * Rn(0.025, 0.06); }
      radii.forEach((rr, i) => { const tone = Rn(-12, 12); ring(rr, `rgb(${168 + tone},${116 + tone},${66 + tone})`); ring(rr * 0.985, `rgb(${226 + tone},${190 + tone},${140 + tone})`); });
      ring(R * 0.03, '#6b4424');
      // Grain et fentes radiales
      for (let i = 0; i < 4000; i++) { const a = Rn(0, 6.283); const d = Math.sqrt(r()) * R * 0.9; o.fillStyle = `rgba(${r() < 0.5 ? '90,50,20' : '255,240,210'},${Rn(0.05, 0.15)})`; o.fillRect(ox + Math.cos(a) * d, oy + Math.sin(a) * d, Rn(1, 3), 1); }
      for (let k = 0; k < 3; k++) { const a = Rn(0, 6.283); o.strokeStyle = 'rgba(40,20,8,0.7)'; o.lineWidth = Rn(1.5, 3); o.beginPath(); o.moveTo(ox + Math.cos(a) * R * 0.92, oy + Math.sin(a) * R * 0.92); for (let s2 = 1; s2 <= 10; s2++) { const d = R * 0.92 * (1 - s2 / 10 * Rn(0.4, 0.6)); o.lineTo(ox + Math.cos(a + Rn(-0.02, 0.02)) * d, oy + Math.sin(a + Rn(-0.02, 0.02)) * d); } o.stroke(); }
      st.current = { w, off, shape, ox, oy };
    }
    const S = st.current; const P = pt.current;
    const p = Number(getComputedStyle(cv).getPropertyValue('--ph-p')) || 0;
    ctx.clearRect(0, 0, w, h);
    let g = ctx.createRadialGradient(cx + R * 0.06, cy + R * 0.1, R * 0.8, cx, cy, R * 1.25); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(p * 0.8 + t * 0.01); ctx.translate(-cx, -cy); ctx.drawImage(S.off, 0, 0);
    // Anneau de lumière qui grandit, année après année
    const k = (t * 0.12) % 1; const rr = R * 0.9 * k;
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(197,255,120,${0.5 * (1 - k)})`; ctx.lineWidth = R * 0.012;
    ctx.beginPath(); for (let s2 = 0; s2 <= 120; s2++) { const a = (s2 / 120) * 6.283; const r2 = rr * S.shape(a); const x = S.ox + Math.cos(a) * r2; const y = S.oy + Math.sin(a) * r2; if (s2) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    ctx.restore();
    // Lampe : la souris éclaire le bois
    const lx = P.in ? P.px * (w / cv.clientWidth) : cx - R * 0.4; const ly = P.in ? P.py * (h / cv.clientHeight) : cy - R * 0.4;
    ctx.globalCompositeOperation = 'soft-light';
    g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * 0.9); g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  });
  return <canvas ref={ref} aria-hidden className="absolute right-[-38%] top-1/2 aspect-square w-[min(120vw,46rem)] -translate-y-1/2 md:right-[-4%]" />;
}

// Chiffres : champ de carottes de sol en 3D isométrique. Chaque colonne est une carotte (herbe au sommet,
// horizons de sol sur les faces) ; le champ ondule comme du blé sous le vent, les colonnes se soulèvent
// autour de la souris. Nos vrais chiffres flottent au-dessus, épinglés à des colonnes qui pulsent ;
// ombres portées, rayon de soleil qui balaie le champ, pollen qui s'élève.
const DF_LAYERS = [[0.05, [124, 179, 66]], [0.2, [43, 26, 13]], [0.3, [93, 63, 36]], [0.27, [138, 100, 64]], [1, [163, 154, 139]]];
const DF_PINS = [[3, 8, 'projets', '', 'compteur_projets'], [8, 3, 'hectares', ' ha', 'compteur_ha'], [9, 9, 'satisfaction', ' %', 'compteur_satisfaction'], [5, 5, 'annees', '', 'compteur_annees']];
function DataField() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const { t: tr } = useLang();
  const { chiffres } = useSite();
  const pins = useRef([]);
  pins.current = DF_PINS.map(([i, j, k, suf, lab]) => ({ i, j, v: `${chiffres?.[k] ?? ''}${suf}`, l: tr(lab) })).filter((q) => q.v.trim());
  const pollen = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    const N = 12; const cw = Math.min(w / (N * 2.9), h / (N * 1.9)); const ch = cw * 0.55;
    const ox = w * 0.68; const oy = h * 0.6 - N * ch * 0.6;
    const P = pt.current; const mx = P.in ? P.px * (w / cv.clientWidth) : -9999; const my = P.in ? P.py * (h / cv.clientHeight) : -9999;
    const p = Number(getComputedStyle(cv).getPropertyValue('--ph-p')) || 0;
    const pinAt = new Map(pins.current.map((q) => [`${q.i},${q.j}`, q]));
    const sweep = ((t * 0.12) % 1.6) - 0.3; // rayon de soleil, en diagonale sur le champ
    ctx.clearRect(0, 0, w, h);
    // Sol : grille
    ctx.strokeStyle = 'rgba(200,230,201,0.08)'; ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(ox + i * cw, oy + i * ch); ctx.lineTo(ox + (i - N) * cw, oy + (i + N) * ch); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox - i * cw, oy + i * ch); ctx.lineTo(ox + (N - i) * cw, oy + (N + i) * ch); ctx.stroke(); }
    // Hauteurs (et ombres portées, dessinées avant les colonnes)
    const cells = [];
    for (let s2 = 0; s2 <= 2 * (N - 1); s2++) for (let i = 0; i < N; i++) {
      const j = s2 - i; if (j < 0 || j >= N) continue;
      const bx = ox + (i - j) * cw; const by = oy + (i + j + 1) * ch;
      let v = 0.5 + 0.5 * Math.sin(i * 0.45 + t * 1.2 + p * 4) * Math.cos(j * 0.38 - t * 0.8);
      const near = Math.hypot(bx - mx, by - ch - my); if (near < cw * 4) v += (1 - near / (cw * 4)) * 0.9;
      const pin = pinAt.get(`${i},${j}`); if (pin) v = 1.05 + 0.12 * Math.sin(t * 2.2 + i);
      const H = (0.15 + v * 1.1) * ch * 4.2;
      const sun = Math.max(0, 1 - Math.abs((i - j) / N * 0.5 + 0.5 - sweep) * 6);
      cells.push({ i, j, bx, by, H, lum: Math.min(1, v), sun, pin });
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; const sh = H * 0.35;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + cw, by - ch); ctx.lineTo(bx + cw + sh, by - ch + sh * 0.3); ctx.lineTo(bx + sh, by + sh * 0.3); ctx.closePath(); ctx.fill();
    }
    const tone = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
    const face = (bx, by, H, dir, k) => { // face latérale découpée en horizons de sol (dir -1 gauche, +1 droite)
      let d = 0;
      for (const [f, col] of DF_LAYERS) {
        const d2 = f >= 1 ? H : Math.min(H, d + Math.max(2 * dpr * (col === DF_LAYERS[0][1] ? 1 : 0), H * f));
        ctx.fillStyle = tone(col, k);
        ctx.beginPath(); ctx.moveTo(bx + dir * cw, by - ch - H + d); ctx.lineTo(bx, by - H + d); ctx.lineTo(bx, by - H + d2); ctx.lineTo(bx + dir * cw, by - ch - H + d2); ctx.closePath(); ctx.fill();
        d = d2; if (d >= H) break;
      }
    };
    const tops = [];
    for (const c of cells) {
      const { bx, by, H, lum, sun, pin } = c; const k = 0.75 + lum * 0.3 + sun * 0.22;
      face(bx, by, H, -1, 0.62 * k); face(bx, by, H, 1, 0.85 * k);
      const g0 = pin ? [242, 196, 109] : [110 + lum * 80, 170 + lum * 60, 60 + lum * 30];
      ctx.fillStyle = tone(g0, 1 + sun * 0.22);
      ctx.beginPath(); ctx.moveTo(bx, by - H); ctx.lineTo(bx - cw, by - ch - H); ctx.lineTo(bx, by - 2 * ch - H); ctx.lineTo(bx + cw, by - ch - H); ctx.closePath(); ctx.fill();
      if (lum > 0.85 || pin) tops.push(c);
    }
    // Lueur des sommets les plus hauts et des colonnes épinglées
    ctx.globalCompositeOperation = 'lighter';
    for (const c of tops) { const r = cw * (c.pin ? 2.6 : 2); const g = ctx.createRadialGradient(c.bx, c.by - ch - c.H, 0, c.bx, c.by - ch - c.H, r); g.addColorStop(0, c.pin ? 'rgba(255,220,140,0.28)' : 'rgba(220,255,160,0.16)'); g.addColorStop(1, 'rgba(220,255,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.bx, c.by - ch - c.H, r, 0, 6.283); ctx.fill(); }
    // Pollen qui s'élève du champ
    if (!pollen.current) pollen.current = Array.from({ length: 34 }, () => ({ u: Math.random(), v: Math.random(), z: Math.random(), s: 0.3 + Math.random() * 0.7 }));
    for (const q of pollen.current) {
      const life = (t * 0.08 * q.s + q.z) % 1; const bx = ox + (q.u - q.v) * N * cw; const by = oy + (q.u + q.v) * N * ch - life * h * 0.35;
      ctx.fillStyle = `rgba(230,255,180,${0.6 * Math.sin(life * Math.PI)})`; ctx.beginPath(); ctx.arc(bx + Math.sin(t + q.z * 9) * cw * 0.3, by, dpr * (1 + q.s * 1.5), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Nos chiffres, épinglés au-dessus de leurs colonnes
    const fs = Math.max(11 * dpr, Math.min(15 * dpr, w * 0.0125));
    for (const c of cells) {
      if (!c.pin) continue;
      const x = c.bx; const yTop = c.by - 2 * ch - c.H; const yC = yTop - cw * 2.2 + Math.sin(t * 1.5 + c.i) * dpr * 3;
      ctx.strokeStyle = 'rgba(255,230,160,0.6)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yC + fs * 1.4); ctx.stroke();
      ctx.font = `700 ${fs * 1.5}px "Bricolage Grotesque", system-ui, sans-serif`; const vw = ctx.measureText(c.pin.v).width;
      ctx.font = `500 ${fs * 0.8}px Manrope, system-ui, sans-serif`; const lw = ctx.measureText(c.pin.l).width;
      const bw = Math.max(vw, lw) + fs * 1.6; const bh = fs * 2.9; const bx0 = x - bw / 2; const by0 = yC - bh / 2;
      ctx.fillStyle = 'rgba(10,36,20,0.72)'; ctx.strokeStyle = 'rgba(255,230,160,0.35)';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx0, by0, bw, bh, fs * 0.7); else ctx.rect(bx0, by0, bw, bh); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${fs * 1.5}px "Bricolage Grotesque", system-ui, sans-serif`; ctx.fillStyle = '#f2d48c'; ctx.fillText(c.pin.v, x, yC - fs * 0.45);
      ctx.font = `500 ${fs * 0.8}px Manrope, system-ui, sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(c.pin.l, x, yC + fs * 0.85);
      ctx.textAlign = 'start';
    }
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-2/3" />;
}

// Équipe : réseau mycorhizien. Les membres sont des spores lumineuses reliées par des hyphes organiques où
// circulent des impulsions de nutriments ; près de la souris le réseau s'éclaire et échange davantage.
function Myco() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    if (!st.current || st.current.w !== w) {
      const r = rand(13); const Rn = (a, b) => a + r() * (b - a);
      const nodes = Array.from({ length: 11 }, () => ({ x: Rn(0.12, 0.92) * w, y: Rn(0.12, 0.88) * h, r: Rn(5, 9) * dpr, ph: Rn(0, 6) }));
      const edges = [];
      nodes.forEach((a, i) => nodes.forEach((b, j) => { if (j <= i) return; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < Math.min(w, h) * 0.45) { const mx = (a.x + b.x) / 2 + Rn(-0.25, 0.25) * d; const my = (a.y + b.y) / 2 + Rn(-0.25, 0.25) * d; edges.push({ a, b, c: [mx, my] }); } }));
      const twigs = Array.from({ length: 60 }, () => { const n = nodes[(r() * nodes.length) | 0]; let x = n.x; let y = n.y; let a = Rn(0, 6.28); const pts = [[x, y]]; for (let k = 0; k < 8; k++) { a += Rn(-0.5, 0.5); x += Math.cos(a) * 10 * dpr; y += Math.sin(a) * 10 * dpr; pts.push([x, y]); } return pts; });
      st.current = { w, nodes, edges, twigs, pulses: [] };
    }
    const S = st.current; const P = pt.current;
    const mx = P.in ? P.px * dpr : -9999; const my = P.in ? P.py * dpr : -9999;
    const at = (e, u) => { const v = 1 - u; return [v * v * e.a.x + 2 * v * u * e.c[0] + u * u * e.b.x, v * v * e.a.y + 2 * v * u * e.c[1] + u * u * e.b.y]; };
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(230,220,190,0.12)'; ctx.lineWidth = dpr * 0.8;
    for (const tw of S.twigs) { ctx.beginPath(); tw.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    for (const e of S.edges) {
      const near = Math.max(0, 1 - Math.hypot(e.c[0] - mx, e.c[1] - my) / (Math.min(w, h) * 0.35));
      ctx.strokeStyle = `rgba(235,225,195,${0.18 + near * 0.35})`; ctx.lineWidth = dpr * (1 + near * 1.2);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.quadraticCurveTo(e.c[0], e.c[1], e.b.x, e.b.y); ctx.stroke();
      if (Math.random() < 0.006 + near * 0.05) S.pulses.push({ e, u: 0, dir: Math.random() < 0.5, v: 0.004 + Math.random() * 0.006 });
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let k = S.pulses.length - 1; k >= 0; k--) {
      const pu = S.pulses[k]; pu.u += pu.v; if (pu.u >= 1) { S.pulses.splice(k, 1); continue; }
      for (let tr = 0; tr < 6; tr++) { const u = Math.max(0, pu.u - tr * 0.015); const [x, y] = at(pu.e, pu.dir ? u : 1 - u); ctx.fillStyle = `rgba(170,240,110,${0.7 * (1 - tr / 6)})`; ctx.beginPath(); ctx.arc(x, y, dpr * (3 - tr * 0.35), 0, 6.283); ctx.fill(); }
    }
    for (const n of S.nodes) {
      const near = Math.max(0, 1 - Math.hypot(n.x - mx, n.y - my) / (Math.min(w, h) * 0.3));
      const pulse = 1 + 0.15 * Math.sin(t * 2 + n.ph) + near * 0.5;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4 * pulse); g.addColorStop(0, 'rgba(180,240,130,0.45)'); g.addColorStop(1, 'rgba(180,240,130,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 4 * pulse, 0, 6.283); ctx.fill();
      const g2 = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, 0, n.x, n.y, n.r); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.4, '#c5e1a5'); g2.addColorStop(1, '#558b2f');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-3/5" />;
}

// Blog : feuilles du savoir. Feuilles nervurées (vertes, dorées, automnales) qui dérivent, se retournent et
// tournoient en profondeur, poussées par une brise qui suit la souris.
function Leaves() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    if (!st.current) {
      const r = rand(21); const Rn = (a, b) => a + r() * (b - a);
      const pal = [['#9ccc65', '#558b2f'], ['#c5e1a5', '#7cb342'], ['#f2c46d', '#c98a2b'], ['#e7a15a', '#a85a24'], ['#8bc34a', '#33691e']];
      st.current = { leaves: Array.from({ length: 22 }, () => ({ x: Rn(0, 1), y: Rn(-0.2, 1.1), z: Rn(0.3, 1), a: Rn(0, 6.28), va: Rn(-0.6, 0.6), f: Rn(0, 6.28), vf: Rn(0.8, 2), vy: Rn(0.02, 0.05), sw: Rn(0, 6.28), c: pal[(r() * pal.length) | 0] })), wind: 0 };
    }
    const S = st.current; const P = pt.current;
    S.wind += ((P.in ? P.x * 0.12 : 0.02) - S.wind) * 0.02;
    ctx.clearRect(0, 0, w, h);
    const sorted = [...S.leaves].sort((a, b) => a.z - b.z);
    for (const l of sorted) {
      l.y += l.vy * 0.016 * l.z; l.x += (S.wind + Math.sin(t * 0.8 + l.sw) * 0.02) * 0.016 * l.z; l.a += l.va * 0.016; l.f += l.vf * 0.016;
      if (l.y > 1.15) { l.y = -0.15; l.x = Math.random(); } if (l.x > 1.1) l.x = -0.1; if (l.x < -0.1) l.x = 1.1;
      const s = (14 + l.z * 30) * dpr; const flip = Math.cos(l.f);
      ctx.save(); ctx.translate(l.x * w, l.y * h); ctx.rotate(l.a); ctx.scale(Math.max(0.08, Math.abs(flip)), 1);
      ctx.globalAlpha = 0.35 + l.z * 0.65;
      const g = ctx.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, flip > 0 ? l.c[0] : '#e8f0d8'); g.addColorStop(1, l.c[1]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.bezierCurveTo(-s * 0.4, -s * 0.55, s * 0.5, -s * 0.5, s, 0); ctx.bezierCurveTo(s * 0.5, s * 0.5, -s * 0.4, s * 0.55, -s, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,230,0.55)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(-s * 1.15, 0); ctx.lineTo(s * 0.95, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,230,0.3)'; for (let k = -3; k <= 3; k++) { if (!k) continue; const x0 = (k / 4) * s * 0.8; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + s * 0.25, -s * 0.28); ctx.moveTo(x0, 0); ctx.lineTo(x0 + s * 0.25, s * 0.28); ctx.stroke(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-3/5" />;
}

// FAQ : bulles irisées (film arc-en-ciel, reflet), certaines portent un « ? » ; elles éclatent au contact de la
// souris puis remontent.
function Iris() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    if (!st.current) {
      const r = rand(41); const Rn = (a, b) => a + r() * (b - a);
      st.current = { b: Array.from({ length: 16 }, (_, i) => ({ x: Rn(0.05, 0.95), y: Rn(0, 1.2), r: Rn(18, 52), v: Rn(0.025, 0.06), ph: Rn(0, 6.28), q: i % 4 === 0, pop: 0 })), sparks: [] };
    }
    const S = st.current; const P = pt.current;
    const mx = P.in ? P.px * dpr : -9999; const my = P.in ? P.py * dpr : -9999;
    ctx.clearRect(0, 0, w, h);
    for (const b of S.b) {
      if (b.pop > 0) { b.pop -= 0.016; if (b.pop <= 0) { b.y = 1.25; b.x = Math.random() * 0.9 + 0.05; } continue; }
      b.y -= b.v * 0.016; if (b.y < -0.2) { b.y = 1.25; b.x = Math.random() * 0.9 + 0.05; }
      const x = b.x * w + Math.sin(t * 0.9 + b.ph) * 14 * dpr; const y = b.y * h; const rr = b.r * dpr * (1 + 0.03 * Math.sin(t * 3 + b.ph));
      if (Math.hypot(x - mx, y - my) < rr) { b.pop = 1.2; for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.283; S.sparks.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, vx: Math.cos(a) * 2 * dpr, vy: Math.sin(a) * 2 * dpr, l: 1 }); } continue; }
      // Film irisé
      const cg = ctx.createConicGradient ? ctx.createConicGradient(t * 0.6 + b.ph, x, y) : null;
      if (cg) { ['rgba(255,120,200,0.35)', 'rgba(120,200,255,0.35)', 'rgba(140,255,170,0.3)', 'rgba(255,230,120,0.35)', 'rgba(255,120,200,0.35)'].forEach((c, k) => cg.addColorStop(k / 4, c)); }
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.clip();
      const rg = ctx.createRadialGradient(x, y, rr * 0.55, x, y, rr); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0.22)');
      ctx.fillStyle = rg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      if (cg) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.lineWidth = rr * 0.22; ctx.strokeStyle = cg; ctx.beginPath(); ctx.arc(x, y, rr * 0.9, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.38, y - rr * 0.42, rr * 0.22, rr * 0.1, -0.7, 0, 6.283); ctx.fill();
      if (b.q) { ctx.fillStyle = 'rgba(197,255,120,0.9)'; ctx.font = `700 ${rr}px "Bricolage Grotesque", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y + rr * 0.05); }
    }
    for (let k = S.sparks.length - 1; k >= 0; k--) { const s2 = S.sparks[k]; s2.x += s2.vx; s2.y += s2.vy; s2.l -= 0.04; if (s2.l <= 0) { S.sparks.splice(k, 1); continue; } ctx.fillStyle = `rgba(220,255,240,${s2.l})`; ctx.beginPath(); ctx.arc(s2.x, s2.y, dpr * 2 * s2.l, 0, 6.283); ctx.fill(); }
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-3/5" />;
}

// Formations : parcours d'apprentissage dans une carotte de sol. Un tube de carottage en verre contient un sol
// à horizons ; une plantule pousse dessus et sa racine descend : à chaque horizon atteint, un module de
// formation s'allume (vraie liste des formations, dans la langue du site) et sa fiche apparaît. Au bout du
// parcours, la plante a grandi et un sceau « Certifiée » apparaît ; des nutriments descendent ensuite la racine.
function Parcours() {
  const ref = useRef(null);
  const pt = usePointer(ref);
  const { L, t: tr } = useLang();
  const { listes } = useSite();
  const mods = (listes.formations || []).filter((f) => f.visible !== false).slice(0, 5).map((f) => ({ titre: L(f.titre), duree: f.duree }));
  const data = useRef({ mods, cert: tr('formations_certifiee'), days: tr('formations_jours_court') });
  data.current = { mods, cert: tr('formations_certifiee'), days: tr('formations_jours_court') };
  const st = useRef(null);
  useLoop(ref, (t) => {
    const cv = ref.current; if (!cv) return;
    const [ctx, w, h, dpr] = fit(cv);
    if (!w || !h) return;
    const D = data.current; const n = Math.max(1, D.mods.length);
    const wide = w / h > 1.1;
    const cw = Math.min(w * (wide ? 0.13 : 0.22), h * 0.2); const top = h * 0.4; const bot = h * 0.96;
    const cx = w * (wide ? 0.8 : 0.82);
    if (!st.current || st.current.w !== w || st.current.h !== h) {
      const r = rand(77); const Rn = (a, b) => a + r() * (b - a);
      const core = document.createElement('canvas'); core.width = w; core.height = h; const c = core.getContext('2d');
      const x0 = cx - cw / 2; const H = bot - top;
      const bands = [['#2b1a0d', 0.12], ['#4a3018', 0.28], ['#6f4b2c', 0.27], ['#9a7148', 0.2], ['#a99d8a', 0.13]];
      let y = top;
      for (const [col, f] of bands) {
        const hh = H * f; const g = c.createLinearGradient(x0, 0, x0 + cw, 0); g.addColorStop(0, col); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0.5)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x0, y); for (let k = 0; k <= 10; k++) c.lineTo(x0 + (cw * k) / 10, y + Math.sin(k * 1.7 + y) * hh * 0.06); c.lineTo(x0 + cw, y + hh); c.lineTo(x0, y + hh); c.closePath(); c.fill();
        y += hh;
      }
      for (let i = 0; i < 1600; i++) { const gx = x0 + r() * cw; const gy = top + r() * H; const deep = (gy - top) / H; c.fillStyle = r() < 0.5 ? `rgba(220,190,140,${Rn(0.1, 0.35)})` : `rgba(10,6,3,${Rn(0.15, 0.4)})`; c.beginPath(); c.arc(gx, gy, Rn(0.5, 1.6) * dpr * (deep > 0.85 ? 2.2 : 1), 0, 6.283); c.fill(); }
      // Tube de verre : reflets verticaux
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x0 - cw * 0.08, top - cw * 0.25, cw * 1.16, H + cw * 0.3);
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(x0 + cw * 0.1, top - cw * 0.2, cw * 0.06, H + cw * 0.2);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0 + cw * 0.82, top - cw * 0.2, cw * 0.04, H + cw * 0.2);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = dpr * 1.2; c.strokeRect(x0 - cw * 0.08, top - cw * 0.25, cw * 1.16, H + cw * 0.3);
      // graduations du tube
      c.strokeStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k <= 10; k++) { const gy = top + (H * k) / 10; c.beginPath(); c.moveTo(x0 + cw * 1.08, gy); c.lineTo(x0 + cw * (k % 5 ? 0.98 : 0.9), gy); c.stroke(); }
      // racine : chemin sinueux de la surface au fond
      const root = []; let rx = cx; let vx = 0; for (let k = 0; k <= 60; k++) { const ry = top + (H * 0.94 * k) / 60; vx = vx * 0.85 + Rn(-1, 1) * cw * 0.012; rx += vx; rx = Math.max(x0 + cw * 0.25, Math.min(x0 + cw * 0.75, rx)); root.push([rx, ry]); }
      st.current = { w, h, core, root, x0, H, t0: t };
    }
    const S = st.current; const P = pt.current;
    const el = t - S.t0; const grow = Math.min(1, el / 7.5); // la racine met 7,5 s à descendre
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(P.in ? P.x * 10 * dpr : 0, 0);
    ctx.drawImage(S.core, 0, 0);
    // Racine qui pousse
    const upto = Math.max(1, Math.floor(grow * (S.root.length - 1)));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(243,230,200,0.95)'; ctx.lineWidth = dpr * 3;
    ctx.beginPath(); S.root.slice(0, upto + 1).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = 'rgba(243,230,200,0.5)'; ctx.lineWidth = dpr;
    for (let k = 4; k < upto; k += 5) { const [x, y] = S.root[k]; const s = k % 10 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * cw * 0.15, y + cw * 0.05, x + s * cw * 0.28, y + cw * 0.15); ctx.stroke(); }
    // Plantule : tige et feuilles qui grandissent avec le parcours
    const stem = cw * (0.45 + grow * 0.7); const sx = cx; const sy = top;
    ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = dpr * 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - cw * 0.1, sy - stem * 0.5, sx, sy - stem); ctx.stroke();
    const leaf = (lx, ly, s, a) => { ctx.save(); ctx.translate(lx, ly); ctx.rotate(a + Math.sin(t * 1.4) * 0.06); const g = ctx.createLinearGradient(0, 0, s, 0); g.addColorStop(0, '#558b2f'); g.addColorStop(1, '#9ccc65'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.3, -s * 0.45, s * 0.8, -s * 0.35, s, 0); ctx.bezierCurveTo(s * 0.8, s * 0.3, s * 0.3, s * 0.35, 0, 0); ctx.fill(); ctx.restore(); };
    const ls = cw * 0.55;
    leaf(sx, sy - stem * 0.45, ls * Math.min(1, grow * 2), -0.4); leaf(sx, sy - stem * 0.45, ls * Math.min(1, grow * 2), Math.PI + 0.4);
    if (grow > 0.5) { const k2 = (grow - 0.5) * 2; leaf(sx, sy - stem * 0.85, ls * 0.8 * k2, -0.7); leaf(sx, sy - stem * 0.85, ls * 0.8 * k2, Math.PI + 0.7); }
    // Modules : un par horizon, s'allument quand la racine les atteint
    const fs = Math.max(11 * dpr, Math.min(15 * dpr, w * 0.011));
    D.mods.forEach((m, i) => {
      const f = (i + 0.7) / (n + 0.2); const idx = Math.floor(f * 0.94 * (S.root.length - 1)); const [nx, ny] = S.root[Math.min(idx, S.root.length - 1)];
      const on = grow * 0.94 >= f * 0.94 - 0.001 ? Math.min(1, (grow - f) * 6 + 1) : 0;
      if (on <= 0) return;
      const pulse = 1 + 0.12 * Math.sin(t * 3 + i);
      ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(nx, ny, 0, nx, ny, cw * 0.5 * pulse); g.addColorStop(0, `rgba(190,255,120,${0.55 * on})`); g.addColorStop(1, 'rgba(190,255,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, cw * 0.5 * pulse, 0, 6.283); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#c5e1a5'; ctx.beginPath(); ctx.arc(nx, ny, dpr * 5, 0, 6.283); ctx.fill();
      // fiche du module, à gauche du tube, reliée par un trait (grand écran seulement)
      if (!wide) return;
      ctx.font = `600 ${fs}px Manrope, system-ui, sans-serif`;
      const label = m.titre; const sub = `${m.duree} ${D.days}`; const tw = Math.max(ctx.measureText(label).width, ctx.measureText(sub).width);
      const bw = tw + fs * 2.4; const bh = fs * 3.2;
      const lx = S.x0 - cw * 0.35 - bw; const ly = ny; ctx.globalAlpha = on;
      ctx.strokeStyle = 'rgba(197,255,120,0.6)'; ctx.lineWidth = dpr; ctx.setLineDash([3 * dpr, 3 * dpr]); ctx.beginPath(); ctx.moveTo(nx - dpr * 6, ny); ctx.lineTo(lx + bw, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(12,40,22,0.72)'; ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly - bh / 2, bw, bh, fs * 0.8) : ctx.rect(lx, ly - bh / 2, bw, bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.arc(lx + fs * 0.9, ly - fs * 0.45, fs * 0.28, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx + fs * 1.5, ly - fs * 0.45);
      ctx.font = `500 ${fs * 0.85}px Manrope, system-ui, sans-serif`; ctx.fillStyle = 'rgba(197,255,120,0.85)'; ctx.fillText(sub, lx + fs * 1.5, ly + fs * 0.7);
      ctx.globalAlpha = 1;
    });
    // Nutriments qui descendent la racine, une fois le parcours terminé
    if (grow >= 1) {
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) { const u = ((t * 0.18 + k / 4) % 1); const [x, y] = S.root[Math.floor(u * (S.root.length - 1))]; const g = ctx.createRadialGradient(x, y, 0, x, y, dpr * 9); g.addColorStop(0, 'rgba(200,255,140,0.9)'); g.addColorStop(1, 'rgba(200,255,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, dpr * 9, 0, 6.283); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      // Sceau « Certifiée » à côté de la plante
      const k2 = Math.min(1, (el - 7.5) / 0.8); const bx = S.x0 - cw * 0.75; const by = top - cw * 0.05; const br = cw * 0.38 * (0.6 + 0.4 * k2);
      ctx.globalAlpha = k2;
      ctx.fillStyle = '#e8c77a'; for (let s2 = 0; s2 < 16; s2++) { const a = (s2 / 16) * 6.283 + t * 0.2; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * br, by + Math.sin(a) * br, br * 0.22, 0, 6.283); ctx.fill(); }
      const g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 0, bx, by, br); g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#c9982f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#5a3d0a'; ctx.font = `700 ${br * 0.36}px Manrope, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', bx, by - br * 0.22); ctx.font = `700 ${br * 0.24}px Manrope, system-ui, sans-serif`; ctx.fillText(D.cert, bx, by + br * 0.25); ctx.textAlign = 'start';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  });
  return <canvas ref={ref} aria-hidden className="absolute inset-y-0 right-0 h-full w-full md:w-[62%]" />;
}

const ARTS = { petri: Petri, dna: Dna, scope: Scope, parcours: Parcours, wood: Wood, data: DataField, myco: Myco, leaves: Leaves, iris: Iris, rings: Rings, contours: Contours, network: Network, waves: Waves, horizons: Horizons, bubbles: Bubbles, radar: Radar };

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
