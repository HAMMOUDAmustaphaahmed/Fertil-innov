import { Link } from 'react-router-dom';
import { ArrowUp, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { horairesAffichage } from '../data/infos';
import { getLenis } from '../hooks/useSmoothScroll';

export default function Footer() {
  const { t, p, L, lang } = useLang();
  const site = useSite();
  const img = useImage();
  const e = site.entreprise;
  const services = site.listes.services.filter((s) => s.visible !== false);
  const toTop = () => { const l = getLenis(); if (l) l.scrollTo(0); else window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <footer className="relative bg-fi-deep text-white grain mt-8">
      {/* Bande « horizon » : transition sol → footer */}
      <div aria-hidden className="absolute -top-px inset-x-0 h-6 bg-gradient-to-b from-fi-bg to-transparent" />
      <div className="wrap pt-16 pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <img {...img('logo_rond')} alt={site.nom} width={112} height={112} className="h-24 w-24 rounded-full bg-white p-1 object-contain" loading="lazy" />
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
              <li><Link to={p('/chiffres')} className="hover:text-fi-accent transition-colors">{t('nav_chiffres')}</Link></li>
              <li><Link to={p('/blog')} className="hover:text-fi-accent transition-colors">{t('nav_blog')}</Link></li>
              <li><Link to={p('/sols')} className="hover:text-fi-accent transition-colors">{t('nav_guide')}</Link></li>
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
    </footer>
  );
}
