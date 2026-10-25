// Pied de page : dégradé vert foncé → vert clair avec courbes de niveau, colonnes d'informations, herbe
// au-dessus de la ligne du copyright. La description commence par la marque taillée dans un profil de sol :
// des pousses sortent des lettres, une lampe (souris, ou balayage automatique sur mobile) éclaire le sol dedans.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { horairesAffichage } from '../data/infos';
import { getLenis } from '../hooks/useSmoothScroll';

const MARK = 'Fertil’Innov';
const SPROUT_ON = [0, 3, 5, 7]; // lettres hautes : F, t, l, I

export default function Footer() {
  const { t, p, L, lang, path } = useLang();
  const site = useSite();
  const img = useImage();
  const e = site.entreprise;
  const services = site.listes.services.filter((s) => s.visible !== false);
  const toTop = () => { const l = getLenis(); if (l) l.scrollTo(0); else window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const ref = useRef(null);
  const onContact = path.replace(/\/$/, '') === '/contact';
  // Description : la marque animée remplace le nom en tête de phrase, le reste suit
  const descRest = t('footer_description').replace(/^\s*Fertil[’']\s*Innov\s*/i, '');
  // Lampe : suit le pointeur sur la marque (le balayage automatique CSS reprend en sortant)
  const light = (ev) => { const el = ev.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`); el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`); el.classList.add('is-lit'); };
  const unlight = (ev) => ev.currentTarget.classList.remove('is-lit');
  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    if (prefersReducedMotion()) return;
    // La marque sort de terre, puis les pousses germent au sommet des lettres
    const st = { trigger: q('.f-mark')[0], start: 'top 92%', once: true };
    gsap.fromTo(q('.f-word'), { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: st });
    gsap.fromTo(q('.f-sprout'), { scale: 0 }, { scale: 1, duration: 1.1, ease: 'back.out(2)', stagger: 0.15, delay: 0.6, scrollTrigger: st });
  }, { scope: ref });

  return (
    <div ref={ref} className="mt-8">
      <footer className="f-foot relative overflow-hidden text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0"><div className="grain h-full" /></div>

        <div className={`wrap relative pb-10 ${!onContact ? 'pt-16' : 'pt-48'}`}>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <img {...img('logo_rond')} alt={site.nom} width={112} height={112} className="h-24 w-24 rounded-full bg-white p-1 object-contain" loading="lazy" decoding="async" />
              {/* La marque animée ouvre la description : lettres taillées dans un profil de sol, pousses, lampe */}
              <p className="mt-6 max-w-md text-white/85 leading-relaxed">
                <span aria-hidden className="f-mark relative mb-2 block w-max pt-[0.3em] font-display text-[clamp(2.4rem,4.4vw,3.4rem)] font-bold leading-none tracking-tight" onPointerMove={light} onPointerLeave={unlight}>
                  <span className="f-word block whitespace-nowrap">
                    {[...MARK].map((c, i) => (
                      <span key={i} className="relative">{c}{SPROUT_ON.includes(i) && (
                        // Pousse plantée au sommet de la lettre (F, t, l, I)
                        <svg className="f-sprout pointer-events-none absolute left-1/2 top-[0.24em] w-[0.26em] -translate-x-1/2 -translate-y-full" style={{ '--d': `${-i * 0.6}s` }} viewBox="0 0 40 48" fill="none">
                          <path d="M20 48 C 20 38, 21 30, 20 20" stroke="#8bc34a" strokeWidth="2.6" strokeLinecap="round" />
                          <path d="M20 28 C 12 20, 4 22, 2 28 C 8 33, 15 33, 20 28 Z" fill="#7cb342" />
                          <path d="M20 22 C 28 12, 37 14, 39 20 C 33 26, 25 27, 20 22 Z" fill="#9ccc65" />
                          <path d="M20 21 C 17 14, 18 8, 20 4 C 22 8, 23 14, 20 21 Z" fill="#aed581" />
                        </svg>
                      )}</span>
                    ))}
                  </span>
                  <span className="f-word f-word-lit pointer-events-none absolute bottom-0 left-0 block whitespace-nowrap">{MARK}</span>
                </span>
                <span className="sr-only">{MARK} </span>
                {descRest}
              </p>
              <p className="mt-4 text-sm text-[#dcf3b0]">{t('footer_certifs')}</p>
              <div className="mt-5 flex items-center gap-3">
                <a href={e.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Linkedin size={18} /></a>
                <a href={`tel:${e.telephone.replace(/\s/g, '')}`} aria-label={t('contact_tel_titre')} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Phone size={18} /></a>
                <a href={`mailto:${e.email}`} aria-label={t('contact_email_titre')} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-fi-accent hover:text-fi-deep transition-colors"><Mail size={18} /></a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-display text-white text-base font-semibold mb-4">{t('footer_services')}</h3>
              <ul className="space-y-2.5 text-sm text-white/85">
                {services.map((s) => <li key={s.id}><Link to={`${p('/services')}#${s.id}`} className="hover:text-[#dcf3b0] transition-colors">{L(s.titre)}</Link></li>)}
                <li><Link to={p('/formations')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_formations')}</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-display text-white text-base font-semibold mb-4">{t('footer_entreprise')}</h3>
              <ul className="space-y-2.5 text-sm text-white/85">
                <li><Link to={`${p('/')}#realisations`} className="hover:text-[#dcf3b0] transition-colors">{t('footer_realisations')}</Link></li>
                <li><Link to={p('/activites')} className="hover:text-[#dcf3b0] transition-colors">{t('footer_rd')}</Link></li>
                <li><Link to={p('/expertise')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_expertise')}</Link></li>
                <li><Link to={p('/equipe')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_equipe')}</Link></li>
                <li><Link to={p('/chiffres')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_chiffres')}</Link></li>
                <li><Link to={p('/blog')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_blog')}</Link></li>
                <li><Link to={`${p('/faq')}#guide`} className="hover:text-[#dcf3b0] transition-colors">{t('nav_guide')}</Link></li>
                <li><Link to={p('/faq')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_faq')}</Link></li>
                <li><Link to={p('/contact')} className="hover:text-[#dcf3b0] transition-colors">{t('nav_contact')}</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className="font-display text-white text-base font-semibold mb-4">{t('nav_contact')}</h3>
              <address className="not-italic text-sm text-white/85 space-y-2.5">
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-[#dcf3b0]" aria-hidden /><span>{e.adresse}<br />{e.codePostal} {e.ville}, {e.pays}</span></p>
                <p className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-[#dcf3b0]" aria-hidden /><span><a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="hover:text-[#dcf3b0]">{e.telephone}</a><br /><a href={`tel:${e.mobile.replace(/\s/g, '')}`} className="hover:text-[#dcf3b0]">{e.mobile}</a></span></p>
                <p className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-[#dcf3b0]" aria-hidden /><a href={`mailto:${e.email}`} className="hover:text-[#dcf3b0] break-all">{e.email}</a></p>
                <p className="pt-1 text-white/75">{horairesAffichage(site.horaires, lang).map((h) => `${h.jour} ${h.heures}`).join(' · ')}</p>
              </address>
            </div>
          </div>

          {/* Herbe qui pousse au-dessus de la ligne du copyright */}
          <div aria-hidden className="f-grass pointer-events-none mt-12 h-7" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/20 pt-6 text-xs text-white">
            <p>© {new Date().getFullYear()} {site.nom}. {t('footer_droits')}</p>
            <button type="button" onClick={toTop} className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 hover:bg-white/20 transition-colors min-h-[40px]">{t('footer_haut')} <ArrowUp size={14} aria-hidden /></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
