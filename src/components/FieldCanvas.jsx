// Paysage du hero, peint en canvas 2D (aucune image) : ciel du soir, soleil couchant derrière la motte,
// lisière d'arbres, champ dont les rangs de culture convergent vers la motte (point de fuite = --orb-x),
// brume au ras de l'horizon. Peint une fois, puis au redimensionnement / déplacement de la motte.
import { useEffect, useRef } from 'react';

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function paint(cv, vxPct) {
  const ctx = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  const r = rng(11); const R = (a, b) => a + r() * (b - a);
  const wide = W / H > 1.1;
  const hy = H * (wide ? 0.6 : 0.4); // horizon
  const vx = W * vxPct; // point de fuite, sous la motte
  const s = Math.max(0.5, Math.min(W, H) / 900);

  // Ciel : nuit en haut, lueur dorée à l'horizon, soleil couchant derrière la motte
  let g = ctx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, '#06120c'); g.addColorStop(0.5, '#10291b'); g.addColorStop(0.82, '#33452a'); g.addColorStop(1, '#a7834a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 1);
  g = ctx.createRadialGradient(vx, hy, 0, vx, hy, Math.max(W, H) * 0.55);
  g.addColorStop(0, 'rgba(255,214,140,0.65)'); g.addColorStop(0.25, 'rgba(230,160,80,0.22)'); g.addColorStop(1, 'rgba(230,160,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 1);
  for (let i = 0; i < (wide ? 140 : 60); i++) { // étoiles naissantes
    const y = R(0, hy * 0.55); ctx.fillStyle = `rgba(235,245,230,${R(0.08, 0.55) * (1 - y / (hy * 0.55))})`;
    ctx.beginPath(); ctx.arc(R(0, W), y, R(0.4, 1.3) * s, 0, 6.28); ctx.fill();
  }

  // Lisières : collines lointaines voilées, puis une ligne d'arbres aux houppiers arrondis (contre-jour)
  ctx.fillStyle = 'rgba(58,70,44,0.7)'; ctx.beginPath(); ctx.moveTo(0, hy + 1);
  for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, hy - H * 0.018 - Math.sin(x / (W * 0.13)) * H * 0.012 - Math.sin(x / (W * 0.047)) * H * 0.006);
  ctx.lineTo(W, hy + 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0b1a10';
  for (let x = -20 * s; x < W + 20 * s;) {
    if (r() < 0.16) { x += R(20, 90) * s; continue; } // trouée dans la haie
    const cr = R(5, 14) * s * (wide ? 1 : 0.8); const top = hy - R(0.4, 1.6) * cr;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + R(-cr, cr) * 0.6, top + R(0, cr), cr * R(0.6, 1), 0, 6.28); ctx.fill(); }
    ctx.fillRect(x - cr, top + cr * 0.5, cr * 2, hy - top);
    x += cr * R(0.9, 1.5);
  }

  // Champ : terre des sillons (texturée), puis rangs de culture faits de milliers de brins en contre-jour
  g = ctx.createLinearGradient(0, hy, 0, H);
  g.addColorStop(0, '#4a3a22'); g.addColorStop(0.2, '#2a2216'); g.addColorStop(1, '#120d08');
  ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
  for (let i = 0; i < (wide ? 5000 : 2200); i++) { // mottes et cailloux, plus gros au premier plan
    const d = Math.pow(r(), 0.7); const y = hy + (H - hy) * d; const sz = (0.4 + d * 3.2) * s;
    ctx.fillStyle = r() < 0.5 ? `rgba(120,92,58,${0.15 + d * 0.3})` : `rgba(8,6,3,${0.2 + d * 0.3})`;
    ctx.beginPath(); ctx.ellipse(R(0, W), y, sz, sz * 0.6, 0, 0, 6.28); ctx.fill();
  }
  const rows = wide ? 40 : 26; const spread = W * 2.6;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows - 0.5; const bx = vx + t * spread; const half = (spread / rows) * 0.26;
    const blades = wide ? 230 : 140;
    for (let k = 0; k < blades; k++) {
      const d = Math.pow((k + r()) / blades, 1.7); if (d < 0.015) continue;
      const cx = vx + (bx - vx) * d; const y = hy + (H - hy) * d + R(-1, 1) * d * 4 * s;
      const x = cx + R(-1, 1) * half * d;
      const hgt = (1.5 + 46 * d) * s * R(0.6, 1.15); const lean = R(-0.35, 0.35) * hgt;
      const lit = Math.max(0, 1 - Math.abs(x - vx) / (W * 0.7)) * (1 - d * 0.6); // contre-jour : bouts dorés vers le soleil
      ctx.lineWidth = Math.max(0.5, (0.5 + d * 2.4) * s);
      ctx.strokeStyle = `rgb(${24 + d * 30},${44 + d * 40},${18 + d * 10})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - hgt * 0.6, x + lean, y - hgt); ctx.stroke();
      ctx.strokeStyle = `rgba(${150 + lit * 90},${150 + lit * 60},${70 + lit * 20},${0.25 + lit * 0.6})`;
      ctx.beginPath(); ctx.moveTo(x + lean * 0.55, y - hgt * 0.72); ctx.quadraticCurveTo(x + lean * 0.8, y - hgt * 0.88, x + lean, y - hgt); ctx.stroke();
    }
  }
  // Perspective aérienne : le champ se fond dans la lumière dorée vers l'horizon
  g = ctx.createLinearGradient(0, hy, 0, hy + (H - hy) * 0.35);
  g.addColorStop(0, 'rgba(190,150,90,0.55)'); g.addColorStop(1, 'rgba(190,150,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, hy, W, (H - hy) * 0.35);

  // Brume au ras de l'horizon, et assombrissement du premier plan (lisibilité du texte)
  g = ctx.createLinearGradient(0, hy - H * 0.06, 0, hy + H * 0.08);
  g.addColorStop(0, 'rgba(220,226,200,0)'); g.addColorStop(0.5, 'rgba(220,226,200,0.16)'); g.addColorStop(1, 'rgba(220,226,200,0)');
  ctx.fillStyle = g; ctx.fillRect(0, hy - H * 0.06, W, H * 0.14);
  g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgba(5,12,7,0)'); g.addColorStop(1, 'rgba(5,12,7,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
}

export default function FieldCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; const host = cv.closest('section') || cv.parentElement;
    let last = ''; let timer = 0;
    const draw = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
      const w = Math.round(cv.clientWidth * dpr); const h = Math.round(cv.clientHeight * dpr);
      const ox = parseFloat(getComputedStyle(host).getPropertyValue('--orb-x')) || (w / h > 1.1 ? 72 : 50);
      const key = `${w}x${h}@${ox.toFixed(1)}`;
      if (!w || !h || key === last) return;
      last = key; cv.width = w; cv.height = h; paint(cv, ox / 100);
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(draw, 200); };
    draw();
    const ro = new ResizeObserver(later); ro.observe(cv);
    // La motte 3D publie sa position (--orb-x) une fois chargée : on recale le point de fuite
    const mo = new MutationObserver(later); mo.observe(host, { attributes: true, attributeFilter: ['style'] });
    return () => { clearTimeout(timer); ro.disconnect(); mo.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
