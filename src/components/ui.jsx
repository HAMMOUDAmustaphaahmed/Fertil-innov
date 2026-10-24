// Petits composants partagés : en-têtes de section, compteurs animés, bandeau
// partenaires, en-tête des pages intérieures, pastille ouvert/fermé.
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { isOpenNow } from '../data/infos';
import MicroCanvas from './MicroCanvas';
import HeroArt from './HeroArt';

export function SectionHeader({ kicker, title, text, align = 'left', dark = false, className = '' }) {
  return (
    <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
      {kicker && <p className={`reveal kicker ${dark ? '!text-fi-accent' : ''}`}>{kicker}</p>}
      <h2 className={`reveal mt-2 text-display-md ${dark ? '!text-white' : ''}`}>{title}</h2>
      {text && <p className={`reveal mt-4 text-[1.05rem] leading-relaxed ${dark ? 'text-white/75' : 'text-fi-text/75'}`}>{text}</p>}
    </div>
  );
}

/** Nombre qui s'anime de 0 à `value` quand il entre dans l'écran. */
export function Counter({ value, prefix = '', suffix = '', className = '', decimals = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);
  useGSAP(() => {
    if (prefersReducedMotion() || !ref.current) return;
    const obj = { n: 0 };
    setShown(0);
    gsap.to(obj, {
      n: value, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
      onUpdate: () => setShown(Number(obj.n.toFixed(decimals))),
    });
  }, { dependencies: [value] });
  const fmt = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
  return <span ref={ref} className={`tabular-nums ${className}`}>{prefix}{fmt(shown)}{suffix}</span>;
}

/** Bandeau de logos partenaires, deux rangées en sens opposés (CSS pur). */
export function PartnersMarquee() {
  const { listes } = useSite();
  const list = listes.partenaires.filter((p) => p.visible !== false);
  if (!list.length) return null;
  const half = Math.ceil(list.length / 2);
  const rows = [list.slice(0, half), list.slice(half)];
  return (
    <div className="space-y-4">
      {rows.map((row, r) => (
        <div key={r} className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className={`marquee-track gap-4 ${r ? 'reverse' : ''}`} style={{ "--marquee-duration": `${Math.max(40, row.length * 5)}s` }}>
            {[...row, ...row].map((p, i) => (
              <div key={`${p.id}-${i}`} className="flex h-28 w-52 sm:h-32 sm:w-60 shrink-0 items-center justify-center rounded-2xl bg-white border border-fi-light/70 px-6" aria-hidden={i >= row.length}>
                <img src={imgSrc(p.image)} alt={p.nom} width={200} height={90} loading="lazy" decoding="async" className="max-h-20 sm:max-h-24 w-auto max-w-full object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** En-tête des pages intérieures : même univers que l'accueil — sol vivant (microbes en canvas),
 *  bague d'oculaire qui tourne au défilement, image en Ken Burns + parallaxe, titre en rideau. */
export function PageHero({ title, text, children, image, kicker, variant }) {
  const ref = useRef(null);
  const micro = useRef(null);
  useEffect(() => { micro.current?.set(0.7); });
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(ref);
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(q('.ph-title'), { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 25 }, { clipPath: 'inset(-20% -5% -25% -5%)', yPercent: 0, duration: 1.3, clearProps: 'clipPath' }, 0.1)
      .from(q('.ph-up'), { y: 26, opacity: 0, duration: 1, stagger: 0.08 }, 0.35)
      .from(q('.ph-ring'), { scale: 0.6, opacity: 0, rotate: -40, duration: 1.8 }, 0);
    const st = { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true };
    if (q('.ph-img').length) {
      gsap.fromTo(q('.ph-img'), { scale: 1.25 }, { scale: 1.08, duration: 2.4, ease: 'power2.out' });
      gsap.to(q('.ph-img'), { yPercent: 14, ease: 'none', scrollTrigger: st });
    }
    gsap.to(q('.ph-ring'), { rotate: 120, ease: 'none', scrollTrigger: st });
    gsap.to(q('.ph-art'), { yPercent: 12, ease: 'none', scrollTrigger: { ...st, onUpdate: (self) => ref.current?.style.setProperty('--ph-p', self.progress.toFixed(3)) } });
    gsap.to(q('.ph-content'), { y: -60, opacity: 0.15, ease: 'none', scrollTrigger: { ...st, start: '30% top' } });
  }, { scope: ref });
  return (
    <section ref={ref} className="hero-page relative bg-fi-deep text-white overflow-hidden pt-[calc(var(--header-h)+4rem)] pb-16 md:pb-24 min-h-[62svh] md:min-h-[70svh] flex items-end">
      {image && <img src={image} alt="" aria-hidden className="ph-img absolute inset-0 h-full w-full object-cover opacity-30 will-change-transform" loading="eager" fetchpriority="high" />}
      {!variant && <div aria-hidden className="absolute inset-0 opacity-70"><MicroCanvas api={micro} /></div>}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-fi-deep via-fi-deep/70 to-fi-deep/30" />
      {variant && <HeroArt variant={variant} />}
      {!variant && <svg aria-hidden className="ph-ring absolute -right-[18vmin] top-1/2 h-[90vmin] w-[90vmin] -translate-y-1/2 text-fi-accent/25 md:-right-[10vmin]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="98" strokeWidth="0.4" />
        <circle cx="100" cy="100" r="90" strokeWidth="5" strokeDasharray="0.6 4.1" className="text-white/20" stroke="currentColor" />
        <circle cx="100" cy="100" r="70" strokeWidth="0.3" strokeDasharray="2 3" />
        <path d="M100 0v14M100 186v14M0 100h14M186 100h14" strokeWidth="0.5" />
      </svg>}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]"><div className="grain h-full" /></div>
      <div className="ph-content wrap relative z-[2]">
        {kicker && <p className="ph-up mb-4 text-sm font-medium text-fi-accent">{kicker}</p>}
        <h1 className="ph-title text-display-lg !text-white max-w-3xl">{title}</h1>
        {text && <p className="ph-up mt-5 max-w-2xl text-lg text-white/80 leading-relaxed">{text}</p>}
        {children && <div className="ph-up">{children}</div>}
      </div>
    </section>
  );
}

/** Pastille de statut ouvert/fermé (calculée à l'heure de Paris, côté client uniquement). */
export function StatusDot({ className = '' }) {
  const { t } = useLang();
  const { horaires } = useSite();
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow(new Date(), horaires));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [horaires]);
  if (open === null) return null;
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${className}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${open ? 'bg-fi-accent shadow-[0_0_0_4px_rgb(139_195_74/0.25)]' : 'bg-fi-loam'}`} aria-hidden />
      {open ? t('ouvert') : t('ferme')}
    </span>
  );
}
