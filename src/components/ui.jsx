// Petits composants partagés : en-têtes de section, compteurs animés, bandeau
// partenaires, en-tête des pages intérieures, pastille ouvert/fermé.
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { isOpenNow } from '../data/infos';

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
          <div className={`marquee-track gap-4 ${r ? 'reverse' : ''}`} style={{ '--marquee-duration': `${Math.max(30, row.length * 4)}s` }}>
            {[...row, ...row].map((p, i) => (
              <div key={`${p.id}-${i}`} className="flex h-20 w-40 shrink-0 items-center justify-center rounded-2xl bg-white border border-fi-light/70 px-4" aria-hidden={i >= row.length}>
                <img src={imgSrc(p.image)} alt={p.nom} width={128} height={56} loading="lazy" className="max-h-12 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** En-tête des pages intérieures : bandeau sombre, titre, intro. */
export function PageHero({ title, text, children, image }) {
  return (
    <section className="relative bg-fi-deep text-white grain overflow-hidden pt-[calc(var(--header-h)+3.5rem)] pb-16 md:pb-20">
      {image && <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" loading="eager" fetchpriority="high" />}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-fi-deep via-fi-deep/70 to-fi-deep/40" />
      <div className="wrap relative">
        <h1 className="text-display-lg !text-white max-w-3xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-lg text-white/80 leading-relaxed">{text}</p>}
        {children}
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
