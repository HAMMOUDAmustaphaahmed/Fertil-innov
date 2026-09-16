import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Check, Linkedin } from 'lucide-react';
import SEO from '../components/SEO';
import DepthRail from '../components/DepthRail';
import LivingSoil from '../components/LivingSoil';
import { SectionHeader, Counter, PartnersMarquee } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { openPois, teasePois } from '../lib/pois';

const vis = (list) => (list || []).filter((x) => x.visible !== false);
const fmtDate = (iso, lang) => new Intl.DateTimeFormat({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));

// ---------------------------------------------------------------------------
// Hero : image de laboratoire, titre, chiffres, Petit Pois qui apparaît.
// Une seule séquence orchestrée au chargement ; parallax douce au défilement.
// ---------------------------------------------------------------------------
function Hero() {
  const { t, p } = useLang();
  const img = useImage();
  const ref = useRef(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(ref);
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from(q('.h-line'), { yPercent: 110, opacity: 0, duration: 1, stagger: 0.09 }, 0.1)
      .from(q('.h-sub, .h-cta'), { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.5)
      .from(q('.h-stat'), { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.8)
      .from(q('.h-pois'), { x: 60, opacity: 0, duration: 0.9 }, 0.7);
    gsap.to(q('.h-bg'), { yPercent: 18, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(q('.h-content'), { yPercent: -8, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: ref.current, start: '40% top', end: 'bottom top', scrub: true } });
  }, { scope: ref });

  const title = t('hero_titre');
  const [l1, l2] = title.includes(',') ? [title.split(',')[0] + ',', title.split(',').slice(1).join(',').trim()] : [title, ''];

  return (
    <section ref={ref} data-horizon="surface" className="relative min-h-[100svh] flex items-end bg-fi-deep text-white overflow-hidden grain">
      <img {...img('hero')} alt="" aria-hidden width={1800} height={1005} fetchpriority="high" className="h-bg absolute inset-0 h-[115%] w-full object-cover object-center opacity-70" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-fi-deep via-fi-deep/55 to-fi-deep/20" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-fi-bg to-transparent z-[1]" />

      <div className="h-content wrap relative pb-24 pt-32 md:pb-36 md:pt-40 md:pr-[min(40vw,460px)]">
        <p className="h-sub text-sm md:text-base font-medium text-fi-accent">{t('hero_kicker')}</p>
        <h1 className="mt-4 text-display-xl !text-white max-w-4xl">
          <span className="block overflow-hidden"><span className="h-line block">{l1}</span></span>
          {l2 && <span className="block overflow-hidden"><span className="h-line block text-fi-accent">{l2}</span></span>}
        </h1>
        <p className="h-sub mt-6 max-w-xl text-lg text-white/80 leading-relaxed">{t('hero_sous_titre')}</p>
        <div className="h-cta mt-8 flex flex-wrap gap-3">
          <Link to={p('/contact')} state={{ subject: 'devis', service: 'diagnostics' }} className="btn-accent">{t('hero_bouton_1')} <ArrowRight size={18} aria-hidden /></Link>
          <button type="button" onClick={() => openPois()} className="btn-light">{t('hero_bouton_2')}</button>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
          {['hero_stat_1', 'hero_stat_2', 'hero_stat_3'].map((k) => <li key={k} className="h-stat flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fi-accent" aria-hidden />{t(k)}</li>)}
        </ul>
        <a href="#services" className="h-stat mt-10 hidden md:inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">{t('hero_scroll')} <ArrowDown size={14} className="animate-bounce" aria-hidden /></a>
      </div>

      {/* Sol vivant animé : pousse, racines, réseau mycorhizien, nutriments */}
      <div className="h-pois absolute right-[max(1rem,calc((100vw-76rem)/2))] bottom-16 md:bottom-24 hidden md:block w-[min(38vw,440px)] pointer-events-none">
        <LivingSoil className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.45)]" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Services : 5 services + formations. Grille asymétrique, la première carte plus large.
// ---------------------------------------------------------------------------
function Services() {
  const { t, p, L } = useLang();
  const { listes } = useSite();
  const services = vis(listes.services);
  const ref = useReveal([services.length]);
  return (
    <section ref={ref} id="services" data-horizon="rhizo" className="section relative">
      <div className="wrap">
        <SectionHeader kicker={t('services_kicker')} title={t('services_titre')} text={t('services_texte')} />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link key={s.id} to={`${p('/services')}#${s.id}`} className={`reveal card group p-6 md:p-7 flex flex-col hover:-translate-y-1 hover:shadow-leaf transition-[transform,box-shadow] duration-300 ${i === 0 ? 'lg:col-span-2 lg:flex-row lg:items-center lg:gap-8 bg-fi-mint/60' : ''}`}>
              <img src={`/images/${s.icone}`} alt="" aria-hidden width={72} height={72} loading="lazy" className={`h-16 w-16 object-contain ${i === 0 ? 'lg:h-28 lg:w-28 shrink-0' : ''}`} />
              <div className={i === 0 ? 'mt-5 lg:mt-0' : 'mt-5'}>
                <h3 className="text-display-sm">{L(s.titre)}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-fi-text/75">{L(s.resume)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fi-primary group-hover:gap-2.5 transition-[gap]">{t('decouvrir')} <ArrowRight size={16} aria-hidden /></span>
              </div>
            </Link>
          ))}
          <Link to={p("/formations")} className="reveal card group p-6 md:p-7 flex flex-col lg:col-span-2 lg:flex-row lg:items-center lg:gap-8 bg-fi-deep text-white border-none hover:-translate-y-1 transition-transform duration-300">
            <span aria-hidden className="h-16 w-16 lg:h-24 lg:w-24 shrink-0 bg-fi-accent" style={{ WebkitMaskImage: 'url(/images/formation.svg)', maskImage: 'url(/images/formation.svg)', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' }} />
            <div className="mt-5 lg:mt-0"><h3 className="text-display-sm !text-white">{t('nav_formations')}</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-white/75">{t('formations_texte')} 98 % {t('formations_satisfaction')}.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fi-accent group-hover:gap-2.5 transition-[gap]">{t('decouvrir')} <ArrowRight size={16} aria-hidden /></span></div>
          </Link>
        </div>
        <div className="reveal mt-8"><Link to={p('/services')} className="btn-ghost">{t('services_lien')}</Link></div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Processus (4 étapes = une séquence, donc numérotée) sur la coupe de sol.
// Une racine SVG se dessine en suivant le défilement.
// ---------------------------------------------------------------------------
function Process() {
  const { t, L, p } = useLang();
  const { processus, chiffres } = useSite();
  const img = useImage();
  const ref = useRef(null);
  useReveal([], ref);
  useGSAP(() => {
    const path = ref.current?.querySelector('.root-path');
    if (!path) return;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    if (prefersReducedMotion()) { gsap.set(path, { strokeDashoffset: 0 }); return; }
    gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: ref.current.querySelector('.steps'), start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } });
    const steps = ref.current.querySelectorAll('.step');
    gsap.set(steps, { opacity: 0.35, x: -8 });
    steps.forEach((el) => gsap.to(el, { opacity: 1, x: 0, duration: 0.5, scrollTrigger: { trigger: el, start: 'top 65%', toggleActions: 'play none none none' } }));
  }, { scope: ref });

  return (
    <section ref={ref} data-horizon="a" className="section bg-fi-mint/50 horizons">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <SectionHeader kicker={t('pourquoi_kicker')} title={t('processus_titre')} text={t('processus_texte')} />
          <div className="mt-8 overflow-hidden rounded-3xl shadow-leaf">
            <img {...img('sol_profil')} alt="" width={1600} height={900} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={p('/services')} className="btn-primary">{t('pourquoi_bouton_1')}</Link>
            <Link to={p('/contact')} state={{ subject: 'devis' }} className="btn-ghost">{t('pourquoi_bouton_2')}</Link>
          </div>
        </div>
        <div className="steps relative lg:col-span-7 lg:pl-10">
          <svg aria-hidden className="absolute left-[19px] top-4 bottom-4 hidden lg:block" width="24" viewBox="0 0 24 1000" preserveAspectRatio="none" style={{ height: 'calc(100% - 2rem)' }}>
            <path className="root-path" d="M12 0 C 12 120, 4 180, 12 260 S 20 420, 12 520 S 4 700, 12 800 S 18 940, 12 1000" fill="none" stroke="rgb(var(--fi-soil))" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <ol className="space-y-6">
            {processus.map((s, i) => (
              <li key={s.id} className="step relative flex gap-5 lg:gap-7">
                <span className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fi-deep font-display text-lg font-semibold text-fi-accent ring-4 ring-fi-mint">{String(i + 1).padStart(2, '0')}</span>
                <div className="card flex-1 p-5 md:p-6">
                  <div className="flex items-center gap-3"><span className="text-2xl" aria-hidden>{s.emoji}</span><h3 className="text-display-sm">{L(s.titre)}</h3></div>
                  <p className="mt-2 text-fi-text/75 leading-relaxed">{L(s.texte)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 pl-[68px] lg:pl-[76px] text-sm text-fi-text/60">{chiffres.annees} {t('perf_annees')}.</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Réalisations : bande horizontale pilotée par le défilement (sticky, jamais pin) + compteurs.
// ---------------------------------------------------------------------------
function Realisations() {
  const { t, L } = useLang();
  const { listes, chiffres } = useSite();
  const list = vis(listes.realisations);
  const ref = useRef(null);
  useReveal([list.length], ref);
  useGSAP(() => {
    const track = ref.current?.querySelector('.track');
    if (!track || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const zone = ref.current.querySelector('.sticky-zone');
      const dist = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      // La zone collante doit mesurer 100vh + distance horizontale pour que le défilement vertical « pousse » la bande.
      const size = () => zone.style.setProperty('--track-extra', `${dist()}px`);
      size();
      ScrollTrigger.addEventListener('refreshInit', size);
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: zone, start: 'top top', end: () => `+=${dist()}`, scrub: 0.8, invalidateOnRefresh: true } });
      return () => { ScrollTrigger.removeEventListener('refreshInit', size); zone.style.removeProperty('--track-extra'); };
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [list.length] });

  const counters = [
    { v: chiffres.projets, suffix: '', k: 'compteur_projets' },
    { v: chiffres.hectares, suffix: ' ha', k: 'compteur_ha' },
    { v: chiffres.satisfaction, suffix: ' %', k: 'compteur_satisfaction' },
    { v: chiffres.annees, suffix: '', k: 'compteur_annees' },
  ];

  return (
    <section ref={ref} id="realisations" data-horizon="b" className="relative bg-fi-deep text-white grain">
      <div className="sticky-zone lg:h-[calc(100vh+var(--track-extra,0px))]">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center py-20 lg:py-0 overflow-hidden">
          <div className="wrap">
            <SectionHeader dark kicker={t('realisations_kicker')} title={t('realisations_titre')} text={t('realisations_texte')} />
          </div>
          <div className="mt-10 lg:mt-12 overflow-x-auto lg:overflow-visible px-4 sm:px-6 lg:px-8 pb-4 lg:pb-0 [scrollbar-width:none]">
            <div className="track flex gap-5 w-max lg:pl-[max(0px,calc((100vw-76rem)/2))]">
              {list.map((r) => (
                <article key={r.id} className="relative w-[78vw] max-w-[420px] sm:w-[360px] shrink-0 overflow-hidden rounded-3xl bg-white/5">
                  <img src={imgSrc(r.image)} alt={L(r.titre)} width={800} height={600} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fi-deep via-fi-deep/70 to-transparent p-5 pt-16">
                    <p className="text-xs font-semibold text-fi-accent">{L(r.categorie)}</p>
                    <h3 className="mt-1 text-display-sm !text-white">{L(r.titre)}</h3>
                    <p className="text-sm text-white/70">{r.lieu}</p>
                  </div>
                </article>
              ))}
              <div className="w-[calc((100vw-76rem)/2)] shrink-0 hidden lg:block" aria-hidden />
            </div>
          </div>
        </div>
      </div>
      <div className="wrap pb-20">
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4 border-t border-white/10 pt-10">
          {counters.map((c) => (
            <div key={c.k}>
              <dd className="font-display text-4xl md:text-5xl font-semibold text-white"><Counter value={c.v} suffix={c.suffix} /></dd>
              <dt className="mt-1 text-sm text-white/65">{t(c.k)}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pourquoi nous : trois arguments, chacun avec ses preuves.
// ---------------------------------------------------------------------------
function Pourquoi() {
  const { t, L } = useLang();
  const { listes } = useSite();
  const list = vis(listes.pourquoi);
  const ref = useReveal([list.length]);
  return (
    <section ref={ref} className="section">
      <div className="wrap">
        <SectionHeader kicker={t('pourquoi_kicker')} title={t('pourquoi_titre')} text={t('pourquoi_texte')} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {list.map((x) => (
            <article key={x.id} className="reveal card p-6 md:p-7">
              <span className="text-3xl" aria-hidden>{x.emoji}</span>
              <h3 className="mt-4 text-display-sm">{L(x.titre)}</h3>
              <p className="mt-2 text-fi-text/75 leading-relaxed">{L(x.texte)}</p>
              <ul className="mt-5 space-y-2 border-t border-fi-light pt-4">
                {x.points.map((pt, i) => <li key={i} className="flex gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-fi-primary" aria-hidden />{L(pt)}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Performance & impact : objectifs 2026, carbone, progression annuelle.
// ---------------------------------------------------------------------------
function Performance() {
  const { t } = useLang();
  const { chiffres: c } = useSite();
  const ref = useRef(null);
  useReveal([], ref);
  useGSAP(() => {
    const bars = ref.current?.querySelectorAll('[data-bar]');
    if (!bars?.length) return;
    bars.forEach((b) => {
      const target = b.dataset.bar;
      if (prefersReducedMotion()) { gsap.set(b, { width: target }); return; }
      gsap.fromTo(b, { width: '0%' }, { width: target, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 90%', once: true } });
    });
  }, { scope: ref });
  const pct = (a, b) => Math.min(100, Math.round((a / b) * 100));
  return (
    <section ref={ref} className="section bg-fi-mint/50">
      <div className="wrap">
        <SectionHeader kicker={t('perf_kicker')} title={t('perf_titre')} />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <div className="card p-6 md:p-7">
            <p className="kicker">🎯 {t('perf_objectifs')}</p>
            <p className="mt-3 font-display text-5xl font-semibold text-fi-dark"><Counter value={pct(c.projets, c.projetsObjectif)} suffix=" %" /></p>
            <div className="mt-6 space-y-4">
              {[{ a: c.projets, b: c.projetsObjectif, l: t('perf_projets') }, { a: c.hectares, b: c.hectaresObjectif, l: t('perf_hectares') }].map((o) => (
                <div key={o.l}>
                  <div className="flex justify-between text-sm"><span>{o.l}</span><span className="tabular-nums text-fi-text/70">{o.a} / {o.b}</span></div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-fi-light overflow-hidden"><div data-bar={`${pct(o.a, o.b)}%`} className="h-full rounded-full bg-fi-primary" style={{ width: `${pct(o.a, o.b)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 md:p-7 bg-fi-deep text-white border-none grain">
            <p className="kicker !text-fi-accent">🌍 {t('perf_carbone')}</p>
            <p className="mt-3 font-display text-5xl font-semibold"><Counter value={c.co2Tonnes} /> <span className="text-2xl text-white/70">t</span></p>
            <p className="text-sm text-white/70">{t('perf_tonnes')}</p>
            <p className="mt-6 text-sm text-white/80">≈ <strong className="text-fi-accent"><Counter value={c.arbresEquivalent} /></strong> {t('perf_arbres')}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              {[{ v: c.formations, l: t('perf_formations') }, { v: c.partenaires, l: t('perf_partenaires') }, { v: c.arbresPlantes, l: t('perf_plantes') }].map((o) => (
                <div key={o.l}><p className="font-display text-2xl font-semibold"><Counter value={o.v} /></p><p className="text-[11px] text-white/60 leading-tight">{o.l}</p></div>
              ))}
            </div>
          </div>
          <div className="card p-6 md:p-7">
            <p className="kicker">📈 {t('perf_progression')}</p>
            <ul className="mt-5 space-y-3">
              {c.progression.map((y) => (
                <li key={y.annee} className="flex items-center gap-3 text-sm">
                  <span className="w-10 tabular-nums text-fi-text/70">{y.annee}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-fi-light overflow-hidden"><div data-bar={`${y.pct}%`} className="h-full rounded-full bg-fi-secondary" style={{ width: `${y.pct}%` }} /></div>
                  <span className="w-10 text-right tabular-nums font-semibold text-fi-dark">{y.pct} %</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-fi-text/60"><strong className="font-display text-2xl text-fi-dark">{c.annees}</strong> {t('perf_annees')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Partenaires() {
  const { t } = useLang();
  const ref = useReveal();
  return (
    <section ref={ref} className="section !pb-16">
      <div className="wrap"><SectionHeader align="center" kicker={t('partenaires_kicker')} title={t('partenaires_titre')} /></div>
      <div className="mt-10"><PartnersMarquee /></div>
    </section>
  );
}

function Equipe() {
  const { t, L } = useLang();
  const { listes, entreprise } = useSite();
  const list = vis(listes.equipe);
  const ref = useReveal([list.length]);
  return (
    <section ref={ref} data-horizon="roche" className="section">
      <div className="wrap">
        <SectionHeader kicker={t('equipe_kicker')} title={t('equipe_titre')} />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 2xl:grid-cols-4 max-w-4xl 2xl:max-w-none">
          {list.map((m) => (
            <li key={m.id} className="reveal card overflow-hidden group">
              <div className="aspect-[4/4.2] overflow-hidden bg-fi-mint">
                <img src={imgSrc(m.image)} alt={m.nom} width={600} height={690} loading="lazy" className="h-full w-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-fi-dark">{m.nom}</h3>
                <p className="text-sm font-medium text-fi-primary">{L(m.role)}</p>
                <p className="mt-2 text-sm text-fi-text/70 leading-relaxed">{L(m.texte)}</p>
                <a href={entreprise.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn — ${m.nom}`} className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-fi-mint text-fi-dark hover:bg-fi-primary hover:text-white transition-colors"><Linkedin size={16} /></a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PoisSection() {
  const { t } = useLang();
  const img = useImage();
  const ref = useRef(null);
  useReveal([], ref);
  useGSAP(() => {
    ScrollTrigger.create({ trigger: ref.current, start: 'top 60%', once: true, onEnter: () => teasePois(t('pois_bulle')) });
    if (prefersReducedMotion()) return;
    gsap.from(ref.current.querySelector('.mascot'), { y: 40, rotate: -4, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true } });
  }, { scope: ref });
  return (
    <section ref={ref} className="section bg-fi-deep text-white grain overflow-hidden">
      <div className="wrap grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-4 flex justify-center">
          <img {...img('petit_pois')} alt="Petit Pois" width={320} height={320} loading="lazy" className="mascot w-56 md:w-72 drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="md:col-span-8">
          <SectionHeader dark kicker={t('pois_kicker')} title={t('pois_titre')} text={t('pois_texte')} />
          <button type="button" onClick={() => openPois()} className="mt-8 btn-accent">{t('pois_bouton')} <ArrowRight size={18} aria-hidden /></button>
        </div>
      </div>
    </section>
  );
}

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
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {list.map((b) => (
            <li key={b.id} className="reveal card overflow-hidden group">
              <a href={b.lien} target="_blank" rel="noreferrer" className="block">
                {b.image ? <img src={imgSrc(b.image)} alt="" width={900} height={506} loading="lazy" className="aspect-[16/9] w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" /> : <div className="aspect-[16/9] bg-fi-mint flex items-center justify-center text-4xl">🎙️</div>}
                <div className="p-5">
                  <p className="text-xs font-semibold text-fi-primary">{L(b.categorie)} · {fmtDate(b.date, lang)}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-fi-dark leading-snug">{L(b.titre)}</h3>
                  <p className="mt-2 text-sm text-fi-text/70 line-clamp-2">{L(b.texte)}</p>
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
  const { t } = useLang();
  const site = useSite();
  const scope = useRef(null);
  const faq = vis(site.listes.faq);
  return (
    <div ref={scope}>
      <SEO title={t('seo_titre_accueil')} description={t('seo_accueil')} path="/" jsonLd={[{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.slice(0, 6).map((f) => ({ '@type': 'Question', name: f.question?.fr, acceptedAnswer: { '@type': 'Answer', text: f.reponse?.fr } })) }]} />
      <DepthRail scope={scope} />
      <Hero />
      <Services />
      <Process />
      <Realisations />
      <Pourquoi />
      <Performance />
      <Partenaires />
      <Equipe />
      <PoisSection />
      <BlogTeaser />
    </div>
  );
}
