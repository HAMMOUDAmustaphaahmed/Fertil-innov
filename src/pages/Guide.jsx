// Guide des sols vivants : fiches pédagogiques (fertiliser le sol, microbiologie, analyse
// de sol, mycorhizes, dépollution…) pour les recherches Google / IA des visiteurs qui ne
// connaissent pas encore Fertil'Innov. Chaque fiche a son ancre et renvoie vers un service.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { GUIDE } from '../data/guide';
import { openPois } from '../lib/pois';

export default function Guide() {
  const { t, p, L, lang } = useLang();
  const { listes, nom } = useSite();
  const services = listes.services;
  const ref = useReveal();
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: GUIDE.map((g) => ({ '@type': 'Question', name: L(g.question), acceptedAnswer: { '@type': 'Answer', text: `${L(g.resume)} ${L(g.texte)}` } })) },
    { '@context': 'https://schema.org', '@type': 'Article', headline: t('guide_titre'), description: t('seo_guide'), author: { '@type': 'Organization', name: nom }, publisher: { '@type': 'Organization', name: nom }, inLanguage: lang, keywords: GUIDE.map((g) => L(g.motsCles)).join(', ') },
  ];
  return (
    <>
      <SEO title={t('guide_titre')} description={t('seo_guide')} path="/sols" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_guide'), path: '/sols' }]} />
      <PageHero title={t('guide_titre')} text={t('guide_texte')} image="/images/racines.webp">
        <nav aria-label={t('nav_guide')} className="mt-8 flex flex-wrap gap-2">
          {GUIDE.map((g) => <a key={g.id} href={`#${g.id}`} className="rounded-full bg-white/10 px-3.5 py-2 text-sm text-white/90 hover:bg-white hover:text-fi-deep transition-colors min-h-[40px] inline-flex items-center gap-1.5"><span aria-hidden>{g.emoji}</span>{L(g.titre)}</a>)}
        </nav>
      </PageHero>
      <section ref={ref} className="section">
        <div className="wrap max-w-4xl space-y-6">
          {GUIDE.map((g) => {
            const svc = services.find((s) => s.id === g.service);
            return (
              <article key={g.id} id={g.id} className="reveal card p-6 md:p-8 scroll-mt-24">
                <p className="kicker">{L(g.question)}</p>
                <h2 className="mt-2 text-display-sm flex items-start gap-3"><span aria-hidden>{g.emoji}</span><span>{L(g.titre)}</span></h2>
                <p className="mt-4 font-medium text-fi-dark leading-relaxed">{L(g.resume)}</p>
                <p className="mt-3 leading-relaxed text-fi-text/80">{L(g.texte)}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {svc && <Link to={`${p('/services')}#${svc.id}`} className="btn-primary !py-2.5 text-sm">{L(svc.titre)} <ArrowRight size={14} aria-hidden /></Link>}
                  <button type="button" onClick={() => openPois(L(g.question))} className="btn-ghost !py-2.5 text-sm">{t('hero_bouton_2')}</button>
                </div>
                <p className="mt-4 text-xs text-fi-text/50">{L(g.motsCles)}</p>
              </article>
            );
          })}
          <div className="rounded-3xl bg-fi-deep text-white grain p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1"><h2 className="text-display-sm !text-white">{t('guide_cta_titre')}</h2><p className="mt-2 text-white/75">{t('guide_cta_texte')}</p></div>
            <Link to={p('/contact')} state={{ subject: 'devis', service: 'diagnostics' }} className="btn-accent shrink-0">{t('pourquoi_bouton_2')} <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
