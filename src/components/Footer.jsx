// Pied de page : grand appel à l'action, racines qui poussent dans le sol à l'arrivée,
// filigrane de la marque qui glisse au défilement, puis les colonnes d'informations.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { openPois } from '../lib/pois';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { horairesAffichage } from '../data/infos';
import { getLenis } from '../hooks/useSmoothScroll';

export default function Footer() {
  const { t, p, L, lang, path } = useLang();
  const site = useSite();
  const img = useImage();
  const e = site.entreprise;
  const services = site.listes.services.filter((s) => s.visible !== false);
  const toTop = () => { const l = getLenis(); if (l) l.scrollTo(0); else window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const ref = useRef(null);
  const onContact = path.replace(/\/$/, '') === '/contact';
  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    const roots = q('.f-root');
    roots.forEach((r) => { r.style.strokeDasharray = '1'; r.style.strokeDashoffset = prefersReducedMotion() ? '0' : '1'; });
    if (prefersReducedMotion()) return;
    gsap.to(roots, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.out', stagger: 0.12, scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } });
    gsap.fromTo(q('.f-cta-title'), { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 30 }, { clipPath: 'inset(-20% -5% -25% -5%)', yPercent: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } });
    gsap.fromTo(q('.f-mark'), { xPercent: 12 }, { xPercent: -12, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }, { scope: ref });

  return (
    <footer ref={ref} className="relative mt-8 overflow-hidden bg-fi-deep text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0"><div className="grain h-full" /></div>
      {/* Racines qui descendent depuis la surface (haut du pied de page) */}
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 w-full text-fi-loam/50" viewBox="0 0 1440 260" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeLinecap="round">
        <path className="f-root" pathLength="1" strokeWidth="3" d="M180 0 C 190 60, 150 100, 170 160 S 220 230, 200 260" />
        <path className="f-root" pathLength="1" strokeWidth="1.5" d="M172 90 C 140 110, 110 120, 80 160" />
        <path className="f-root" pathLength="1" strokeWidth="3" d="M720 0 C 700 50, 760 90, 730 150 S 690 220, 720 260" />
        <path className="f-root" pathLength="1" strokeWidth="1.5" d="M735 70 C 780 90, 820 100, 860 140" />
        <path className="f-root" pathLength="1" strokeWidth="1.5" d="M725 140 C 690 160, 650 170, 610 210" />
        <path className="f-root" pathLength="1" strokeWidth="2.5" d="M1260 0 C 1280 70, 1230 110, 1250 170 S 1300 220, 1280 260" />
        <path className="f-root" pathLength="1" strokeWidth="1.5" d="M1255 110 C 1300 120, 1340 140, 1380 180" />
      </svg>

      {/* Appel à l'action (sauf sur la page Contact, qui est déjà le formulaire) */}
      {!onContact && <div className="wrap relative pt-24 pb-16 md:pt-32 md:pb-20 text-center">
        <p className="text-sm font-medium text-fi-accent">{t('footer_cta_kicker')}</p>
        <h2 className="f-cta-title mx-auto mt-4 max-w-4xl font-display text-[clamp(2.6rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-tight !text-white">{t('footer_cta_titre')}</h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">{t('footer_cta_texte')}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to={p('/contact')} state={{ subject: 'devis' }} className="btn-accent">{t('nav_bouton')} <ArrowUpRight size={18} aria-hidden /></Link>
          <button type="button" onClick={() => openPois()} className="btn-light">{t('hero_bouton_2')}</button>
        </div>
      </div>}

      <div className={`wrap relative pb-10 ${!onContact ? 'pt-12 border-t border-white/10' : 'pt-48'}`}>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <img {...img('logo_rond')} alt={site.nom} width={112} height={112} className="h-24 w-24 rounded-full bg-white p-1 object-contain" loading="lazy" decoding="async" />
            <p className="mt-5 max-w-md text-white/75 leading-relaxed">{t('footer_description')}</p>
            <p className="mt-4 text-sm text-fi-accent/90">{t('footer_certifs')}</p>
            <div className="mt-5 flex items-center gap-3">
              <a href={e.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Linkedin size={18} /></a>
              <a href={`tel:${e.telephone.replace(/\s/g, '')}`} aria-label={t('contact_tel_titre')} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Phone size={18} /></a>
              <a href={`mailto:${e.email}`} aria-label={t('contact_email_titre')} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Mail size={18} /></a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-white text-base font-semibold mb-4">{t('footer_services')}</h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              {services.map((s) => <li key={s.id}><Link to={`${p('/services')}#${s.id}`} className="hover:text-fi-accent transition-colors">{L(s.titre)}</Link></li>)}
              <li><Link to={p('/formations')} className="hover:text-fi-accent transition-colors">{t('nav_formations')}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-white text-base font-semibold mb-4">{t('footer_entreprise')}</h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to={`${p('/')}#realisations`} className="hover:text-fi-accent transition-colors">{t('footer_realisations')}</Link></li>
              <li><Link to={p('/activites')} className="hover:text-fi-accent transition-colors">{t('footer_rd')}</Link></li>
              <li><Link to={p('/expertise')} className="hover:text-fi-accent transition-colors">{t('nav_expertise')}</Link></li>
              <li><Link to={p('/equipe')} className="hover:text-fi-accent transition-colors">{t('nav_equipe')}</Link></li>
              <li><Link to={p('/chiffres')} className="hover:text-fi-accent transition-colors">{t('nav_chiffres')}</Link></li>
              <li><Link to={p('/blog')} className="hover:text-fi-accent transition-colors">{t('nav_blog')}</Link></li>
              <li><Link to={`${p('/faq')}#guide`} className="hover:text-fi-accent transition-colors">{t('nav_guide')}</Link></li>
              <li><Link to={p('/faq')} className="hover:text-fi-accent transition-colors">{t('nav_faq')}</Link></li>
              <li><Link to={p('/contact')} className="hover:text-fi-accent transition-colors">{t('nav_contact')}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-display text-white text-base font-semibold mb-4">{t('nav_contact')}</h3>
            <address className="not-italic text-sm text-white/75 space-y-2.5">
              <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-fi-accent" aria-hidden /><span>{e.adresse}<br />{e.codePostal} {e.ville}, {e.pays}</span></p>
              <p className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-fi-accent" aria-hidden /><span><a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="hover:text-fi-accent">{e.telephone}</a><br /><a href={`tel:${e.mobile.replace(/\s/g, '')}`} className="hover:text-fi-accent">{e.mobile}</a></span></p>
              <p className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-fi-accent" aria-hidden /><a href={`mailto:${e.email}`} className="hover:text-fi-accent break-all">{e.email}</a></p>
              <p className="pt-1 text-white/60">{horairesAffichage(site.horaires, lang).map((h) => `${h.jour} ${h.heures}`).join(' · ')}</p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/55">
          <p>© {new Date().getFullYear()} {site.nom}. {t('footer_droits')}</p>
          <button type="button" onClick={toTop} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 hover:bg-white/10 transition-colors min-h-[40px]">{t('footer_haut')} <ArrowUp size={14} aria-hidden /></button>
        </div>
      </div>
      {/* Filigrane de la marque */}
      <p aria-hidden className="f-mark pointer-events-none select-none whitespace-nowrap text-center font-display text-[11vw] font-bold leading-[0.85] tracking-tighter text-white/[0.05] pb-4">Fertil’Innov</p>
    </footer>
  );
}
