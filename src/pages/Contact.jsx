import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, FlaskConical, Clock, CheckCircle2, ExternalLink, Linkedin } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero, StatusDot } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { horairesAffichage } from '../data/infos';

const MapSites = lazy(() => import('../components/MapSites'));
const SUBJECTS = ['devis', 'formation', 'partenariat', 'info'];
const SUBJECT_KEY = { devis: 'contact_objet_devis', formation: 'contact_objet_formation', partenariat: 'contact_objet_partenariat', info: 'contact_objet_info' };

export default function Contact() {
  const { t, L, lang } = useLang();
  const site = useSite();
  const img = useImage();
  const { state } = useLocation();
  const e = site.entreprise;
  const services = site.listes.services.filter((s) => s.visible !== false);
  const formations = site.listes.formations.filter((f) => f.visible !== false);
  const [form, setForm] = useState({ subject: SUBJECTS.includes(state?.subject) ? state.subject : 'devis', service: state?.service || '', formation: state?.formation || '', nom: '', email: '', telephone: '', organisation: '', surface: '', localisation: '', message: state?.message || '', website: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [numero, setNumero] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (state?.subject || state?.message) setForm((f) => ({ ...f, subject: SUBJECTS.includes(state.subject) ? state.subject : f.subject, service: state.service || f.service, formation: state.formation || f.formation, message: state.message || f.message })); }, [state]);

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));
  const submit = async (ev) => {
    ev.preventDefault();
    setStatus('sending'); setErr('');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, lang }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || t('contact_erreur'));
      setNumero(data.numero); setStatus('ok');
    } catch (e2) { setErr(e2.message || t('contact_erreur')); setStatus('error'); }
  };
  const field = 'w-full rounded-2xl border border-fi-light bg-white px-4 py-3 text-[0.95rem] outline-none focus:border-fi-primary focus:ring-4 focus:ring-fi-primary/10 min-h-[48px]';
  const mapsUrl = (adr, cp, ville) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${adr} ${cp} ${ville}`)}`;

  return (
    <>
      <SEO title={t('contact_titre')} description={t('seo_contact')} path="/contact" jsonLd={[{ '@context': 'https://schema.org', '@type': 'ContactPage', name: t('contact_titre') }]} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_contact'), path: '/contact' }]} />
      <PageHero title={t('contact_titre')} text={t('contact_texte')} image={img('contact').src}>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm"><StatusDot className="text-white/85" /><span className="rounded-full bg-fi-accent/20 text-fi-accent px-3 py-1 font-semibold">{t('contact_devis_24h')}</span></div>
      </PageHero>

      <section className="section !pt-12">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {status === 'ok' ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 md:p-10 text-center" role="status">
                <CheckCircle2 size={56} className="mx-auto text-fi-primary" aria-hidden />
                <h2 className="mt-4 text-display-sm">{t('contact_merci_titre')}</h2>
                <p className="mt-2 font-mono text-sm text-fi-primary">{numero}</p>
                <p className="mt-3 text-fi-text/75">{t('contact_merci_texte')}</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="card p-6 md:p-8 space-y-4" noValidate>
                <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                <fieldset>
                  <legend className="text-sm font-semibold text-fi-dark mb-2">{t('contact_objet')}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBJECTS.map((s) => (
                      <label key={s} className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-medium transition-colors min-h-[48px] flex items-center ${form.subject === s ? 'border-fi-primary bg-fi-mint text-fi-dark' : 'border-fi-light bg-white hover:bg-fi-bg'}`}>
                        <input type="radio" name="subject" value={s} checked={form.subject === s} onChange={set('subject')} className="sr-only" />{t(SUBJECT_KEY[s])}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {form.subject === 'devis' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="sr-only">{t('contact_service')}</span>
                      <select value={form.service} onChange={set('service')} className={field}><option value="">{t('contact_service')}</option>{services.map((s) => <option key={s.id} value={s.id}>{L(s.titre)}</option>)}</select>
                    </label>
                    <input type="number" min="0" step="0.1" value={form.surface} onChange={set('surface')} placeholder={t('contact_surface')} aria-label={t('contact_surface')} className={field} />
                    <input type="text" value={form.localisation} onChange={set('localisation')} placeholder={t('contact_localisation')} aria-label={t('contact_localisation')} className={`${field} sm:col-span-2`} />
                  </div>
                )}
                {form.subject === 'formation' && (
                  <label className="block"><span className="sr-only">{t('nav_formations')}</span>
                    <select value={form.formation} onChange={set('formation')} className={field}><option value="">{t('nav_formations')}</option>{formations.map((f) => <option key={f.id} value={L(f.titre)}>{L(f.titre)}</option>)}</select>
                  </label>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" required autoComplete="name" value={form.nom} onChange={set('nom')} placeholder={t('contact_nom')} aria-label={t('contact_nom')} className={field} />
                  <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder={t('contact_email')} aria-label={t('contact_email')} className={field} />
                  <input type="tel" autoComplete="tel" value={form.telephone} onChange={set('telephone')} placeholder={t('contact_telephone')} aria-label={t('contact_telephone')} className={field} />
                  <input type="text" autoComplete="organization" value={form.organisation} onChange={set('organisation')} placeholder={t('contact_organisation')} aria-label={t('contact_organisation')} className={field} />
                </div>
                <textarea required rows={5} value={form.message} onChange={set('message')} placeholder={t('contact_message')} aria-label={t('contact_message')} className={field} />
                {status === 'error' && <p role="alert" className="text-sm text-red-700">{err}</p>}
                <button type="submit" disabled={status === 'sending' || !form.nom || !form.email || form.message.length < 5} className="btn-primary w-full sm:w-auto disabled:opacity-60">{status === 'sending' ? t('contact_envoi') : t('contact_envoyer')}</button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-5 space-y-4">
            <div className="card p-5 flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><Phone size={20} aria-hidden /></span><div><h3 className="font-display font-semibold text-fi-dark">{t('contact_tel_titre')}</h3><p className="text-sm"><a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="text-fi-primary font-medium">{e.telephone}</a><br /><a href={`tel:${e.mobile.replace(/\s/g, '')}`} className="text-fi-primary font-medium">{e.mobile}</a></p></div></div>
            <div className="card p-5 flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><Mail size={20} aria-hidden /></span><div className="min-w-0"><h3 className="font-display font-semibold text-fi-dark">{t('contact_email_titre')}</h3><a href={`mailto:${e.email}`} className="text-sm text-fi-primary font-medium break-all">{e.email}</a><br /><a href={e.linkedin} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-fi-text/70 hover:text-fi-primary"><Linkedin size={14} aria-hidden /> LinkedIn</a></div></div>
            <div className="card p-5 flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><MapPin size={20} aria-hidden /></span><div><h3 className="font-display font-semibold text-fi-dark">{t('contact_siege_titre')}</h3><p className="text-sm text-fi-text/80">{e.adresse}<br />{e.codePostal} {e.ville}, {e.pays}</p><a href={mapsUrl(e.adresse, e.codePostal, e.ville)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-fi-primary">{t('contact_itineraire')} <ExternalLink size={12} aria-hidden /></a></div></div>
            {e.labo && <div className="card p-5 flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><FlaskConical size={20} aria-hidden /></span><div><h3 className="font-display font-semibold text-fi-dark">{t('contact_labo_titre')}</h3><p className="text-sm text-fi-text/80">{e.labo.adresse}<br />{e.labo.codePostal} {e.labo.ville}</p><a href={mapsUrl(e.labo.adresse, e.labo.codePostal, e.labo.ville)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-fi-primary">{t('contact_itineraire')} <ExternalLink size={12} aria-hidden /></a></div></div>}
            <div className="card p-5 flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><Clock size={20} aria-hidden /></span><div><h3 className="font-display font-semibold text-fi-dark">{t('contact_horaires_titre')}</h3><ul className="text-sm text-fi-text/80">{horairesAffichage(site.horaires, lang).map((h) => <li key={h.jour}>{h.jour} : {h.heures}</li>)}</ul></div></div>
          </aside>
        </div>
        <div className="wrap mt-10">
          <Suspense fallback={<div className="h-72 rounded-3xl bg-fi-mint" />}><MapSites className="!h-80 md:!h-96" /></Suspense>
        </div>
      </section>
    </>
  );
}
