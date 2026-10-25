// Visuels animés propres à chaque page intérieure (en-tête). Même rendu sur mobile et ordinateur ;
// chaque visuel réagit aussi au défilement (rotation / parallaxe via la variable --ph-p, 0 → 1).
//  petri     Services    : grande boîte de Petri, colonies qui poussent, loupe à la souris
//  dna       Activités   : double hélice d'ADN réaliste (modèle moléculaire en perspective)
//  rings     Formations  : cernes de croissance qui se tracent
//  contours  Chiffres    : courbes de niveau / données qui ondulent
//  network   Équipe      : réseau de personnes, signaux qui circulent
//  waves     Blog        : ondes de diffusion + égaliseur
//  horizons  Guide       : horizons de sol en parallaxe
//  bubbles   FAQ         : bulles de culture qui montent (certaines « ? »)
//  radar     Contact     : radar et points de présence
import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

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
