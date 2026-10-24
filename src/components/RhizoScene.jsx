// Monolithe de sol vivant en 3D (Three.js, chargé à la demande, client uniquement).
// Une carotte de sol à horizons (humus → A → B → C) vue « aux rayons X » : racines de la plantule,
// hyphes mycorhiziens lumineux, colonies bactériennes aux pointes racinaires, nodules à rhizobium,
// nutriments (N, P, K) qui circulent des hyphes vers les racines, pluie qui s'infiltre, CO₂ capté par
// les feuilles, ver de terre dans l'horizon A, loupe « ×1000 » sur une colonie. Étiquettes HTML projetées.
// Tourne au pointeur (souris / glissé tactile), se désagrège au défilement (api.set(progress)).
// Repli CSS sans WebGL ou avec prefers-reduced-motion.
import { useEffect, useRef, useState } from 'react';
import MicroCanvas from './MicroCanvas';

const VERT = /* glsl */ `
  uniform float uTime; uniform float uExplode; uniform float uSize; uniform float uPixel;
  attribute vec3 aColor; attribute float aSize; attribute vec3 aRand; attribute float aMode;
  attribute vec3 aEnd; attribute vec3 aCtrl;
  varying vec3 vColor; varying float vFade;
  void main() {
    vec3 p = position;
    float fade = 1.0;
    if (aMode > 4.5) { // ver de terre : anneaux qui suivent une sinusoïde dans l'horizon A
      float k = fract(uTime * 0.035) * 2.0 - aRand.x * 0.012;
      p = vec3(-1.05 + 2.1 * fract(k), 0.5 + 0.1 * sin(k * 18.0 + uTime * 2.0), 0.42 + 0.04 * sin(k * 9.0));
    } else if (aMode > 3.5) { // CO₂ : de l'air vers les feuilles
      float t = fract(uTime * (0.07 + abs(aRand.z) * 0.05) + aRand.x);
      p = mix(position, aEnd, t * t);
      fade = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.8, 1.0, t));
    } else if (aMode > 2.5) { // pluie : chute puis infiltration
      float t = fract(uTime * (0.35 + abs(aRand.z) * 0.2) + aRand.x);
      p = position + vec3(0.0, -t * 2.6, 0.0);
      fade = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.75, 1.0, t));
    } else if (aMode > 1.5) { // nutriment : parcourt une courbe de Bézier hyphe → racine, en boucle
      float t = fract(uTime * (0.10 + abs(aRand.z) * 0.12) + aRand.x);
      vec3 a = mix(position, aCtrl, t); vec3 b = mix(aCtrl, aEnd, t);
      p = mix(a, b, t);
      fade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t));
    } else if (aMode > 0.5) { // bactérie : frémissement
      p += aRand * sin(uTime * 2.4 + aRand.y * 20.0) * 0.02;
    } else {
      p += aRand * sin(uTime * 0.8 + aRand.y * 12.0) * 0.006;
    }
    vec3 dir = normalize(position + aRand * 0.8 + vec3(0.0001));
    p += dir * uExplode * (1.6 + abs(aRand.y) * 4.5) + aRand * uExplode * 1.4;

    vec3 n = normalize((modelViewMatrix * vec4(normalize(position + vec3(0.0001)), 0.0)).xyz);
    float rim = pow(1.0 - abs(n.z), 2.4);
    vColor = aColor + vec3(0.545, 0.765, 0.29) * rim * 0.25 * step(aMode, 0.5);
    vFade = fade * (1.0 - uExplode * 0.5);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(aSize * uSize * uPixel / -mv.z, 28.0 * uPixel);
  }
`;
const FRAG_SOFT = /* glsl */ `
  uniform float uOpacity; varying vec3 vColor; varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.25, d) * uOpacity * vFade);
  }
`;
const FRAG_GLOW = /* glsl */ `
  uniform float uOpacity; varying vec3 vColor; varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor * 1.5, pow(smoothstep(0.5, 0.0, d), 1.6) * uOpacity * vFade);
  }
`;

const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const C = {
  humus: ['#24170c', '#33210f', '#3f2a14'].map(hex), a: ['#5d3f24', '#6f4b2c', '#654227'].map(hex),
  b: ['#8a6440', '#a67c52', '#9b7148'].map(hex), c: ['#8f8577', '#a39a8b', '#7d7468'].map(hex),
  leaf: hex('#7cb342'), lime: hex('#8bc34a'), mint: hex('#c8e6c9'), root: hex('#ead7b7'), nodule: hex('#e7a1a8'),
  N: hex('#7fd8c8'), P: hex('#f2c46d'), K: hex('#b9a3ff'), water: hex('#8fd3ff'), co2: hex('#e8f5e9'), worm: hex('#d98c8c'),
};
// Bloc de sol (unités Three) et limites d'horizons
const W = 2.3; const D = 1.1; const TOP = 1.15; const BOT = -1.25;
const horizonAt = (x, y, z) => {
  const wave = 0.06 * Math.sin(x * 3 + z * 2) + 0.03 * Math.sin(x * 9);
  if (y > 0.92 + wave) return 'humus';
  if (y > 0.15 + wave) return 'a';
  if (y > -0.62 + wave * 1.5) return 'b';
  return 'c';
};

function build(scale) {
  const g = { soft: [], root: [], glow: [] };
  const groups = { soft: [], root: [], glow: [] };
  const rnd = (a = -1, b = 1) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const push = (key, p, col, size, mode = 0, end = [0, 0, 0], ctrl = [0, 0, 0]) => {
    groups[key].push({ p, col, size, mode, end, ctrl, r: [rnd(), rnd(), rnd()] });
  };

  // 1. Le bloc : surtout en surface (faces lisibles), un peu en volume
  for (let i = 0; i < 11000 * scale; i++) {
    let x = rnd(-W / 2, W / 2); let y = rnd(BOT, TOP); let z = rnd(-D / 2, D / 2);
    if (Math.random() < 0.72) { // plaquer sur une face
      const f = (Math.random() * 6) | 0;
      if (f === 0) x = -W / 2; else if (f === 1) x = W / 2; else if (f === 2) z = D / 2; else if (f === 3) z = -D / 2; else if (f === 4) y = TOP + 0.04 * Math.sin(x * 4); else y = BOT;
    }
    const h = horizonAt(x, y, z);
    const big = h === 'c' && Math.random() < 0.08; // cailloux de l'horizon C
    push('soft', [x, y, z], pick(C[h]), big ? rnd(30, 46) : rnd(12, 22));
  }
  // Litière en surface : brins verts
  for (let i = 0; i < 600 * scale; i++) push('soft', [rnd(-W / 2, W / 2), TOP + rnd(0.02, 0.08), rnd(-D / 2, D / 2)], Math.random() < 0.5 ? C.leaf : C.humus[2], rnd(10, 18));

  // 2. Plantule : tige + 4 feuilles
  for (let i = 0; i < 420 * scale; i++) { const t = Math.random(); push('root', [Math.sin(t * 2.4) * 0.06, TOP + t * 1.0, 0], C.leaf, rnd(12, 18)); }
  [[-1, 0.55, 0.62], [1, 0.75, 0.55], [-1, 0.9, 0.42], [1, 1.0, 0.36]].forEach(([side, h, len]) => {
    for (let i = 0; i < 360 * scale; i++) {
      const t = Math.random(); const off = rnd(-1, 1) * Math.sin(t * Math.PI) * 0.15;
      push('root', [side * t * len, TOP + h + t * 0.16 - t * t * 0.14 + off * 0.7, off * 0.5 + t * 0.1], Math.random() < 0.5 ? C.leaf : C.lime, rnd(11, 19));
    }
  });

  // 3. Racines : pivot + latérales (marche aléatoire dirigée), mémorisées pour hyphes et nutriments
  const roots = [];
  const grow = (start, dir, len, steps, width, depth) => {
    const pts = []; let p = start.slice(); let d = dir.slice();
    for (let i = 0; i < steps; i++) {
      d = d.map((v, k) => v + rnd(-0.18, 0.18) * (k === 1 ? 0.3 : 1));
      const n = Math.hypot(...d); p = p.map((v, k) => v + (d[k] / n) * (len / steps));
      p[0] = Math.max(-W / 2 + 0.08, Math.min(W / 2 - 0.08, p[0])); p[2] = Math.max(-D / 2 + 0.06, Math.min(D / 2 - 0.06, p[2])); p[1] = Math.max(BOT + 0.1, p[1]);
      pts.push(p.slice());
      for (let k = 0; k < 3; k++) push('root', p.map((v) => v + rnd(-0.008, 0.008)), C.root, width * (1 - i / steps * 0.6) * rnd(0.8, 1.2));
    }
    roots.push(pts);
    if (depth > 0) for (let b = 0; b < 3; b++) {
      const at = pts[(Math.random() * pts.length * 0.8 + pts.length * 0.15) | 0];
      grow(at, [rnd(-1, 1), rnd(-0.6, -0.1), rnd(-0.4, 0.4)], len * 0.5, (steps * 0.55) | 0, width * 0.65, depth - 1);
    }
  };
  grow([0, TOP, 0], [0, -1, 0], 1.9, 70, 22, 2);

  // 4. Hyphes mycorhiziens + nutriments qui y circulent ; colonies bactériennes ; nodules
  const anchors = { myco: null, bact: null, nod: null, nut: null };
  const far = (p) => Object.values(anchors).every((a) => !a || Math.hypot(a[0] - p[0], a[1] - p[1]) > 0.55);
  roots.forEach((pts, ri) => {
    const tip = pts[pts.length - 1];
    // colonie bactérienne en pointe
    if (ri % 2 === 0) for (let i = 0; i < 45 * scale; i++) push('glow', tip.map((v) => v + rnd(-0.07, 0.07)), Math.random() < 0.6 ? C.mint : C.lime, rnd(9, 16), 1);
    if (!anchors.bact && ri > 2 && far(tip)) anchors.bact = tip;
    // nodules à rhizobium sur quelques racines
    if (ri % 3 === 1) { const n = pts[(pts.length / 2) | 0]; push('glow', n, C.nodule, rnd(34, 44)); if (!anchors.nod && far(n)) anchors.nod = n; }
    // hyphes
    for (let hct = 0; hct < 2; hct++) {
      const from = pts[(Math.random() * pts.length) | 0]; let p = from.slice(); let d = [rnd(), rnd(-0.5, 0.5), rnd()];
      const hyp = [];
      for (let i = 0; i < 26; i++) {
        d = d.map((v) => v + rnd(-0.35, 0.35)); const n = Math.hypot(...d);
        p = p.map((v, k) => v + (d[k] / n) * 0.035);
        if (Math.abs(p[0]) > W / 2 || Math.abs(p[2]) > D / 2 || p[1] > TOP || p[1] < BOT) break;
        hyp.push(p.slice()); push('glow', p, C.lime, rnd(6, 10));
      }
      if (hyp.length > 8) {
        if (!anchors.myco && ri > 0 && far(hyp[hyp.length - 1])) anchors.myco = hyp[hyp.length - 1];
        // nutriments : de l'extrémité de l'hyphe vers la racine
        const end = hyp[hyp.length - 1]; const ctrl = hyp[(hyp.length / 2) | 0];
        const nut = [C.N, C.P, C.K][(Math.random() * 3) | 0];
        for (let i = 0; i < 4; i++) push('glow', end, nut, rnd(18, 26), 2, from, ctrl);
        if (!anchors.nut && ri > 1 && far(ctrl)) anchors.nut = ctrl;
      }
    }
  });

  // 5. Pluie qui s'infiltre (part au-dessus du bloc), CO₂ capté par les feuilles, ver de terre
  for (let i = 0; i < 140 * scale; i++) push('glow', [rnd(-W / 2, W / 2), TOP + 1.9 + rnd(0, 0.6), rnd(-D / 2, D / 2)], C.water, rnd(10, 16), 3);
  for (let i = 0; i < 90 * scale; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    push('glow', [side * rnd(1.4, 2.4), TOP + rnd(0.8, 2.2), rnd(-0.8, 0.8)], C.co2, rnd(9, 14), 4, [side * rnd(0.1, 0.5), TOP + rnd(0.6, 1.1), rnd(-0.1, 0.1)]);
  }
  for (let i = 0; i < 46; i++) {
    push('root', [0, 0.5, 0.42], C.worm, 30 - Math.abs(i - 23) * 0.35, 5);
    groups.root[groups.root.length - 1].r = [i, 0, 0]; // aRand.x = rang de l'anneau
  }

  const pack = (list) => {
    const n = list.length;
    const f3 = () => new Float32Array(n * 3); const f1 = () => new Float32Array(n);
    const o = { position: f3(), aColor: f3(), aRand: f3(), aEnd: f3(), aCtrl: f3(), aSize: f1(), aMode: f1() };
    list.forEach((q, i) => {
      o.position.set(q.p, i * 3); o.aColor.set(q.col, i * 3); o.aRand.set(q.r, i * 3); o.aEnd.set(q.end, i * 3); o.aCtrl.set(q.ctrl, i * 3);
      o.aSize[i] = q.size; o.aMode[i] = q.mode;
    });
    return o;
  };
  return { soft: pack(groups.soft), root: pack(groups.root), glow: pack(groups.glow), anchors };
}

const LABELS = [
  { key: 'myco', label: 'hero_lbl_myco', dot: 'bg-fi-accent', side: 1 },
  { key: 'bact', label: 'hero_lbl_bact', dot: 'bg-fi-light', side: -1 },
  { key: 'nod', label: 'hero_lbl_nod', dot: 'bg-[#e7a1a8]', side: 1 },
  { key: 'nut', label: 'hero_lbl_nut', dot: 'bg-[#f2c46d]', side: -1 },
];

export default function RhizoScene({ api, t = (k) => k }) {
  const wrap = useRef(null);
  const labels = useRef([]);
  const loupe = useRef(null);
  const microApi = useRef(null);
  useEffect(() => { microApi.current?.set(0.95); });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return undefined;

    let disposed = false; let cleanup = () => {};
    const start = () => import('three').then((THREE) => {
      if (disposed) return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
      renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.className = 'absolute inset-0 h-full w-full';
      el.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.35, 7.4);
      const group = new THREE.Group(); scene.add(group);
      const spin = new THREE.Group(); group.add(spin);
      spin.rotation.set(0.18, -0.55, 0);

      const data = build(coarse ? 0.55 : 1);
      const uniforms = { uTime: { value: 0 }, uExplode: { value: 0 }, uSize: { value: 1 }, uPixel: { value: dpr }, uOpacity: { value: 1 } };
      const make = (d, frag, { blending, depthTest = true, depthWrite = false, order = 0 }) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
        for (const k of ['aColor', 'aRand', 'aEnd', 'aCtrl']) geo.setAttribute(k, new THREE.BufferAttribute(d[k], 3));
        for (const k of ['aSize', 'aMode']) geo.setAttribute(k, new THREE.BufferAttribute(d[k], 1));
        const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, transparent: true, blending, depthTest, depthWrite });
        const pts = new THREE.Points(geo, mat); pts.renderOrder = order; spin.add(pts);
        return { geo, mat };
      };
      // Sol translucide, puis racines et vivant visibles « au travers » (rayons X)
      const parts = [
        make(data.soft, FRAG_SOFT, { blending: THREE.NormalBlending, depthWrite: true, order: 0 }),
        make(data.root, FRAG_SOFT, { blending: THREE.NormalBlending, depthTest: false, order: 1 }),
        make(data.glow, FRAG_GLOW, { blending: THREE.AdditiveBlending, depthTest: false, order: 2 }),
      ];

      const host = el.closest('section') || el;
      const layout = () => {
        const w = el.clientWidth; const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        const wide = w / h > 1.1;
        group.position.set(wide ? 1.85 : 0, wide ? -0.15 : 1.12, 0);
        group.scale.setScalar(wide ? 0.92 : 0.46);
        uniforms.uSize.value = Math.min(h, 1000) / 900;
        const v = group.position.clone().project(camera);
        host.style.setProperty('--orb-x', `${((v.x + 1) / 2) * 100}%`);
        host.style.setProperty('--orb-y', `${((1 - v.y) / 2) * 100}%`);
      };

      const target = { x: 0, y: 0 }; let drag = 0; let lastX = null;
      const onMove = (e) => { target.y = (e.clientX / window.innerWidth - 0.5) * 0.8; target.x = (e.clientY / window.innerHeight - 0.5) * 0.3; };
      const onTouchStart = (e) => { lastX = e.touches[0].clientX; };
      const onTouchMove = (e) => { if (lastX == null) return; const x = e.touches[0].clientX; drag += (x - lastX) * 0.01; lastX = x; };
      if (coarse) { host.addEventListener('touchstart', onTouchStart, { passive: true }); host.addEventListener('touchmove', onTouchMove, { passive: true }); }
      else window.addEventListener('pointermove', onMove, { passive: true });

      const v3 = new THREE.Vector3();
      const placeLabels = (alpha) => {
        const w = el.clientWidth; const h = el.clientHeight;
        if (loupe.current && data.anchors.bact) {
          v3.set(...data.anchors.bact); spin.localToWorld(v3); v3.project(camera);
          loupe.current.style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px)`;
          loupe.current.style.opacity = String(alpha);
        }
        LABELS.forEach((L, i) => {
          const node = labels.current[i]; const a = data.anchors[L.key];
          if (!node || !a) return;
          v3.set(...a); spin.localToWorld(v3); v3.project(camera);
          node.style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px)`;
          node.style.opacity = String(alpha);
        });
      };

      let progress = 0; let visible = true; let raf = 0; let time = 0; const clock = new THREE.Clock();
      const frame = () => {
        raf = 0;
        const dt = Math.min(clock.getDelta(), 0.05); time += dt;
        uniforms.uTime.value = time;
        const ex = Math.min(1, Math.max(0, (progress - 0.03) / 0.27));
        uniforms.uExplode.value = ex * ex * (3 - 2 * ex);
        uniforms.uOpacity.value = 1 - Math.min(1, Math.max(0, (progress - 0.22) / 0.12));
        camera.position.z = 7.4 - uniforms.uExplode.value * 3.4;
        spin.rotation.y = -0.55 + Math.sin(time * 0.25) * 0.45 + drag; drag *= 0.96;
        group.rotation.x += (target.x - group.rotation.x) * 0.05;
        group.rotation.y += (target.y - group.rotation.y) * 0.05;
        renderer.render(scene, camera);
        placeLabels(Math.max(0, 1 - ex * 4) * Math.min(1, time / 1.5));
        if (visible && progress < 0.36) raf = requestAnimationFrame(frame);
      };
      const kick = () => { if (!raf && visible && progress < 0.36) { clock.getDelta(); raf = requestAnimationFrame(frame); } };
      api.current = { set: (v) => { progress = v; kick(); } };

      const ro = new ResizeObserver(layout); ro.observe(el); layout();
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }); io.observe(el);
      kick();
      requestAnimationFrame(() => setReady(true));

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        window.removeEventListener('pointermove', onMove);
        host.removeEventListener('touchstart', onTouchStart); host.removeEventListener('touchmove', onTouchMove);
        parts.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
        renderer.dispose(); renderer.domElement.remove();
        api.current = null;
      };
    });

    // Chargé après le loader / au premier temps libre : ne retarde pas le texte (LCP).
    const go = () => (window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 200));
    if (document.documentElement.classList.contains('fi-loading')) window.addEventListener('fi:loader-done', go, { once: true });
    else go();
    return () => { disposed = true; window.removeEventListener('fi:loader-done', go); cleanup(); };
  }, [api]);

  return (
    <div ref={wrap} aria-hidden className="absolute inset-0">
      {/* Repli / attente : monolithe en CSS, à la place de la scène 3D */}
      <div className={`orb-fallback pointer-events-none absolute transition-opacity duration-1000 ${ready ? 'opacity-0' : 'opacity-100'}`} />
      {/* Rayons de lumière au-dessus de la plantule */}
      <div className="hero-rays pointer-events-none absolute" />
      {/* Loupe sur la colonie bactérienne : micro-organismes vivants */}
      <div ref={loupe} className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-fi-light/80" />
        <span className="absolute right-1 top-1 h-px w-12 origin-right rotate-[35deg] bg-fi-light/60 md:w-16" />
        <div className="absolute right-9 -top-[7.5rem] h-24 w-24 overflow-hidden rounded-full border-2 border-white/40 bg-[#1d140b] shadow-[0_0_0_6px_rgb(255_255_255/0.06),0_20px_50px_-10px_rgb(0_0_0/0.6)] md:right-12 md:-top-[10rem] md:h-32 md:w-32">
          <MicroCanvas api={microApi} />
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgb(0_0_0/0.7)]" />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-semibold tracking-widest text-white/70">×1000</span>
        </div>
      </div>
      {/* Étiquettes projetées depuis la scène */}
      <div className="pointer-events-none absolute inset-0">
        {LABELS.map((L, i) => (
          <div key={L.key} ref={(n) => { labels.current[i] = n; }} className="absolute left-0 top-0 opacity-0 will-change-transform">
            <span className={`absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full ${L.dot} ring-4 ring-white/10`} />
            {L.side > 0 ? (
              <>
                <span className="absolute left-1.5 top-0 hidden h-px w-14 bg-white/40 md:block" />
                <span className="absolute left-16 -top-3 hidden md:block whitespace-nowrap rounded-full border border-white/15 bg-fi-deep/70 px-2.5 py-0.5 text-[9px] md:px-3 md:py-1 md:text-[11px] font-medium text-white/90 backdrop-blur-md">{t(L.label)}</span>
              </>
            ) : (
              <>
                <span className="absolute right-1.5 top-0 hidden h-px w-14 bg-white/40 md:block" />
                <span className="absolute right-16 -top-3 hidden md:block whitespace-nowrap rounded-full border border-white/15 bg-fi-deep/70 px-2.5 py-0.5 text-[9px] md:px-3 md:py-1 md:text-[11px] font-medium text-white/90 backdrop-blur-md">{t(L.label)}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
