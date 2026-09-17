import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { setScrollLocked } from '../hooks/useSmoothScroll';

export default function Activites() {
  const { t, p, L } = useLang();
  const { listes, images } = useSite();
  const list = listes.activites.filter((a) => a.visible !== false);
  const [open, setOpen] = useState(null);
  const ref = useReveal([list.length]);
  const active = list.find((a) => a.id === open);
  const pic = (a) => images[`activite_${a.id}`] || imgSrc(a.image);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setScrollLocked(true); // Lenis ne doit plus faire défiler la page derrière la fenêtre
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; setScrollLocked(false); };
  }, [open]);

  return (
    <>
      <SEO title={t('activites_titre')} description={t('seo_activites')} path="/activites" breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_activites'), path: '/activites' }]} />
      <PageHero title={t('activites_titre')} text={t('activites_texte')} />

      <section ref={ref} className="section">
        <div className="wrap grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start">
            <div className="reveal card p-6 bg-fi-mint/60">
              <h2 className="text-display-sm">🌱 {t('activites_sidebar_titre')}</h2>
              <ul className="mt-5 space-y-3">
                {['activites_sidebar_1', 'activites_sidebar_2', 'activites_sidebar_3'].map((k) => <li key={k} className="flex gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-fi-primary" aria-hidden />{t(k)}</li>)}
              </ul>
              <Link to={p('/contact')} state={{ subject: 'devis' }} className="mt-6 btn-primary w-full">{t('activites_sidebar_bouton')}</Link>
            </div>
          </aside>
          <ul className="lg:col-span-8 grid gap-5 sm:grid-cols-2">
            {list.map((a) => (
              <li key={a.id} className="reveal">
                <button type="button" onClick={() => setOpen(a.id)} className="card w-full text-left overflow-hidden group hover:-translate-y-1 hover:shadow-leaf transition-[transform,box-shadow] duration-300" aria-haspopup="dialog">
                  <img src={pic(a)} alt="" width={800} height={450} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="p-5">
                    <h3 className="text-display-sm">{L(a.titre)}</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-fi-text/75">{a.points.map((pt, i) => <li key={i}>· {L(pt)}</li>)}</ul>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fi-primary">{t('activites_explorer')} <ArrowRight size={16} aria-hidden /></span>
                  </div>
                </button>
                {/* Détail complet toujours présent dans le HTML (SEO / IA), replié visuellement */}
                <div className="sr-only"><h4>{L(a.sousTitre)}</h4><p>{L(a.texte)}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <motion.div key="overlay" className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-fi-deep/70 backdrop-blur-sm p-0 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="act-title" onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              data-lenis-prevent className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-white shadow-leaf">
              <div className="relative">
                <img src={pic(active)} alt="" width={1000} height={500} className="aspect-[2/1] w-full object-cover rounded-t-3xl" />
                <button type="button" onClick={() => setOpen(null)} aria-label="Fermer" className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-fi-dark hover:bg-white"><X /></button>
              </div>
              <div className="p-6 md:p-8">
                <h2 id="act-title" className="text-display-md">{L(active.titre)}</h2>
                <h3 className="mt-3 font-display text-lg font-semibold text-fi-primary">{L(active.sousTitre)}</h3>
                <p className="mt-3 leading-relaxed text-fi-text/80">{L(active.texte)}</p>
                <dl className="mt-6 grid grid-cols-2 gap-4 max-w-sm">
                  {active.stats.map((st, i) => <div key={i} className="rounded-2xl bg-fi-mint p-4 text-center"><dd className="font-display text-2xl font-semibold text-fi-primary">{st.valeur}</dd><dt className="text-xs text-fi-text/70">{L(st.label)}</dt></div>)}
                </dl>
                <Link to={p('/contact')} state={{ subject: 'devis' }} className="mt-6 btn-primary">{t('activites_devis')} <ArrowRight size={16} aria-hidden /></Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
