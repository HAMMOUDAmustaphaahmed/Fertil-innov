// Sol vu au microscope, généré en canvas 2D (aucune image à télécharger) : fond marbré (humus, taches
// d'oxydes de fer), agrégats grumeleux en relief, pores sombres, grains de sable (quartz brillant, minéraux
// sombres, feldspaths), radicelles mortes, débris végétaux et filaments de mycélium, sous l'éclairage du
// microscope. Peint une seule fois (au premier temps libre, puis au redimensionnement). Un second canvas
// anime le vivant : nématodes qui ondulent, amibes qui se déforment, gouttes d'eau et quartz qui brillent,
// seulement quand la vue micro est ouverte.
import { useEffect, useRef } from 'react';

// Générateur pseudo-aléatoire à graine : le même sol à chaque visite
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// Palette : humus, terre fine, oxydes de fer, gley (gris), et leurs éclats
const SOIL = [[38, 24, 14], [52, 34, 20], [70, 46, 27], [88, 60, 36], [104, 72, 44]];
const RUST = [124, 66, 34]; const GLEY = [86, 82, 72];

function paint(cv, glints) {
  const ctx = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  const r = rng(7); const R = (a, b) => a + r() * (b - a);
  const s = Math.max(0.5, Math.min(W, H) / 900); // échelle des éléments
  const area = (W * H) / (s * s);
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blob = (x, y, rad, n = 9, jag = 0.35) => { // contour irrégulier fermé
    ctx.beginPath();
    const ph = R(0, 6.28); const pts = [];
    for (let i = 0; i < n; i++) { const a = ph + (i / n) * 6.283; const rr = rad * (1 - jag / 2 + r() * jag); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * R(0.75, 1)]); }
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i]; const q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  };

  // 1. Fond marbré : bruit de valeur basse résolution, agrandi en douceur
  const lw = Math.max(8, Math.ceil(W / 10)); const lh = Math.max(8, Math.ceil(H / 10));
  const low = document.createElement('canvas'); low.width = lw; low.height = lh;
  const lc = low.getContext('2d'); const img = lc.createImageData(lw, lh);
  const grid = (g) => { const gw = Math.ceil(lw / g) + 2; const gh = Math.ceil(lh / g) + 2; const v = Array.from({ length: gw * gh }, r); return (x, y) => {
    const fx = x / g; const fy = y / g; const ix = fx | 0; const iy = fy | 0; const tx = fx - ix; const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx); const sy = ty * ty * (3 - 2 * ty); const at = (i, j) => v[j * gw + i];
    return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
  }; };
  const n1 = grid(14); const n2 = grid(5); const n3 = grid(2); const rustN = grid(9);
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    const v = n1(x, y) * 0.55 + n2(x, y) * 0.3 + n3(x, y) * 0.15;
    let c = mix(SOIL[0], SOIL[3], Math.min(1, Math.max(0, (v - 0.25) * 1.6)));
    const ru = rustN(x, y); if (ru > 0.68) c = mix(c, RUST, (ru - 0.68) * 2.2); else if (ru < 0.16) c = mix(c, GLEY, (0.16 - ru) * 2.5);
    const i = (y * lw + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  lc.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(low, 0, 0, W, H);
  const tone = (x, y) => { const lx = Math.min(lw - 1, (x / W) * lw) ; const ly = Math.min(lh - 1, (y / H) * lh); const i = ((ly | 0) * lw + (lx | 0)) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };

  // 2. Limon : poussière de fines particules
  for (let i = 0; i < area / 260; i++) {
    const x = R(0, W); const y = R(0, H); const c = mix(tone(x, y), r() < 0.5 ? [20, 12, 6] : [140, 104, 70], R(0.15, 0.5));
    ctx.fillStyle = rgb(c, R(0.4, 0.9)); ctx.fillRect(x, y, R(1, 2.6) * s, R(1, 2.6) * s);
  }

  // 3. Pores : vides sombres entre les agrégats
  for (let i = 0; i < area / 9000; i++) {
    const x = R(0, W); const y = R(0, H); const rad = R(6, 34) * s;
    blob(x, y, rad, 10, 0.6); ctx.fillStyle = rgb([10, 6, 3], R(0.55, 0.85)); ctx.fill();
  }

  // 4. Agrégats grumeleux : chaque grumeau est un amas de mottes irrégulières, éclairé en rasant
  const clod = (x, y, rad, base) => {
    blob(x + rad * 0.12, y + rad * 0.18, rad, 11, 0.55); ctx.fillStyle = rgb([6, 4, 2], 0.42); ctx.fill();
    blob(x, y, rad, 11, 0.55);
    const g = ctx.createLinearGradient(x - rad, y - rad, x + rad, y + rad);
    g.addColorStop(0, rgb(mix(base, [168, 128, 86], 0.22))); g.addColorStop(0.5, rgb(base)); g.addColorStop(1, rgb(mix(base, [10, 6, 3], 0.4)));
    ctx.fillStyle = g; ctx.fill();
  };
  for (let i = 0; i < area / 3800; i++) {
    const x = R(-30, W + 30); const y = R(-30, H + 30); const size = Math.pow(r(), 2) * 46 * s + 8 * s;
    const base = mix(tone(x, y), SOIL[(r() * SOIL.length) | 0], 0.4);
    const parts = 3 + ((r() * 5) | 0);
    for (let k = 0; k < parts; k++) {
      const a = R(0, 6.28); const d = R(0, size * 0.55);
      clod(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, size * R(0.3, 0.6), mix(base, SOIL[(r() * SOIL.length) | 0], 0.25));
    }
    // grain de surface : la texture rugueuse de l'agrégat
    for (let k = 0; k < size / (2.2 * s); k++) { const a = R(0, 6.28); const d = R(0, size * 0.8); ctx.fillStyle = rgb(mix(base, r() < 0.5 ? [176, 136, 94] : [12, 8, 4], 0.45), R(0.35, 0.7)); ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, R(0.8, 2) * s, R(0.8, 2) * s); }
  }

  // 5. Débris organiques : radicelles mortes (fibres) et fragments de feuilles
  ctx.lineCap = 'round';
  for (let i = 0; i < area / 60000; i++) {
    let x = R(0, W); let y = R(0, H); let a = R(0, 6.28);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) { a += R(-0.6, 0.6); const L = R(14, 34) * s; const nx = x + Math.cos(a) * L; const ny = y + Math.sin(a) * L; ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.5, y + Math.sin(a + 0.4) * L * 0.5, nx, ny); x = nx; y = ny; }
    ctx.strokeStyle = rgb(r() < 0.6 ? [150, 112, 70] : [42, 26, 12], R(0.45, 0.8)); ctx.lineWidth = R(0.8, 2.4) * s; ctx.stroke();
  }
  for (let i = 0; i < area / 90000; i++) {
    const x = R(0, W); const y = R(0, H); const rad = R(8, 18) * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(R(0, 6.28)); ctx.scale(1, R(0.3, 0.55));
    blob(0, 0, rad, 7, 0.5); ctx.fillStyle = rgb(r() < 0.5 ? [58, 36, 14] : [86, 62, 22], 0.85); ctx.fill();
    ctx.strokeStyle = rgb([20, 12, 4], 0.5); ctx.lineWidth = 0.6 * s; ctx.beginPath(); ctx.moveTo(-rad, 0); ctx.lineTo(rad, 0); ctx.stroke();
    ctx.restore();
  }

  // 6. Grains de sable : quartz translucides (reflet), minéraux sombres, feldspaths rosés
  for (let i = 0; i < area / 1700; i++) {
    const x = R(0, W); const y = R(0, H); const rad = R(1.6, 6.5) * s; const k = r();
    const col = k < 0.62 ? [206, 192, 160] : k < 0.8 ? [36, 34, 32] : k < 0.93 ? [180, 120, 88] : [232, 226, 210];
    blob(x + rad * 0.3, y + rad * 0.4, rad, 7, 0.3); ctx.fillStyle = rgb([5, 3, 2], 0.45); ctx.fill();
    blob(x, y, rad, 7, 0.3);
    const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.35, 0, x, y, rad);
    g.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.35), 0.95)); g.addColorStop(1, rgb(mix(col, [30, 20, 10], 0.45), 0.85));
    ctx.fillStyle = g; ctx.fill();
    if (k < 0.62 || k >= 0.93) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.16, 0, 6.28); ctx.fill();
      if (glints.length < 60 && rad > 3.5 * s && r() < 0.25) glints.push({ x: x - rad * 0.35, y: y - rad * 0.35, r: rad, ph: R(0, 6.28), sp: R(0.4, 1.1), drop: false });
    }
  }

  // 7. Mycélium : filaments blancs ramifiés, très fins
  for (let i = 0; i < area / 160000; i++) {
    const grow = (x, y, a, len, depth) => {
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < len; k++) { a += R(-0.35, 0.35); x += Math.cos(a) * 9 * s; y += Math.sin(a) * 9 * s; ctx.lineTo(x, y);
        if (depth > 0 && r() < 0.12) { ctx.stroke(); grow(x, y, a + R(-1.2, 1.2), (len * 0.5) | 0, depth - 1); ctx.beginPath(); ctx.moveTo(x, y); } }
      ctx.stroke();
    };
    ctx.strokeStyle = 'rgba(238,232,215,0.28)'; ctx.lineWidth = 0.7 * s;
    grow(R(0, W), R(0, H), R(0, 6.28), 26, 2);
  }

  // Éclairage du microscope : centre lumineux et chaud, bords dans l'ombre (relief et profondeur)
  ctx.globalCompositeOperation = 'soft-light';
  const light = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
  light.addColorStop(0, 'rgba(255,226,180,0.9)'); light.addColorStop(0.55, 'rgba(128,110,90,0.5)'); light.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // Gouttes d'eau logées dans les pores (dessinées et animées dans le calque du vivant)
  for (let i = 0; i < area / 70000; i++) glints.push({ x: R(0, W), y: R(0, H), r: R(4, 11) * s, ph: R(0, 6.28), sp: R(0.3, 0.8), drop: true });
  return s;
}

// Habitants du sol animés : nématodes (corps translucide qui ondule) et amibes (contour qui se déforme)
function creatures(W, H, s, coarse) {
  const r = rng(23); const R = (a, b) => a + r() * (b - a);
  const list = [];
  for (let i = 0; i < (coarse ? 2 : 3); i++) list.push({ kind: 'nema', x: R(0.1, 0.9) * W, y: R(0.15, 0.85) * H, a: R(0, 6.28), len: R(90, 150) * s, sp: R(10, 18) * s, ph: R(0, 6.28) });
  for (let i = 0; i < (coarse ? 2 : 3); i++) list.push({ kind: 'amoeba', x: R(0.1, 0.9) * W, y: R(0.15, 0.85) * H, rad: R(16, 30) * s, ph: R(0, 6.28), vx: R(-3, 3) * s, vy: R(-2, 2) * s });
  return list;
}

export default function SoilCanvas({ api }) {
  const base = useRef(null);
  const fx = useRef(null);
  useEffect(() => {
    const cv = base.current; const fv = fx.current;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let glints = []; let bugs = []; let sc = 1; let painted = false; let raf = 0; let prog = 0; let visible = false; let timer = 0; let last = 0;
    const size = () => {
      // Plafond de pixels : le sol reste net sans peser sur les téléphones
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5);
      const k = Math.min(1, Math.sqrt((coarse ? 900000 : 2200000) / (cv.clientWidth * cv.clientHeight * dpr * dpr)));
      const w = Math.max(1, Math.round(cv.clientWidth * dpr * k)); const h = Math.max(1, Math.round(cv.clientHeight * dpr * k));
      if (w === cv.width && h === cv.height && painted) return;
      cv.width = w; cv.height = h; fv.width = w; fv.height = h;
      glints = []; sc = paint(cv, glints); bugs = creatures(w, h, sc, coarse); painted = true;
    };
    const fctx = fv.getContext('2d');
    const draw = (time) => {
      raf = 0;
      const t = time / 1000; const dt = Math.min(0.05, last ? t - last : 0); last = t;
      fctx.clearRect(0, 0, fv.width, fv.height);
      const W = fv.width; const H = fv.height;
      for (const b of bugs) {
        if (b.kind === 'nema') { // nématode : avance en ondulant, la tête change doucement de cap
          b.a += Math.sin(t * 0.3 + b.ph) * 0.004; b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt;
          if (b.x < -b.len) b.x = W + b.len; else if (b.x > W + b.len) b.x = -b.len;
          if (b.y < -b.len) b.y = H + b.len; else if (b.y > H + b.len) b.y = -b.len;
          const n = 22; const cx = Math.cos(b.a); const cy = Math.sin(b.a); const pts = [];
          for (let i = 0; i < n; i++) { const d = (i / (n - 1)) * b.len; const wv = Math.sin(t * 5 + b.ph - i * 0.45) * 7 * sc * (0.4 + i / n); pts.push([b.x - cx * d - cy * wv, b.y - cy * d + cx * wv]); }
          fctx.lineCap = 'round'; fctx.lineJoin = 'round';
          for (const [lw, col] of [[7 * sc, 'rgba(230,222,196,0.22)'], [3.2 * sc, 'rgba(246,240,222,0.55)'], [1 * sc, 'rgba(160,140,110,0.6)']]) {
            fctx.strokeStyle = col; fctx.lineWidth = lw; fctx.beginPath(); fctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < n; i++) fctx.lineTo(pts[i][0], pts[i][1]); fctx.stroke();
          }
          fctx.fillStyle = 'rgba(250,246,232,0.8)'; fctx.beginPath(); fctx.arc(pts[0][0], pts[0][1], 2.4 * sc, 0, 6.28); fctx.fill();
        } else { // amibe : contour qui pulse, noyau, lente dérive
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < -60 || b.x > W + 60) b.vx *= -1; if (b.y < -60 || b.y > H + 60) b.vy *= -1;
          fctx.beginPath();
          for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.283; const rr = b.rad * (1 + 0.18 * Math.sin(3 * a + t * 0.9 + b.ph) + 0.1 * Math.sin(5 * a - t * 1.3)); const x = b.x + Math.cos(a) * rr; const y = b.y + Math.sin(a) * rr; if (i) fctx.lineTo(x, y); else fctx.moveTo(x, y); }
          fctx.closePath(); fctx.fillStyle = 'rgba(200,232,206,0.13)'; fctx.fill(); fctx.strokeStyle = 'rgba(214,246,220,0.45)'; fctx.lineWidth = 1.4 * sc; fctx.stroke();
          fctx.fillStyle = 'rgba(160,200,170,0.45)'; fctx.beginPath(); fctx.arc(b.x + Math.sin(t + b.ph) * b.rad * 0.15, b.y, b.rad * 0.28, 0, 6.28); fctx.fill();
          fctx.fillStyle = 'rgba(230,250,232,0.35)'; for (let k = 0; k < 5; k++) { fctx.beginPath(); fctx.arc(b.x + Math.cos(k * 1.7 + t * 0.4) * b.rad * 0.55, b.y + Math.sin(k * 2.1 + t * 0.3) * b.rad * 0.5, 1.6 * sc, 0, 6.28); fctx.fill(); }
        }
      }
      for (const g of glints) {
        const tw = Math.sin(t * g.sp + g.ph);
        if (g.drop) { // goutte : ménisque bleuté, reflet qui glisse
          fctx.fillStyle = 'rgba(150,200,230,0.10)'; fctx.beginPath(); fctx.arc(g.x, g.y, g.r, 0, 6.28); fctx.fill();
          fctx.strokeStyle = 'rgba(200,235,255,0.35)'; fctx.lineWidth = Math.max(1, g.r * 0.12); fctx.beginPath(); fctx.arc(g.x, g.y, g.r, 3.6 + tw * 0.4, 5.2 + tw * 0.4); fctx.stroke();
          fctx.fillStyle = `rgba(255,255,255,${0.45 + tw * 0.35})`; fctx.beginPath(); fctx.arc(g.x - g.r * 0.35 + tw * g.r * 0.15, g.y - g.r * 0.4, g.r * 0.18, 0, 6.28); fctx.fill();
        } else if (tw > 0.82) { // quartz qui accroche la lumière : brève petite étoile
          const a = (tw - 0.82) / 0.18; const L = g.r * (0.8 + a * 1.4);
          fctx.strokeStyle = `rgba(255,250,225,${a * 0.7})`; fctx.lineWidth = Math.max(0.8, g.r * 0.12);
          fctx.beginPath(); fctx.moveTo(g.x - L, g.y); fctx.lineTo(g.x + L, g.y); fctx.moveTo(g.x, g.y - L); fctx.lineTo(g.x, g.y + L); fctx.stroke();
          fctx.fillStyle = `rgba(255,255,240,${a})`; fctx.beginPath(); fctx.arc(g.x, g.y, g.r * 0.3, 0, 6.28); fctx.fill();
        }
      }
      if (visible && prog > 0.12 && prog < 0.99) raf = requestAnimationFrame(draw);
    };
    // Peinture synchrone seulement si l'oculaire va s'ouvrir ; sinon elle se fait au premier temps libre (idle plus bas).
    // Avant, l'IntersectionObserver appelait kick() dès le montage et peignait le sol pendant la transition de page.
    const kick = () => { if (!painted && prog > 0.1) size(); if (!raf && visible && prog > 0.12 && prog < 0.99) raf = requestAnimationFrame(draw); };
    // Peinture forcée seulement juste avant l'ouverture de l'oculaire (0,14) : à 0,02, une mesure de défilement
    // encore approximative au montage de la page la déclenchait pendant la transition (blocage de ~0,3 s).
    api.current = { set: (v) => { prog = v; if (v > 0.1) kick(); } };

    // Peinture au premier temps libre (le sol est prêt avant l'ouverture de l'oculaire)
    const idle = window.requestIdleCallback ? window.requestIdleCallback(() => { if (!painted) size(); }, { timeout: 4000 }) : setTimeout(() => { if (!painted) size(); }, 1500);
    const ro = new ResizeObserver(() => { if (!painted) return; clearTimeout(timer); timer = setTimeout(size, 250); });
    // Canvas vidé par le navigateur (mémoire graphique) : on repeint le sol à sa restauration
    const restore = () => { if (!painted) return; glints = []; sc = paint(cv, glints); bugs = creatures(cv.width, cv.height, sc, coarse); };
    cv.addEventListener('contextrestored', restore);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    ro.observe(cv); io.observe(cv);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); io.disconnect(); api.current = null; cv.removeEventListener('contextrestored', restore);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle);
    };
  }, [api]);
  return (
    <>
      <canvas ref={base} aria-hidden className="absolute inset-0 h-full w-full" />
      <canvas ref={fx} aria-hidden className="absolute inset-0 h-full w-full" />
    </>
  );
}
