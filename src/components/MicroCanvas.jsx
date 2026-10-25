// Micro-organismes en canvas 2D (coques, bacilles, spores) reliés par un réseau d'hyphes.
// La densité suit api.set(progression 0–1) ; ne dessine que visible. Utilisé par le hero
// d'accueil (piloté par le défilement) et par les en-têtes de pages (densité fixe).
import { useEffect, useRef } from 'react';

export default function MicroCanvas({ api }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const rgb = (name, fb) => (getComputedStyle(document.documentElement).getPropertyValue(`--fi-${name}`).trim() || fb).split(/\s+/).join(',');
    const colors = [rgb('accent', '139 195 74'), rgb('light', '200 230 201'), rgb('loam', '166 124 82')];
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const N = coarse ? 44 : 84;
    const r = (a, b) => a + Math.random() * (b - a);
    const parts = Array.from({ length: N }, (_, i) => ({
      x: Math.random(), y: Math.random(), z: r(0.35, 1), order: Math.random(),
      kind: i % 6 === 0 ? 2 : i % 3 === 0 ? 1 : 0, // 0 coque, 1 bacille, 2 spore
      a: r(0, Math.PI * 2), va: r(-0.006, 0.006), vx: r(-0.00018, 0.00018), vy: r(-0.00025, 0.00006), ph: r(0, 6.28),
      c: colors[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0],
    }));
    let w = 0; let h = 0; let dpr = 1; let raf = 0; let visible = false; let prog = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth * dpr; h = cv.clientHeight * dpr;
      cv.width = w; cv.height = h;
    };
    const draw = (time) => {
      raf = 0;
      const density = Math.min(1, Math.max(0, (prog - 0.14) / 0.6)) * 0.8 + 0.2;
      const zoom = 1 + prog * 0.35;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const pts = [];
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        if (p.x < -0.1) p.x = 1.1; else if (p.x > 1.1) p.x = -0.1;
        if (p.y < -0.1) p.y = 1.1; else if (p.y > 1.1) p.y = -0.1;
        const fade = Math.min(1, Math.max(0, (density - p.order) * 6));
        if (!fade) continue;
        const wob = Math.sin(time * 0.0008 + p.ph) * 0.006;
        const sx = ((p.x + wob - 0.5) * zoom + 0.5) * w + (mouse.x - 0.5) * -40 * p.z * dpr;
        const sy = ((p.y - 0.5) * zoom + 0.5) * h + (mouse.y - 0.5) * -40 * p.z * dpr;
        pts.push({ sx, sy, p, fade });
      }
      // Hyphes : fils fins entre organismes proches
      const maxD = 150 * dpr; const maxD2 = maxD * maxD;
      ctx.lineWidth = dpr;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          // Rejet rapide (boîte puis carré de la distance) avant la racine carrée : la plupart des paires sont loin
          const dx = a.sx - b.sx; if (dx > maxD || dx < -maxD) continue;
          const dy = a.sy - b.sy; if (dy > maxD || dy < -maxD) continue;
          const d2 = dx * dx + dy * dy; if (d2 > maxD2) continue;
          const d = Math.sqrt(d2);
          ctx.strokeStyle = `rgba(${colors[1]},${(1 - d / maxD) * 0.16 * Math.min(a.fade, b.fade)})`;
          ctx.beginPath(); ctx.moveTo(a.sx, a.sy);
          ctx.quadraticCurveTo((a.sx + b.sx) / 2 + dy * 0.12, (a.sy + b.sy) / 2 - dx * 0.12, b.sx, b.sy);
          ctx.stroke();
        }
      }
      for (const { sx, sy, p, fade } of pts) {
        const s = p.z * dpr * zoom; const al = fade * (0.35 + p.z * 0.6);
        if (p.kind === 1) {
          const L = 9 * s; const cx = Math.cos(p.a) * L; const cy = Math.sin(p.a) * L;
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(${p.c},${al * 0.12})`; ctx.lineWidth = 14 * s;
          ctx.beginPath(); ctx.moveTo(sx - cx, sy - cy); ctx.lineTo(sx + cx, sy + cy); ctx.stroke();
          ctx.strokeStyle = `rgba(${p.c},${al * 0.85})`; ctx.lineWidth = 5 * s;
          ctx.beginPath(); ctx.moveTo(sx - cx, sy - cy); ctx.lineTo(sx + cx, sy + cy); ctx.stroke();
        } else if (p.kind === 2) {
          ctx.strokeStyle = `rgba(${p.c},${al * 0.7})`; ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath(); ctx.arc(sx, sy, 7 * s, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(${p.c},${al * 0.5})`;
          ctx.beginPath(); ctx.arc(sx, sy, 2.5 * s, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${p.c},${al * 0.1})`;
          ctx.beginPath(); ctx.arc(sx, sy, 11 * s, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(${p.c},${al * 0.9})`;
          ctx.beginPath(); ctx.arc(sx, sy, 3.2 * s, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (visible && prog > 0.12) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf && visible && prog > 0.12) raf = requestAnimationFrame(draw); };

    api.current = { set: (v) => { prog = v; kick(); } };
    const onMove = (e) => { mouse.tx = e.clientX / window.innerWidth; mouse.ty = e.clientY / window.innerHeight; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    const ro = new ResizeObserver(resize);
    io.observe(cv); ro.observe(cv); resize();
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener('pointermove', onMove); api.current = null; };
  }, [api]);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
