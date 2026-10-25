// Hero « microscope » : un monolithe de sol vivant en 3D (RhizoScene), prélevé dans un champ au couchant (FieldCanvas),
// se désagrège au défilement ; on plonge vers lui, un anneau de lentille lumineux s'ouvre, la mise au point se fait,
// l'oculaire (clip-path circulaire centré sur la motte) s'ouvre et l'on entre dans le sol vivant : un vrai sol
// au microscope (agrégats, sable, pores, gouttes d'eau — SoilCanvas), racines qui se dessinent,
// micro-organismes reliés par un réseau d'hyphes (canvas).
// Trois chapitres (rhizosphère, souchothèque, remédiation) apparaissent aux points de repos.
// Sans JS : hero classique d'un écran (voir .hero-scene dans index.css).
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { useLang } from '../i18n/LangProvider';
import RhizoScene from './RhizoScene';
import MicroCanvas from './MicroCanvas';
import SoilCanvas from './SoilCanvas';
import FieldCanvas from './FieldCanvas';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { openPois } from '../lib/pois';

const CHAPTERS = [
  { kicker: 'hero_ch1_kicker', titre: 'hero_ch1_titre', stat: 'hero_stat_1' },
  { kicker: 'hero_ch2_kicker', titre: 'hero_ch2_titre', stat: 'hero_stat_3' },
  { kicker: 'hero_ch3_kicker', titre: 'hero_ch3_titre', stat: 'hero_stat_2' },
];
const CH_AT = [0.3, 0.52, 0.74]; // position (0–1) de l'entrée de chaque chapitre dans la scène

// Grains minéraux : taille (px), position, vitesse de parallaxe (les rapides sont au premier plan, plus flous).
const GRAINS = [
  { l: '4%', t: '10%', s: 240, sp: 60 }, { l: '74%', t: '6%', s: 320, sp: 90 }, { l: '60%', t: '64%', s: 170, sp: 25 },
  { l: '10%', t: '68%', s: 280, sp: 110 }, { l: '88%', t: '50%', s: 140, sp: 40 }, { l: '38%', t: '30%', s: 110, sp: 15 },
];
const ROOTS = [
  'M-40 120 C 260 160, 420 300, 640 330 S 1040 420, 1240 610 S 1520 820, 1680 860',
  'M520 -40 C 560 140, 500 260, 610 420 S 820 640, 760 940',
  'M1640 180 C 1380 220, 1240 330, 1100 300 S 860 220, 720 360',
];
const HAIRS = [
  'M640 330 c 30 -60, 80 -80, 120 -90', 'M700 340 c 10 50, -20 90, -10 140', 'M1000 460 c 60 -20, 110 10, 160 -30',
  'M610 420 c -60 30, -110 20, -170 60', 'M700 600 c 50 10, 90 50, 140 50', 'M1240 610 c -10 60, 20 110, 0 170',
  'M1100 300 c -20 -60, 10 -110, -10 -170', 'M300 200 c -10 60, 30 100, 20 150', 'M880 260 c 20 -40, 60 -60, 90 -110',
];
const NODULES = [[640, 330], [1240, 610], [610, 420], [1100, 300], [760, 780], [300, 200]];

export default function HeroMicroscope() {
  const { t, p, lang } = useLang();
  const ref = useRef(null);
  const micro = useRef(null);
  const soil = useRef(null);
  const orb = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const q = gsap.utils.selector(ref);

    // Entrée du titre — attend la fin du loader s'il est affiché.
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .from(q('.h-line'), { yPercent: 110, opacity: 0, duration: 1, stagger: 0.09 }, 0.1)
      .from(q('.h-sub, .h-cta'), { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.5)
      .from(q('.h-stat'), { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.8);
    const play = () => intro.play();
    if (document.documentElement.classList.contains('fi-loading')) window.addEventListener('fi:loader-done', play, { once: true });
    else play();

    // Descente : une seule timeline pilotée par le défilement (0 → 1 sur toute la scène).
    const fmt = new Intl.NumberFormat({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang] || 'fr-FR');
    const mag = q('.hud-mag')[0];
    // Diamètre final de l'oculaire : clip-path circle(150 %) se rapporte à √(l² + h²) / √2
    // (taille posée en variable CSS au redimensionnement : surtout pas invalidateOnRefresh, qui ré-enregistrerait
    // l'état de départ des animations à la position de défilement courante et figerait le hero à mi-plongée)
    const sizeEye = () => { const b = q('.hero-micro')[0]; if (b) ref.current.style.setProperty('--eye-d', `${(Math.hypot(b.clientWidth, b.clientHeight) / Math.SQRT2) * 3}px`); };
    sizeEye(); window.addEventListener('resize', sizeEye);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (self) => {
          micro.current?.set(self.progress);
          soil.current?.set(self.progress);
          orb.current?.set?.(self.progress);
          const k = Math.min(1, Math.max(0, (self.progress - 0.06) / 0.7));
          if (mag) mag.textContent = `×${fmt.format(Math.round(Math.pow(1000, k) / (k > 0.4 ? 10 : 1)) * (k > 0.4 ? 10 : 1))}`;
        },
      },
    });
    tl.to(q('.h-content'), { opacity: 0, y: -70, filter: 'blur(10px)', duration: 0.12 }, 0.02)
      .to(q('.h-hint'), { opacity: 0, duration: 0.04 }, 0)
      .to(q('.hero-land'), { scale: 7, duration: 0.26, ease: 'power3.in' }, 0.02) // on plonge dans le sol du champ
      .to(q('.hero-land'), { opacity: 0, duration: 0.08 }, 0.22)
      .fromTo(q('.hero-micro'), { '--eye': '0%' }, { '--eye': '150%', duration: 0.2, ease: 'power2.in' }, 0.14)
      // Anneau de la lentille : suit exactement le bord de l'oculaire (même rayon, même courbe)
      .fromTo(q('.eye-ring'), { '--k': 0, opacity: 1 }, { '--k': 1, duration: 0.2, ease: 'power2.in' }, 0.14)
      .to(q('.eye-ring'), { opacity: 0, duration: 0.05 }, 0.29)
      .fromTo(q('.micro-inner'), { scale: 2.4 }, { scale: 1, duration: 0.45, ease: 'power2.out' }, 0.14);
    // Mise au point : flou → net (ordinateur) ; sur mobile, simple fondu, plus léger à animer
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) tl.fromTo(q('.micro-inner'), { filter: 'blur(8px) brightness(1.3)' }, { filter: 'blur(0px) brightness(1)', duration: 0.08, ease: 'power2.out' }, 0.16);
    else tl.fromTo(q('.micro-inner'), { opacity: 0.35 }, { opacity: 1, duration: 0.16 }, 0.16);
    tl
      .to(q('.hero-hud'), { opacity: 1, duration: 0.05 }, 0.22)
      .to(q('.hud-bar'), { scaleX: 1, duration: 0.76 }, 0.22)
      .to(q('.root-main, .root-core'), { strokeDashoffset: 0, duration: 0.5, stagger: 0.03 }, 0.24)
      .to(q('.root-hair'), { strokeDashoffset: 0, duration: 0.18, stagger: 0.03 }, 0.4)
      .from(q('.nodule'), { scale: 0, transformOrigin: '50% 50%', duration: 0.06, stagger: 0.04, ease: 'back.out(3)' }, 0.5);
    q('.grain-blob').forEach((el) => tl.to(el, { yPercent: -Number(el.dataset.speed), duration: 0.86 }, 0.14));
    q('.hero-chapter').forEach((el, i) => {
      tl.fromTo(el, { opacity: 0, y: 50, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.07, ease: 'power2.out' }, CH_AT[i])
        .to(el, { opacity: 0, y: -50, filter: 'blur(14px)', duration: 0.07, ease: 'power2.in' }, i < 2 ? CH_AT[i] + 0.15 : 0.93);
    });
    tl.set({}, {}, 1);
    return () => { window.removeEventListener('fi:loader-done', play); window.removeEventListener('resize', sizeEye); };
  }, { scope: ref, dependencies: [lang] });

  const title = t('hero_titre');
  const [l1, l2] = title.includes(',') ? [title.split(',')[0] + ',', title.split(',').slice(1).join(',').trim()] : [title, ''];

  return (
    <section ref={ref} data-horizon="surface" className="hero-scene relative bg-fi-bg pt-[var(--header-h)]">
      {/* Fenêtre sombre arrondie sous la barre de navigation : rien du hero n'est masqué par l'en-tête */}
      <div className="sticky top-[var(--header-h)] mx-2 sm:mx-3 h-[calc(100svh-var(--header-h)-0.5rem)] flex items-end overflow-hidden rounded-[28px] bg-fi-deep text-white">
        {/* Échelle macro : champ au couchant + lueur autour de la motte de terre vivante en 3D */}
        <div aria-hidden className="hero-land absolute inset-0 will-change-transform">
          <FieldCanvas />
          <div className="hero-atmo absolute inset-0" />
        </div>
        <RhizoScene api={orb} t={t} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06120c] via-[#06120c]/45 to-transparent md:bg-gradient-to-r md:from-[#06120c]/90 md:via-[#06120c]/30" />

        {/* Échelle micro : le sol vivant, révélé par l'oculaire */}
        <div aria-hidden className="hero-micro absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgb(var(--fi-soil) / 0.9) 0%, #1d140b 48%, #0a170c 100%)' }}>
          <div className="micro-inner absolute inset-0 will-change-transform">
            <SoilCanvas api={soil} />
            {GRAINS.map((g, i) => (
              <span key={i} data-speed={g.sp} className="grain-blob absolute" style={{
                // Mottes au premier plan, hors de la mise au point (flou de profondeur de champ)
                left: g.l, top: g.t, width: `max(${g.s * 0.45}px, min(${g.s}px, ${g.s / 9}vw))`, aspectRatio: '1.15', opacity: g.sp > 70 ? 0.85 : 0.6,
                borderRadius: '42% 58% 63% 37% / 45% 39% 61% 55%', filter: `blur(${g.sp > 70 ? 10 : 3}px)`,
                background: 'radial-gradient(circle at 35% 30%, #6b4a2c, #3a2414 55%, #170e07 80%, transparent 82%)',
              }} />
            ))}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
              {ROOTS.map((d, i) => <path key={i} className="root-main" d={d} pathLength="1" fill="none" stroke="rgb(226 205 168 / 0.62)" strokeWidth={22 - i * 5} strokeLinecap="round" strokeDasharray="1 2" strokeDashoffset="1" />)}
              {ROOTS.map((d, i) => <path key={`c${i}`} className="root-core" d={d} pathLength="1" fill="none" stroke="rgb(255 247 228 / 0.55)" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 2" strokeDashoffset="1" />)}
              {HAIRS.map((d, i) => <path key={i} className="root-hair" d={d} pathLength="1" fill="none" stroke="rgb(240 228 204 / 0.55)" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1 2" strokeDashoffset="1" />)}
              {NODULES.map(([cx, cy], i) => <circle key={i} className="nodule" cx={cx} cy={cy} r={8} fill="#e7a1a8" stroke="#fff3f0" strokeOpacity={0.5} strokeWidth={2} />)}
            </svg>
            <MicroCanvas api={micro} />
          </div>
          {/* Vignette de l'oculaire, liseré irisé (aberration chromatique) + réticule discret */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgb(120 200 255 / 0.07) 58%, rgb(255 140 90 / 0.07) 63%, rgb(0 0 0 / 0.7) 100%)' }} />
          <svg className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="0.15">
            <circle cx="50" cy="50" r="49" /><path d="M50 0v8M50 92v8M0 50h8M92 50h8M46 50h8M50 46v8" />
          </svg>
          {/* Voile sous les textes des chapitres : lisibles sur le sol */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0603]/85 via-[#0a0603]/40 to-[#0a0603]/10 md:bg-gradient-to-r md:from-[#0a0603]/80 md:via-[#0a0603]/30 md:to-transparent" />
        </div>
        {/* Anneau lumineux de la lentille, au bord de l'oculaire qui s'ouvre */}
        <div aria-hidden className="eye-ring pointer-events-none absolute z-[1] rounded-full" />

        {/* Grain dans un calque séparé : la classe .grain impose position: relative, ce qui annulerait le sticky */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]"><div className="grain h-full" /></div>

        {/* Chapitre 0 : le contenu d'origine (titre, boutons, chiffres) */}
        <div className="h-content wrap relative z-[2] pb-10 pt-8 md:pb-16 md:pt-12">
          <p className="h-sub text-xs sm:text-sm md:text-base font-medium text-fi-accent">{t('hero_kicker')}</p>
          <h1 className="mt-3 md:mt-4 text-[2.35rem] leading-[1] tracking-[-0.03em] sm:text-display-xl !text-white max-w-3xl">
            <span className="block overflow-hidden"><span className="h-line block">{l1}</span></span>
            {l2 && <span className="block overflow-hidden"><span className="h-line block text-fi-accent">{l2}</span></span>}
          </h1>
          <p className="h-sub mt-4 md:mt-6 max-w-xl text-[0.98rem] md:text-lg text-white/80 leading-relaxed">{t('hero_sous_titre')}</p>
          <div className="h-cta mt-6 md:mt-8 flex flex-wrap gap-2.5 md:gap-3">
            <Link to={p('/contact')} state={{ subject: 'devis', service: 'diagnostics' }} className="btn-accent">{t('hero_bouton_1')} <ArrowRight size={18} aria-hidden /></Link>
            <button type="button" onClick={() => openPois()} className="btn-light">{t('hero_bouton_2')}</button>
          </div>
          <ul className="mt-8 md:mt-10 hidden sm:flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
            {['hero_stat_1', 'hero_stat_2', 'hero_stat_3'].map((k) => <li key={k} className="h-stat flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fi-accent" aria-hidden />{t(k)}</li>)}
          </ul>
          <a href="#services" className="h-stat h-hint mt-10 hidden md:inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">{t('hero_scroll')} <ArrowDown size={14} className="animate-bounce" aria-hidden /></a>
        </div>

        {/* Chapitres 1–3, révélés aux points de repos */}
        {CHAPTERS.map((c, i) => (
          <div key={c.kicker} className="hero-chapter absolute inset-0 z-[2] items-center pointer-events-none">
            <div className="wrap">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-fi-accent tabular-nums">{String(i + 1).padStart(2, '0')} — {t(c.kicker)}</p>
                <p className="mt-4 font-display text-display-lg text-white">{t(c.stat)}</p>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{t(c.titre)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Lecture « microscope » : grossissement + barre d'échelle */}
        <div aria-hidden className="hero-hud absolute top-5 right-5 md:top-8 md:right-8 z-[2] text-right text-[11px] uppercase tracking-[0.18em] text-white/55">
          <p>{t('hero_hud')} <span className="hud-mag ml-2 font-display text-base normal-case tracking-normal text-fi-accent tabular-nums">×1</span></p>
          <div className="mt-2 ml-auto h-px w-36 bg-white/20"><div className="hud-bar h-full origin-left scale-x-0 bg-fi-accent" /></div>
          <p className="mt-2 flex items-center justify-end gap-2 normal-case tracking-normal"><span className="inline-block h-px w-8 bg-white/60" />10 µm</p>
        </div>
      </div>
    </section>
  );
}
