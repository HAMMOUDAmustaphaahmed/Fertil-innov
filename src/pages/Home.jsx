import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import SEO from '../components/SEO';
import Icon, { SERVICE_ICON } from '../components/Icons';
import DepthRail from '../components/DepthRail';
import Hero from '../components/HeroMicroscope';
import MicroCanvas from '../components/MicroCanvas';
import { SectionHeader, Counter, PartnersMarquee } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { openPois, teasePois } from '../lib/pois';

const vis = (list) => (list || []).filter((x) => x.visible !== false);
const fmtDate = (iso, lang) => new Intl.DateTimeFormat({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// Boîte de Petri décorative : colonies pseudo-aléatoires (stables par graine), qui poussent à l'entrée.
// ---------------------------------------------------------------------------
function Petri({ seed = 1, icon, dark = false, className = '' }) {
  let s = seed * 9301 + 49297;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const palette = dark ? ['#8bc34a', '#c8e6c9', '#e9dcb5'] : ['#8bc34a', '#4caf50', '#d8b98a', '#a5d6a7'];
  const cols = Array.from({ length: 16 }, () => {
    const a = rand() * Math.PI * 2; const r = 18 + rand() * 66;
    return { x: 100 + Math.cos(a) * r, y: 100 + Math.sin(a) * r, r: 2 + rand() * 7, c: palette[(rand() * palette.length) | 0] };
  });
  return (
    <div className={`petri relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" className="petri-spin absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="100" cy="100" r="98" fill="none" stroke={dark ? 'rgb(255 255 255 / 0.18)' : 'rgb(var(--fi-dark) / 0.12)'} strokeWidth="1" strokeDasharray="1 5" />
        <circle cx="100" cy="100" r="92" fill={dark ? 'rgb(255 255 255 / 0.04)' : 'rgb(255 255 255 / 0.7)'} stroke={dark ? 'rgb(255 255 255 / 0.25)' : 'rgb(var(--fi-dark) / 0.15)'} strokeWidth="5" />
        <circle cx="100" cy="100" r="86" fill={dark ? 'rgb(139 195 74 / 0.06)' : 'rgb(var(--fi-mint) / 0.9)'} />
        {cols.map((c, i) => (
          <g key={i} className="petri-col" style={{ transformOrigin: `${c.x}px ${c.y}px` }}>
            <circle cx={c.x} cy={c.y} r={c.r * 1.9} fill={c.c} opacity="0.15" />
            <circle cx={c.x} cy={c.y} r={c.r} fill={c.c} opacity="0.85" />
          </g>
        ))}
        <ellipse cx="66" cy="44" rx="34" ry="9" fill="white" opacity={dark ? 0.08 : 0.6} transform="rotate(-30 66 44)" />
      </svg>
      {icon && <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-white/90 shadow-leaf">{icon}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Services : cartes « boîtes de Petri » empilées. Chaque carte colle sous l'en-tête ; la suivante
// la recouvre pendant qu'elle recule en 3D. Même effet sur mobile (sticky + scrub).
// ---------------------------------------------------------------------------
const CARD_TONES = ['bg-white', 'bg-fi-mint', 'bg-[#f3ead9]', 'bg-[#e4f1d6]', 'bg-white'];

function Services() {
  const { t, p, L } = useLang();
  const { listes } = useSite();
  const services = vis(listes.services);
  const ref = useRef(null);
  useReveal([services.length], ref);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const cards = gsap.utils.toArray(ref.current.querySelectorAll('.stack-card'));
    cards.forEach((card, i) => {
      // Colonies qui poussent quand la carte arrive
      gsap.from(card.querySelectorAll('.petri-col'), { scale: 0, duration: 0.8, ease: 'back.out(2.5)', stagger: 0.04, scrollTrigger: { trigger: card, start: 'top 75%', once: true } });
      const next = cards[i + 1];
      if (!next) return;
      // filter en fromTo explicite : depuis « none », GSAP partirait de brightness(0) (carte noire)
      gsap.fromTo(card.querySelector('.stack-inner'), { filter: 'brightness(1)' }, {
        scale: 0.9, rotationX: -8, transformPerspective: 1200, transformOrigin: '50% 0%', filter: 'brightness(0.94)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true },
      });
    });
  }, { scope: ref, dependencies: [services.length] });

  const all = [...services.map((s, i) => ({ ...s, kind: 'service', i })), { id: 'formations', kind: 'formations', i: services.length }];
  return (
    <section ref={ref} id="services" data-horizon="rhizo" className="section relative">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader kicker={t('services_kicker')} title={t('services_titre')} text={t('services_texte')} />
          <Link to={p('/services')} className="reveal btn-ghost">{t('services_lien')} <ArrowRight size={16} aria-hidden /></Link>
        </div>
        <ol className="mt-12 space-y-6">
          {all.map((s) => {
            const dark = s.kind === 'formations';
            const top = `calc(var(--header-h) + 1rem + ${s.i * 14}px)`;
            const href = dark ? p('/formations') : `${p('/services')}#${s.id}`;
            return (
              <li key={s.id} className="stack-card sticky" style={{ top }}>
                <Link to={href} className={`stack-inner group relative grid overflow-hidden rounded-[2rem] border md:grid-cols-[1.15fr_0.85fr] md:min-h-[26rem] shadow-[0_30px_60px_-40px_rgb(var(--fi-deep)/0.45)] ${dark ? 'bg-fi-deep text-white border-white/10 grain' : `${CARD_TONES[s.i % CARD_TONES.length]} border-fi-light/70`}`}>
                  <div className="relative flex flex-col p-7 md:p-10">
                    <p className={`font-display text-sm font-semibold tabular-nums ${dark ? 'text-fi-accent' : 'text-fi-primary'}`}>{pad(s.i + 1)} <span className="opacity-40">/ {pad(all.length)}</span></p>
                    <h3 className={`mt-6 text-display-md ${dark ? '!text-white' : ''}`}>{dark ? t('nav_formations') : L(s.titre)}</h3>
                    <p className={`mt-4 max-w-md text-[1.02rem] leading-relaxed ${dark ? 'text-white/75' : 'text-fi-text/75'}`}>{dark ? `${t('formations_texte')} 98 % ${t('formations_satisfaction')}.` : L(s.resume)}</p>
                    <span className={`mt-auto pt-8 inline-flex items-center gap-3 text-sm font-semibold ${dark ? 'text-fi-accent' : 'text-fi-dark'}`}>
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45 ${dark ? 'bg-fi-accent text-fi-deep' : 'bg-fi-dark text-white'}`}><ArrowUpRight size={18} aria-hidden /></span>
                      {t('decouvrir')}
                    </span>
                  </div>
                  <div className="relative hidden md:flex items-center justify-center p-8">
                    <Petri seed={s.i + 3} dark={dark} className="w-[min(100%,20rem)]"
                      icon={dark
                        ? <Icon name="cap" className="h-full w-full items-center justify-center text-fi-dark" size="h-3/5 w-3/5" />
                        : <Icon name={SERVICE_ICON[s.id]} emoji={s.emoji} className="h-full w-full items-center justify-center text-fi-dark" size="h-3/5 w-3/5" />} />
                  </div>
                  {/* Mobile : petite boîte de Petri en coin */}
                  <Petri seed={s.i + 3} dark={dark} className="md:hidden absolute -right-6 -top-6 w-28 opacity-80" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Processus : une carotte de prélèvement se remplit, horizon par horizon, au fil des 4 étapes.
// Verticale et collante sur grand écran, horizontale et collante sous l'en-tête sur mobile.
// ---------------------------------------------------------------------------
const CORE = [
  'linear-gradient(180deg, #3b2716, #24170c)',
  'linear-gradient(180deg, rgb(var(--fi-soil)), #4a3119)',
  'linear-gradient(180deg, rgb(var(--fi-loam)), #8a6440)',
  'linear-gradient(180deg, #a39a8b, #7d7468)',
];

function SampleCore({ steps, vertical = false }) {
  return (
    <div className={`flex gap-1 rounded-2xl border border-fi-dark/10 bg-white/85 p-1.5 shadow-soft backdrop-blur ${vertical ? 'h-[22rem] w-24 flex-col' : ''}`}>
      {steps.map((s, i) => (
        <div key={s.id} className={`relative flex-1 overflow-hidden rounded-xl bg-fi-light/40 ${vertical ? '' : 'h-9'}`}>
          <div data-i={i} className={`core-seg absolute inset-0 ${vertical ? 'is-v' : ''}`} style={{ background: CORE[i % CORE.length] }} />
          <span className="absolute inset-0 flex items-center justify-center font-display text-xs font-semibold text-white mix-blend-difference tabular-nums">{pad(i + 1)}</span>
        </div>
      ))}
    </div>
  );
}

function Process() {
  const { t, L, p } = useLang();
  const { processus, chiffres } = useSite();
  const ref = useRef(null);
  useReveal([], ref);
  useGSAP(() => {
    const steps = gsap.utils.toArray(ref.current.querySelectorAll('.step'));
    if (prefersReducedMotion()) return;
    steps.forEach((el, i) => {
      gsap.fromTo(ref.current.querySelectorAll(`.core-seg[data-i="${i}"]`), { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 55%', scrub: true } });
      ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 60%', toggleClass: { targets: el, className: 'is-active' } });
    });
  }, { scope: ref });

  return (
    <section ref={ref} data-horizon="a" className="section bg-fi-mint/50 horizons">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          <SectionHeader kicker={t('pourquoi_kicker')} title={t('processus_titre')} text={t('processus_texte')} />
          {/* Carotte de prélèvement (grand écran : verticale) */}
          <div className="mt-8 hidden lg:block" aria-hidden><SampleCore steps={processus} vertical /></div>
          <div className="mt-8 hidden lg:flex flex-wrap gap-3">
            <Link to={p('/services')} className="btn-primary">{t('pourquoi_bouton_1')}</Link>
            <Link to={p('/contact')} state={{ subject: 'devis' }} className="btn-ghost">{t('pourquoi_bouton_2')}</Link>
          </div>
        </div>
        <ol className="lg:col-span-7 space-y-5">
          {/* Carotte de prélèvement (mobile : horizontale, collée sous l'en-tête pendant les étapes) */}
          <li className="sticky top-[calc(var(--header-h)+0.5rem)] z-10 lg:hidden" aria-hidden><SampleCore steps={processus} /></li>
          {processus.map((s, i) => (
            <li key={s.id} className="step reveal group relative overflow-hidden rounded-[1.75rem] border border-fi-light/80 bg-white p-6 md:p-8 transition-[box-shadow,border-color] duration-500 [&.is-active]:border-fi-primary/40 [&.is-active]:shadow-leaf">
              <span aria-hidden className="pointer-events-none absolute -right-2 -top-6 font-display text-[7rem] font-bold leading-none text-fi-mint transition-colors duration-500 group-[.is-active]:text-fi-light">{pad(i + 1)}</span>
              <div className="relative flex items-center gap-4"><Icon emoji={s.emoji} tile="light" className="h-14 w-14" size="h-8 w-8" /><h3 className="text-display-sm">{L(s.titre)}</h3></div>
              <p className="relative mt-3 max-w-lg text-fi-text/75 leading-relaxed">{L(s.texte)}</p>
            </li>
          ))}
          <li className="reveal flex flex-wrap items-center gap-3 pt-2 lg:hidden">
            <Link to={p('/services')} className="btn-primary">{t('pourquoi_bouton_1')}</Link>
            <Link to={p('/contact')} state={{ subject: 'devis' }} className="btn-ghost">{t('pourquoi_bouton_2')}</Link>
          </li>
          <li className="pt-2 text-sm text-fi-text/60">{chiffres.annees} {t('perf_annees')}.</li>
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Réalisations : bande horizontale en « cover-flow » 3D pilotée par le défilement (toutes tailles),
// puis compteurs.
// ---------------------------------------------------------------------------
function Realisations() {
  const { t, L } = useLang();
  const { listes, chiffres } = useSite();
  const list = vis(listes.realisations);
  const ref = useRef(null);
  useReveal([list.length], ref);
  useGSAP(() => {
    const track = ref.current?.querySelector('.track');
    if (!track || prefersReducedMotion()) return undefined;
    const zone = ref.current.querySelector('.sticky-zone');
    const cards = gsap.utils.toArray(track.querySelectorAll('.flow-card'));
    const dist = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
    // La zone collante mesure 100vh + distance horizontale : le défilement vertical « pousse » la bande.
    const size = () => zone.style.setProperty('--track-extra', `${dist()}px`);
    size();
    ScrollTrigger.addEventListener('refreshInit', size);
    // Cover-flow : inclinaison et échelle selon la distance au centre de l'écran
    const flow = () => {
      const mid = window.innerWidth / 2;
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const off = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / (window.innerWidth * 0.6)));
        gsap.set(c, { rotationY: off * -28, scale: 1 - Math.abs(off) * 0.1, z: -Math.abs(off) * 120, transformPerspective: 1400 });
        const img = c.querySelector('img'); if (img) gsap.set(img, { xPercent: off * -8, scale: 1.18 });
      });
    };
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: zone, start: 'top top', end: () => `+=${dist()}`, scrub: 0.8, invalidateOnRefresh: true, onUpdate: flow, onRefresh: flow } });
    flow();
    return () => { ScrollTrigger.removeEventListener('refreshInit', size); zone.style.removeProperty('--track-extra'); };
  }, { scope: ref, dependencies: [list.length] });

  const counters = [
    { v: chiffres.projets, suffix: '', k: 'compteur_projets' },
    { v: chiffres.hectares, suffix: ' ha', k: 'compteur_ha' },
    { v: chiffres.satisfaction, suffix: ' %', k: 'compteur_satisfaction' },
    { v: chiffres.annees, suffix: '', k: 'compteur_annees' },
  ];

  return (
    <section ref={ref} id="realisations" data-horizon="b" className="relative bg-fi-deep text-white">
      <div className="sticky-zone h-[calc(100vh+var(--track-extra,0px))]">
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden pt-[var(--header-h)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50"><div className="grain h-full" /></div>
          <div className="wrap relative">
            <SectionHeader dark kicker={t('realisations_kicker')} title={t('realisations_titre')} text={t('realisations_texte')} />
          </div>
          <div className="relative mt-8 lg:mt-12 px-4 sm:px-6 lg:px-8 [perspective:1400px]">
            <div className="track flex gap-5 w-max lg:pl-[max(0px,calc((100vw-76rem)/2))] [transform-style:preserve-3d]">
              {list.map((r, i) => (
                <article key={r.id} className="flow-card relative w-[74vw] max-w-[440px] sm:w-[380px] shrink-0 overflow-hidden rounded-[1.75rem] bg-white/5 ring-1 ring-white/10 will-change-transform">
                  <div className="overflow-hidden"><img src={imgSrc(r.image)} alt={L(r.titre)} width={800} height={600} loading="lazy" decoding="async" data-fx-off className="aspect-[4/3] w-full object-cover" /></div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fi-deep via-fi-deep/75 to-transparent p-5 pt-20">
                    <p className="flex items-center gap-2 text-xs font-semibold text-fi-accent"><span className="tabular-nums text-white/40">{pad(i + 1)}</span>{L(r.categorie)}</p>
                    <h3 className="mt-1 text-display-sm !text-white">{L(r.titre)}</h3>
                    <p className="text-sm text-white/70">{r.lieu}</p>
                  </div>
                </article>
              ))}
              <div className="w-[10vw] shrink-0 lg:w-[calc((100vw-76rem)/2)]" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      <div className="wrap relative pb-24">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-white/10 md:grid-cols-4">
          {counters.map((c) => (
            <div key={c.k} className="reveal bg-fi-deep p-6 md:p-8">
              <dd className="font-display text-5xl md:text-6xl font-semibold bg-gradient-to-br from-white to-fi-accent bg-clip-text text-transparent"><Counter value={c.v} suffix={c.suffix} /></dd>
              <dt className="mt-2 text-sm text-white/65">{t(c.k)}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pourquoi nous : trois cartes empilées au centre qui s'éventaillent à l'arrivée (toutes tailles).
// ---------------------------------------------------------------------------
function Pourquoi() {
  const { t, L } = useLang();
  const { listes } = useSite();
  const list = vis(listes.pourquoi);
  const ref = useRef(null);
  useGSAP(() => {
    const cards = gsap.utils.toArray(ref.current.querySelectorAll('.fan-card'));
    if (!cards.length || prefersReducedMotion()) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      // Grand écran : partent du centre, empilées, puis prennent leur place
      cards.forEach((c, i) => {
        const shift = (1 - i) * 100; // la carte 0 vient de la droite, la 2 de la gauche
        gsap.fromTo(c, { xPercent: shift, rotationZ: (i - 1) * -10, y: 60, rotationX: 20, transformPerspective: 1200 }, { xPercent: 0, rotationZ: 0, y: 0, rotationX: 0, ease: 'power2.out', scrollTrigger: { trigger: ref.current.querySelector('.fan'), start: 'top 85%', end: 'top 30%', scrub: 0.8 } });
      });
    });
    mm.add('(max-width: 767px)', () => {
      // Mobile : chaque carte arrive de côté, alternativement, en pivotant
      cards.forEach((c, i) => {
        gsap.fromTo(c, { xPercent: i % 2 ? 35 : -35, rotationZ: i % 2 ? 8 : -8, rotationY: i % 2 ? -25 : 25, transformPerspective: 1000, opacity: 0.3 }, { xPercent: 0, rotationZ: 0, rotationY: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 95%', end: 'top 55%', scrub: 0.8 } });
      });
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [list.length] });

  return (
    <section ref={ref} className="section overflow-hidden">
      <div className="wrap">
        <SectionHeader align="center" kicker={t('pourquoi_kicker')} title={t('pourquoi_titre')} text={t('pourquoi_texte')} />
        <div className="fan mt-14 grid gap-5 md:grid-cols-3">
          {list.map((x, i) => (
            <article key={x.id} className={`fan-card relative flex flex-col rounded-[1.75rem] border p-7 md:p-8 ${i === 1 ? 'bg-fi-deep text-white border-white/10 md:-mt-6 md:mb-6' : 'bg-white border-fi-light/80'}`}>
              <Icon emoji={x.emoji} tile={i === 1 ? 'dark' : 'light'} className="h-16 w-16" size="h-9 w-9" />
              <h3 className={`mt-6 text-display-sm ${i === 1 ? '!text-white' : ''}`}>{L(x.titre)}</h3>
              <p className={`mt-3 leading-relaxed ${i === 1 ? 'text-white/75' : 'text-fi-text/75'}`}>{L(x.texte)}</p>
              <ul className={`mt-6 space-y-2.5 border-t pt-5 ${i === 1 ? 'border-white/10' : 'border-fi-light'}`}>
                {x.points.map((pt, k) => <li key={k} className="flex gap-2.5 text-sm"><Check size={16} className={`mt-0.5 shrink-0 ${i === 1 ? 'text-fi-accent' : 'text-fi-primary'}`} aria-hidden />{L(pt)}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Performance : « tableau de bord du sol » — jauge circulaire, carbone, et progression annuelle
// sous forme de tiges qui poussent (une feuille au sommet).
// ---------------------------------------------------------------------------
const RING = 2 * Math.PI * 52; // circonférence de la jauge (r = 52)

function Performance() {
  const { t } = useLang();
  const { chiffres: c } = useSite();
  const ref = useRef(null);
  useReveal([], ref);
  const pct = (a, b) => Math.min(100, Math.round((a / b) * 100));
  const goal = pct(c.projets, c.projetsObjectif);
  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    const ring = q('.gauge-ring')[0];
    if (prefersReducedMotion()) { gsap.set(q('[data-bar]'), { width: (i, el) => el.dataset.bar }); return; }
    gsap.fromTo(ring, { strokeDashoffset: RING }, { strokeDashoffset: RING * (1 - goal / 100), duration: 2, ease: 'power3.out', scrollTrigger: { trigger: ring, start: 'top 85%', once: true } });
    q('[data-bar]').forEach((b) => gsap.fromTo(b, { width: '0%' }, { width: b.dataset.bar, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 92%', once: true } }));
    gsap.from(q('.stem'), { scaleY: 0, duration: 1.4, ease: 'power3.out', stagger: 0.12, transformOrigin: '50% 100%', scrollTrigger: { trigger: q('.stems')[0], start: 'top 85%', once: true } });
    gsap.from(q('.stem-leaf'), { scale: 0, rotate: -40, duration: 0.7, ease: 'back.out(3)', stagger: 0.12, delay: 0.9, scrollTrigger: { trigger: q('.stems')[0], start: 'top 85%', once: true } });
  }, { scope: ref });

  return (
    <section ref={ref} className="section">
      <div className="wrap">
        <SectionHeader kicker={t('perf_kicker')} title={t('perf_titre')} />
        <div className="reveal relative mt-12 overflow-hidden rounded-[2rem] bg-fi-deep p-6 text-white md:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0"><div className="grain h-full" /></div>
          <div className="relative grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-white/10">
            {/* Objectifs */}
            <div className="lg:pr-10">
              <p className="kicker !text-fi-accent flex items-center gap-2"><Icon name="target" size="h-5 w-5" /> {t('perf_objectifs')}</p>
              <div className="mt-5 flex items-center gap-6">
                <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0 -rotate-90" aria-hidden>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="10" />
                  <circle className="gauge-ring" cx="60" cy="60" r="52" fill="none" stroke="rgb(var(--fi-accent))" strokeWidth="10" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - goal / 100)} />
                </svg>
                <p className="font-display text-5xl font-semibold"><Counter value={goal} suffix=" %" /></p>
              </div>
              <div className="mt-6 space-y-4">
                {[{ a: c.projets, b: c.projetsObjectif, l: t('perf_projets') }, { a: c.hectares, b: c.hectaresObjectif, l: t('perf_hectares') }].map((o) => (
                  <div key={o.l}>
                    <div className="flex justify-between text-sm"><span className="text-white/80">{o.l}</span><span className="tabular-nums text-white/60">{o.a} / {o.b}</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden"><div data-bar={`${pct(o.a, o.b)}%`} className="h-full rounded-full bg-gradient-to-r from-fi-secondary to-fi-accent" style={{ width: `${pct(o.a, o.b)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Carbone */}
            <div className="lg:px-10">
              <p className="kicker !text-fi-accent flex items-center gap-2"><Icon name="globe" size="h-5 w-5" /> {t('perf_carbone')}</p>
              <p className="mt-5 font-display text-6xl font-semibold"><Counter value={c.co2Tonnes} /> <span className="text-2xl text-white/60">t</span></p>
              <p className="text-sm text-white/65">{t('perf_tonnes')}</p>
              <p className="mt-5 text-sm text-white/80">≈ <strong className="text-fi-accent"><Counter value={c.arbresEquivalent} /></strong> {t('perf_arbres')}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {[{ v: c.formations, l: t('perf_formations') }, { v: c.partenaires, l: t('perf_partenaires') }, { v: c.arbresPlantes, l: t('perf_plantes') }].map((o) => (
                  <div key={o.l}><p className="font-display text-2xl font-semibold"><Counter value={o.v} /></p><p className="text-[11px] leading-tight text-white/55">{o.l}</p></div>
                ))}
              </div>
            </div>
            {/* Progression : tiges */}
            <div className="lg:pl-10">
              <p className="kicker !text-fi-accent flex items-center gap-2"><Icon name="growth" size="h-5 w-5" /> {t('perf_progression')}</p>
              <div className="stems mt-5 flex h-48 items-end justify-between gap-3 border-b border-white/15 pb-0">
                {c.progression.map((y) => (
                  <div key={y.annee} className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-semibold tabular-nums text-white/80">{y.pct} %</span>
                    <div className="relative flex w-full justify-center" style={{ height: `${y.pct}%` }}>
                      <svg className="stem-leaf absolute -top-3 left-1/2 h-5 w-8" viewBox="0 0 32 20" aria-hidden style={{ transformOrigin: '30% 100%' }}><path d="M16 18 C 10 8, 4 6, 0 6 C 4 14, 10 18, 16 18 Z M16 18 C 22 8, 28 4, 32 4 C 28 12, 22 18, 16 18 Z" fill="rgb(var(--fi-accent))" /></svg>
                      <span className="stem block h-full w-[3px] rounded-full bg-gradient-to-t from-fi-loam to-fi-accent" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between gap-3 text-xs tabular-nums text-white/50">{c.progression.map((y) => <span key={y.annee} className="flex-1 text-center">{y.annee}</span>)}</div>
              <p className="mt-5 text-sm text-white/60"><strong className="font-display text-2xl text-white">{c.annees}</strong> {t('perf_annees')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Partenaires : bandeau posé sur un plan incliné qui se redresse à l'arrivée.
// ---------------------------------------------------------------------------
function Partenaires() {
  const { t } = useLang();
  const ref = useRef(null);
  useReveal([], ref);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current.querySelector('.plane'), { rotationX: 32, rotationZ: -5, scale: 0.92, transformPerspective: 1100 }, { rotationX: 0, rotationZ: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'center 55%', scrub: 0.8 } });
  }, { scope: ref });
  return (
    <section ref={ref} className="section !pb-16 overflow-hidden">
      <div className="wrap"><SectionHeader align="center" kicker={t('partenaires_kicker')} title={t('partenaires_titre')} /></div>
      <div className="plane mt-10 [transform-style:preserve-3d]"><PartnersMarquee /></div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Petit Pois : au milieu des micro-organismes, suit le pointeur ; démonstration de conversation.
// ---------------------------------------------------------------------------
function PoisSection() {
  const { t } = useLang();
  const img = useImage();
  const ref = useRef(null);
  const micro = useRef(null);
  useReveal([], ref);
  // useEffect (après celui du canvas enfant) : l'API du canvas existe alors.
  useEffect(() => { micro.current?.set(0.75); }, []);
  useGSAP(() => {
    ScrollTrigger.create({ trigger: ref.current, start: 'top 60%', once: true, onEnter: () => teasePois(t('pois_bulle')) });
    if (prefersReducedMotion()) return undefined;
    const q = gsap.utils.selector(ref);
    gsap.from(q('.mascot'), { y: 60, rotate: -6, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true } });
    gsap.timeline({ scrollTrigger: { trigger: q('.chat')[0], start: 'top 80%', once: true } })
      .from(q('.msg-q'), { y: 20, opacity: 0, scale: 0.9, transformOrigin: '100% 100%', duration: 0.5, ease: 'back.out(2)' })
      .from(q('.msg-dots'), { opacity: 0, duration: 0.3 }, '+=0.2')
      .to(q('.msg-dots'), { opacity: 0, height: 0, marginTop: 0, padding: 0, duration: 0.3 }, '+=0.9')
      .from(q('.msg-r'), { y: 20, opacity: 0, scale: 0.9, transformOrigin: '0% 100%', duration: 0.5, ease: 'back.out(2)' });
    // Petit Pois suit le pointeur (souris) / flotte doucement (tactile)
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const m = q('.mascot')[0];
    if (fine) {
      const mx = gsap.quickTo(m, 'x', { duration: 0.8, ease: 'power3.out' }); const my = gsap.quickTo(m, 'y', { duration: 0.8, ease: 'power3.out' });
      const move = (e) => { const r = ref.current.getBoundingClientRect(); mx(((e.clientX - r.left) / r.width - 0.5) * 30); my(((e.clientY - r.top) / r.height - 0.5) * 24); };
      ref.current.addEventListener('pointermove', move);
      return () => ref.current?.removeEventListener('pointermove', move);
    }
    gsap.to(m, { y: -12, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    return undefined;
  }, { scope: ref });
  return (
    <section ref={ref} data-horizon="roche" className="section relative bg-fi-deep text-white overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-80"><MicroCanvas api={micro} /></div>
      <div aria-hidden className="pointer-events-none absolute inset-0"><div className="grain h-full" /></div>
      <div className="wrap relative grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5 flex justify-center">
          {/* Bulle de culture en verre : Petit Pois flotte au centre, des microbes gravitent autour */}
          <div className="pois-bubble group relative grid h-56 w-56 place-items-center rounded-full md:h-72 md:w-72">
            <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 via-white/[0.04] to-fi-accent/10 ring-1 ring-white/20 backdrop-blur-sm shadow-[inset_0_2px_30px_rgb(255_255_255/0.12),0_30px_80px_-30px_rgb(var(--fi-accent)/0.5)]" />
            <span aria-hidden className="absolute inset-[8%] rounded-full border border-dashed border-white/15 animate-[spin_30s_linear_infinite]" />
            <span aria-hidden className="pois-halo absolute inset-[22%] rounded-full bg-fi-accent/20 blur-2xl" />
            {[0, 1, 2].map((k) => (
              <span key={k} aria-hidden className="pois-orbit absolute inset-0" style={{ animationDuration: `${9 + k * 4}s`, animationDirection: k % 2 ? 'reverse' : 'normal', inset: `${k * 7}%` }}>
                <span className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-full ${k === 1 ? 'h-2.5 w-5 bg-fi-light' : 'h-3 w-3 bg-fi-accent'} shadow-[0_0_12px_rgb(var(--fi-accent))]`} />
              </span>
            ))}
            <span aria-hidden className="absolute left-[14%] top-[18%] h-6 w-12 -rotate-[30deg] rounded-full bg-white/25 blur-[2px]" />
            <img {...img('petit_pois')} alt="Petit Pois" width={320} height={320} loading="lazy" decoding="async" data-fx-off className="mascot relative w-28 md:w-40 drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          </div>
        </div>
        <div className="md:col-span-7">
          <SectionHeader dark kicker={t('pois_kicker')} title={t('pois_titre')} text={t('pois_texte')} />
          <div className="chat mt-8 max-w-md space-y-2.5" aria-hidden>
            <p className="msg-q ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-fi-accent px-4 py-2.5 text-sm text-fi-deep">{t('pois_quick_1')}</p>
            <p className="msg-dots w-fit rounded-2xl bg-white/10 px-4 py-3"><span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/70" /> <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/70" /> <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/70" /></p>
            <p className="msg-r w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm text-white/90 backdrop-blur">{t('pois_demo_r')}</p>
          </div>
          <button type="button" onClick={() => openPois()} className="mt-8 btn-accent">{t('pois_bouton')} <ArrowRight size={18} aria-hidden /></button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Blog : mise en page éditoriale — un article à la une, deux à côté.
// ---------------------------------------------------------------------------
function BlogTeaser() {
  const { t, p, L, lang } = useLang();
  const { listes } = useSite();
  const list = vis(listes.blog).slice(0, 3);
  const ref = useReveal([list.length]);
  if (!list.length) return null;
  return (
    <section ref={ref} className="section">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader kicker={t('nav_blog')} title={t('blog_titre')} />
          <Link to={p('/blog')} className="reveal btn-ghost">{t('nav_blog')} <ArrowRight size={16} aria-hidden /></Link>
        </div>
        <ul className="mt-10 grid gap-5 lg:grid-cols-2 lg:grid-rows-2">
          {list.map((b, i) => (
            <li key={b.id} className={`reveal card overflow-hidden group ${i === 0 ? 'lg:row-span-2' : ''}`}>
              <a href={b.lien} target="_blank" rel="noreferrer" className={`flex h-full ${i === 0 ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                <div className={`relative overflow-hidden ${i === 0 ? 'aspect-[16/10]' : 'aspect-[16/9] sm:aspect-auto sm:w-2/5 shrink-0'}`}>
                  {b.image ? <img src={imgSrc(b.image)} alt="" width={900} height={506} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" /> : <div className="relative flex h-full min-h-[12rem] items-center justify-center bg-gradient-to-br from-fi-mint to-[#f3ead9]"><Petri seed={b.id?.length || 7} className="w-1/2 max-w-[16rem]" icon={<Icon name="mic" className="h-full w-full items-center justify-center text-fi-dark" size="h-3/5 w-3/5" />} /></div>}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-fi-dark backdrop-blur">{L(b.categorie)}</span>
                </div>
                <div className={`flex flex-1 flex-col ${i === 0 ? 'p-6 md:p-8' : 'p-5'}`}>
                  <p className="text-xs font-semibold text-fi-primary">{fmtDate(b.date, lang)}</p>
                  <h3 className={`mt-2 font-display font-semibold text-fi-dark leading-snug ${i === 0 ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{L(b.titre)}</h3>
                  <p className={`mt-2 text-sm text-fi-text/70 ${i === 0 ? 'line-clamp-3' : 'line-clamp-2'}`}>{L(b.texte)}</p>
                  <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fi-primary transition-[gap] group-hover:gap-2.5">{t('decouvrir')} <ArrowUpRight size={16} aria-hidden /></span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, L } = useLang();
  const site = useSite();
  const scope = useRef(null);
  const faq = vis(site.listes.faq);
  return (
    <div ref={scope}>
      <SEO title={t('seo_titre_accueil')} description={t('seo_accueil')} path="/" jsonLd={[{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.slice(0, 6).map((f) => ({ '@type': 'Question', name: L(f.question), acceptedAnswer: { '@type': 'Answer', text: L(f.reponse) } })) }]} />
      <DepthRail scope={scope} />
      <Hero />
      <Services />
      <Process />
      <Realisations />
      <Pourquoi />
      <Performance />
      <Partenaires />
      <PoisSection />
      <BlogTeaser />
    </div>
  );
}
