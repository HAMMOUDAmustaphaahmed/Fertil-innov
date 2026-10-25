// Paysage du hero, peint en canvas 2D (aucune image), en deux moitiés qui racontent notre métier :
//  - à gauche, un sol pollué : ciel de smog, usine et fumées, arbres morts, terre craquelée en plaques,
//    taches de rouille, flaques irisées d'hydrocarbures, fût rouillé, chaumes secs ;
//  - à droite, notre champ régénéré : soleil couchant derrière la motte, lisière d'arbres, rangs de culture
//    en contre-jour qui convergent vers la motte (point de fuite = --orb-x), brume à l'horizon ;
//  - entre les deux, une frontière diagonale irrégulière où de jeunes pousses recolonisent la terre craquelée.
// Peint une fois, puis au redimensionnement / déplacement de la motte.
import { useEffect, useRef } from 'react';

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// Moitié gauche : le sol pollué, peint sur un calque puis fondu en diagonale dans le champ sain
function paintPolluted(ctx, W, H, hy, s, wide) {
  const r = rng(29); const R = (a, b) => a + r() * (b - a);
  // Ciel de smog : gris brun, soleil voilé
  let g = ctx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, '#121210'); g.addColorStop(0.55, '#2a2820'); g.addColorStop(0.85, '#4d4534'); g.addColorStop(1, '#8a7450');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 1);
  // Usine à l'horizon (côté gauche) : bâtiments, cheminées, panaches de fumée
  const fx = W * (wide ? 0.12 : 0.1); const fu = H * 0.02 * (wide ? 1 : 0.8);
  ctx.fillStyle = '#16140f';
  ctx.fillRect(fx - fu * 6, hy - fu * 2.2, fu * 9, fu * 2.4); ctx.fillRect(fx + fu * 3, hy - fu * 3.4, fu * 4, fu * 3.6);
  for (let k = 0; k < 6; k++) { const x = fx - fu * 5 + k * fu * 1.4; ctx.beginPath(); ctx.moveTo(x, hy - fu * 2.2); ctx.lineTo(x + fu * 0.7, hy - fu * 3); ctx.lineTo(x + fu * 1.4, hy - fu * 2.2); ctx.fill(); }
  [[fx - fu * 3.5, 7], [fx - fu * 1.5, 9], [fx + fu * 5, 6]].forEach(([x, h]) => {
    ctx.fillStyle = '#16140f'; ctx.fillRect(x, hy - fu * h, fu * 0.7, fu * h);
    for (let k = 0; k < 26; k++) { // panache : bouffées de plus en plus grandes et pâles, poussées par le vent
      const t = k / 26; const px = x + fu * 0.35 + t * fu * 16 + R(-1, 1) * fu * t * 2; const py = hy - fu * h - t * fu * 7 - R(0, 1) * fu * t * 2;
      ctx.fillStyle = `rgba(${120 + t * 40},${112 + t * 36},${96 + t * 30},${0.32 * (1 - t) + 0.05})`;
      ctx.beginPath(); ctx.arc(px, py, fu * (0.5 + t * 3.2), 0, 6.28); ctx.fill();
    }
  });
  // Voile de pollution sur tout le ciel bas
  g = ctx.createLinearGradient(0, hy * 0.45, 0, hy); g.addColorStop(0, 'rgba(110,96,70,0)'); g.addColorStop(1, 'rgba(110,96,70,0.45)');
  ctx.fillStyle = g; ctx.fillRect(0, hy * 0.45, W, hy * 0.55 + 1);
  // Arbres morts, silhouettes nues
  const deadTree = (x, base, h) => {
    const branch = (x0, y0, a, len, w, d) => {
      const x1 = x0 + Math.cos(a) * len; const y1 = y0 + Math.sin(a) * len;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      if (d > 0) for (let k = 0; k < 2; k++) branch(x1, y1, a + R(-0.7, 0.7), len * R(0.55, 0.75), w * 0.65, d - 1);
    };
    ctx.strokeStyle = '#141210'; ctx.lineCap = 'round'; branch(x, base, -Math.PI / 2 + R(-0.1, 0.1), h * 0.45, Math.max(1, h * 0.05), 4);
  };
  deadTree(W * 0.3, hy + 2, H * 0.09); deadTree(W * 0.05, hy + 4, H * 0.12); deadTree(W * (wide ? 0.4 : 0.38), hy + 1, H * 0.06);

  // Sol : boue séchée craquelée. Cellules de Voronoï calculées dans le plan du sol puis projetées en
  // perspective (cellules aplaties et plus petites vers l'horizon), bords retroussés plus sombres, brume au loin.
  {
    const k = wide ? 2 : 1.5; // calcul en basse résolution, agrandi ensuite
    const lw = Math.ceil(W * 0.62 / k); const lh = Math.ceil((H - hy) / k);
    const low = document.createElement('canvas'); low.width = lw; low.height = lh;
    const lc = low.getContext('2d'); const img = lc.createImageData(lw, lh); const px = img.data;
    const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const cell = 0.085; const cx0 = W * 0.3;
    for (let yy = 0; yy < lh; yy++) {
      const d = (yy * k) / (H - hy) + 0.015; // 0 à l'horizon → 1 au premier plan
      const Z = (1 / d) * 0.55;
      const fog = Math.pow(1 - Math.min(1, d), 3);
      for (let xx = 0; xx < lw; xx++) {
        const X = ((xx * k - cx0) / W) / d;
        const gx = X / cell; const gz = Z / cell; const ix = Math.floor(gx); const iz = Math.floor(gz);
        let f1 = 9; let f2 = 9; let id = 0;
        for (let a2 = -1; a2 <= 1; a2++) for (let b2 = -1; b2 <= 1; b2++) {
          const ci = ix + a2; const cj = iz + b2;
          const dx = ci + hash(ci, cj) - gx; const dz = cj + hash(cj, ci + 7) - gz;
          const dd = Math.sqrt(dx * dx + dz * dz);
          if (dd < f1) { f2 = f1; f1 = dd; id = hash(ci + 3, cj); } else if (dd < f2) f2 = dd;
        }
        const edge = f2 - f1; // 0 sur la fissure
        const crack = Math.min(1, edge / 0.05); // fissure fine (largeur fixe dans le plan du sol)
        const curl = Math.min(1, edge / 0.22); // bord retroussé, plus sombre
        const t = 0.86 + id * 0.24;
        let rC = 176 * t * (0.72 + 0.28 * curl); let gC = 150 * t * (0.72 + 0.28 * curl); let bC = 110 * t * (0.72 + 0.28 * curl);
        rC = rC * crack + 38 * (1 - crack); gC = gC * crack + 28 * (1 - crack); bC = bC * crack + 18 * (1 - crack);
        rC = rC * (1 - fog) + 150 * fog; gC = gC * (1 - fog) + 130 * fog; bC = bC * (1 - fog) + 96 * fog;
        const o = (yy * lw + xx) * 4; px[o] = rC; px[o + 1] = gC; px[o + 2] = bC; px[o + 3] = 255;
      }
    }
    lc.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(low, 0, hy, lw * k, lh * k);
    // ombrage d'ensemble : premier plan plus sombre
    g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(25,18,10,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
  }
  // Taches de rouille (contamination) et flaques irisées d'hydrocarbures
  for (let i = 0; i < (wide ? 7 : 4); i++) {
    const x = R(0, W * 0.42); const y = R(hy + (H - hy) * 0.25, H); const d = (y - hy) / (H - hy); const rx = R(30, 90) * s * d; const ry = rx * R(0.18, 0.3);
    g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(184,96,36,0.55)'); g.addColorStop(1, 'rgba(184,96,36,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, 6.28); ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < (wide ? 4 : 2); i++) {
    const x = R(W * 0.04, W * 0.38); const y = R(hy + (H - hy) * 0.45, H * 0.95); const d = (y - hy) / (H - hy); const rx = R(40, 80) * s * d; const ry = rx * 0.22;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    ctx.fillStyle = '#17140f'; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.28); ctx.fill();
    const ir = ctx.createLinearGradient(-rx, -rx, rx, rx);
    ['rgba(120,60,200,0.35)', 'rgba(40,160,200,0.35)', 'rgba(90,200,90,0.3)', 'rgba(230,200,60,0.35)', 'rgba(220,80,120,0.3)'].forEach((c, k) => ir.addColorStop(k / 4, c));
    ctx.fillStyle = ir; ctx.beginPath(); ctx.arc(rx * 0.1, -rx * 0.1, rx * 0.8, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(200,190,170,0.25)'; ctx.lineWidth = rx * 0.06; ctx.beginPath(); ctx.arc(0, 0, rx, 3.6, 5.6); ctx.stroke();
    ctx.restore();
  }
  // Fût rouillé à demi enfoncé
  { const d = 0.7; const x = W * (wide ? 0.2 : 0.16); const y = hy + (H - hy) * d; const bw = 26 * s * d * (wide ? 1.4 : 1.1); const bhh = bw * 1.35;
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.22);
    g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); g.addColorStop(0, '#4a2412'); g.addColorStop(0.35, '#a3542a'); g.addColorStop(0.6, '#7a3a1a'); g.addColorStop(1, '#3a1b0c');
    ctx.fillStyle = g; ctx.fillRect(-bw / 2, -bhh, bw, bhh);
    ctx.fillStyle = 'rgba(30,14,6,0.6)'; ctx.fillRect(-bw / 2, -bhh * 0.7, bw, bhh * 0.06); ctx.fillRect(-bw / 2, -bhh * 0.32, bw, bhh * 0.06);
    ctx.fillStyle = '#5c2c14'; ctx.beginPath(); ctx.ellipse(0, -bhh, bw / 2, bw * 0.16, 0, 0, 6.28); ctx.fill();
    ctx.restore(); }
  // Chaumes secs, clairsemés
  ctx.lineCap = 'round';
  for (let i = 0; i < (wide ? 900 : 400); i++) {
    const d = Math.pow(r(), 0.8); const y = hy + (H - hy) * d; const x = R(0, W * 0.6); const h = (2 + 20 * d) * s * R(0.5, 1);
    ctx.strokeStyle = `rgba(${150 + R(0, 40)},${130 + R(0, 30)},${90 + R(0, 20)},${0.35 + d * 0.4})`; ctx.lineWidth = Math.max(0.5, d * 1.6 * s);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + R(-0.5, 0.5) * h, y - h); ctx.stroke();
  }
  // Brume sale sur le sol lointain
  g = ctx.createLinearGradient(0, hy, 0, hy + (H - hy) * 0.3); g.addColorStop(0, 'rgba(140,120,90,0.55)'); g.addColorStop(1, 'rgba(140,120,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, hy, W, (H - hy) * 0.3);
}

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

  // Moitié polluée : calque fondu en diagonale irrégulière (frontière de la régénération)
  const split = W * (wide ? 0.44 : 0.48);
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const oc = off.getContext('2d');
  paintPolluted(oc, W, H, hy, s, wide);
  oc.globalCompositeOperation = 'destination-in';
  oc.beginPath(); oc.moveTo(0, 0);
  for (let y = 0; y <= H; y += H / 24) oc.lineTo(split + (y / H - 0.5) * W * 0.12 + Math.sin(y * 0.02 / s) * W * 0.02 + R(-1, 1) * W * 0.01, y);
  oc.lineTo(0, H); oc.closePath();
  oc.filter = `blur(${Math.round(W * 0.035)}px)`; oc.fillStyle = '#000'; oc.fill(); oc.filter = 'none';
  ctx.drawImage(off, 0, 0);
  // Recolonisation : pousses vertes sur la terre craquelée, de plus en plus denses vers le champ sain
  ctx.lineCap = 'round';
  for (let i = 0; i < (wide ? 700 : 320); i++) {
    const d = Math.pow(r(), 0.75); const y = hy + (H - hy) * d;
    const edge = split + (d - 0.5) * W * 0.12; const x = edge - Math.pow(r(), 1.6) * W * 0.16;
    const h = (2 + 14 * d) * s * R(0.6, 1.1); const lean = R(-0.3, 0.3) * h;
    ctx.strokeStyle = `rgba(${110 + R(0, 50)},${170 + R(0, 40)},${60 + R(0, 20)},${0.5 + d * 0.4})`; ctx.lineWidth = Math.max(0.5, d * 1.8 * s);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h); ctx.stroke();
  }

  // Brume au ras de l'horizon, et assombrissement du premier plan (lisibilité du texte)
  g = ctx.createLinearGradient(0, hy - H * 0.06, 0, hy + H * 0.08);
  g.addColorStop(0, 'rgba(220,226,200,0)'); g.addColorStop(0.5, 'rgba(220,226,200,0.16)'); g.addColorStop(1, 'rgba(220,226,200,0)');
  ctx.fillStyle = g; ctx.fillRect(0, hy - H * 0.06, W, H * 0.14);
  g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgba(5,12,7,0)'); g.addColorStop(1, 'rgba(5,12,7,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
}

// Le paysage est peint une fois dans un calque en mémoire ; le canvas visible en affiche une copie, agrandie
// autour du point de plongée pendant la descente (api.zoom). Pas de zoom CSS : un calque agrandi ×7 faisait
// dégrader sa résolution par le navigateur, et le champ pouvait rester flou ou vide au retour en haut.
// Paysages déjà peints, gardés d'une visite de l'accueil à l'autre (le dessin est déterminé par la graine : identique) :
// revenir sur l'accueil (logo, menu) ne repeint plus le champ, ce qui bloquait la transition de page.
const PAINTED = new Map(); // clé (taille, point de fuite) → calque ; quelques entrées au plus

export default function FieldCanvas({ api }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; const host = cv.closest('section') || cv.parentElement;
    let cache = null;
    let last = ''; let timer = 0; let zoom = 1; let origin = [0.5, 0.66];
    const render = () => {
      if (!cache?.width || !cv.width) return;
      const ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (zoom > 1.0005) {
        const ox = origin[0] * cv.width; const oy = origin[1] * cv.height;
        ctx.setTransform(zoom, 0, 0, zoom, ox - ox * zoom, oy - oy * zoom);
      }
      ctx.drawImage(cache, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    const draw = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
      const w = Math.round(cv.clientWidth * dpr); const h = Math.round(cv.clientHeight * dpr);
      const css = getComputedStyle(host);
      const num = (v, d) => (Number.isFinite(v) && v ? v : d); // « NaN% » / « Infinity% » → valeur par défaut
      const ox = num(parseFloat(css.getPropertyValue('--orb-x')), w / h > 1.1 ? 72 : 50);
      const oy = num(parseFloat(css.getPropertyValue('--dive-y')), w / h > 1.1 ? 82 : 66);
      const key = `${w}x${h}@${ox.toFixed(1)}/${oy}`;
      if (!w || !h || key === last) return;
      last = key; origin = [ox / 100, oy / 100];
      cache = PAINTED.get(key);
      if (!cache) {
        cache = document.createElement('canvas'); cache.width = w; cache.height = h; paint(cache, ox / 100);
        PAINTED.set(key, cache);
        if (PAINTED.size > 4) PAINTED.delete(PAINTED.keys().next().value);
      }
      cv.width = w; cv.height = h; render();
    };
    if (api) api.current = { zoom: (z) => { if (Math.abs(z - zoom) < 0.0005) return; zoom = z; render(); } };
    const later = () => { clearTimeout(timer); timer = setTimeout(draw, 200); };
    const repaint = () => { last = ''; PAINTED.clear(); draw(); }; // calques peut-être vidés eux aussi
    draw();
    // Canvas vidé par le navigateur (mémoire graphique) : on repeint à sa restauration, et on vérifie en
    // revenant en haut de page qu'il n'est pas resté vide.
    cv.addEventListener('contextrestored', repaint);
    let checked = 0;
    const check = () => {
      if (window.scrollY > window.innerHeight || Date.now() - checked < 800 || !cv.width) return;
      checked = Date.now();
      try { if (cv.getContext('2d').getImageData(cv.width >> 1, 2, 1, 1).data[3] === 0) repaint(); } catch { /* canvas indisponible */ }
    };
    window.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(later); ro.observe(cv);
    // La motte 3D publie sa position (--orb-x) une fois chargée : on recale le point de fuite
    const mo = new MutationObserver(later); mo.observe(host, { attributes: true, attributeFilter: ['style'] });
    return () => {
      clearTimeout(timer); ro.disconnect(); mo.disconnect(); cv.removeEventListener('contextrestored', repaint); window.removeEventListener('scroll', check);
      if (api) api.current = null;
    };
  }, [api]);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
