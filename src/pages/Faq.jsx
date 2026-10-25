// FAQ + Guide des sols vivants (anciennement /sols, redirigé ici) : questions techniques en accordéon,
// puis les fiches pédagogiques du guide (chacune garde son ancre et renvoie vers un service).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import Icon from '../components/Icons';
import { PageHero, SectionHeader } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { GUIDE } from '../data/guide';
import { openPois } from '../lib/pois';

export default function Faq() {
  const { t, p, L, lang } = useLang();
  const { listes, nom } = useSite();
  const list = listes.faq.filter((f) => f.visible !== false);
  const services = listes.services;
  const [open, setOpen] = useState(list[0]?.id || null);
  const ref = useReveal([list.length]);
  const guideRef = useReveal();
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: [
        ...list.map((f) => ({ '@type': 'Question', name: L(f.question), acceptedAnswer: { '@type': 'Answer', text: L(f.reponse) } })),
        ...GUIDE.map((g) => ({ '@type': 'Question', name: L(g.question), acceptedAnswer: { '@type': 'Answer', text: `${L(g.resume)} ${L(g.texte)}` } })),
      ],
    },
    { '@context': 'https://schema.org', '@type': 'Article', headline: t('guide_titre'), description: t('seo_guide'), author: { '@type': 'Organization', name: nom }, publisher: { '@type': 'Organization', name: nom }, inLanguage: lang, keywords: GUIDE.map((g) => L(g.motsCles)).join(', ') },
  ];
  return (
    <>
      <SEO title={t('faq_titre')} description={t('seo_faq')} path="/faq" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_faq'), path: '/faq' }]} />
      <PageHero variant="iris" title={t('faq_titre')} text={t('faq_texte')}>
        <nav aria-label={t('nav_faq')} className="mt-8 flex flex-wrap gap-2">
          <a href="#questions" className="rounded-full bg-fi-accent px-3.5 py-2 text-sm font-semibold text-fi-deep min-h-[40px] inline-flex items-center gap-1.5"><Icon name="clipboard" size="h-4 w-4" />{t('nav_faq')}</a>
          {GUIDE.map((g) => <a key={g.id} href={`#${g.id}`} className="rounded-full bg-white/10 px-3.5 py-2 text-sm text-white/90 hover:bg-white hover:text-fi-deep transition-colors min-h-[40px] inline-flex items-center gap-1.5"><Icon emoji={g.emoji} size="h-4 w-4" />{L(g.titre)}</a>)}
        </nav>
      </PageHero>

      {/* 1. Questions fréquentes */}
      <section ref={ref} id="questions" className="section scroll-mt-24">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3">
            {list.map((f) => {
              const isOpen = open === f.id;
              return (
                <article key={f.id} className={`reveal card overflow-hidden transition-colors ${isOpen ? 'border-fi-primary/40' : ''}`}>
                  <h2>
                    <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen} aria-controls={`faq-${f.id}`} className="flex w-full items-center gap-4 p-5 md:p-6 text-left">
                      <Icon emoji={f.emoji} tile="light" className="h-11 w-11" size="h-6 w-6" />
                      <span className="flex-1 font-display text-lg font-semibold text-fi-dark leading-snug">{L(f.question)}</span>
                      <ChevronDown size={20} className={`shrink-0 text-fi-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                  </h2>
                  {/* La réponse reste dans le HTML (hidden) pour Google et les IA */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div key="a" id={`faq-${f.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <p className="px-5 md:px-6 pb-6 pl-[4.25rem] md:pl-[4.5rem] leading-relaxed text-fi-text/80 whitespace-pre-line">{L(f.reponse)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isOpen && <p hidden>{L(f.reponse)}</p>}
                </article>
              );
            })}
          </div>
          <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start">
            <div className="reveal card p-6 bg-fi-deep text-white border-none grain">
              <h2 className="text-display-sm !text-white">{t('faq_autre')}</h2>
              <p className="mt-3 text-sm text-white/75 leading-relaxed">{t('faq_autre_texte')}</p>
              <button type="button" onClick={() => openPois()} className="mt-5 btn-accent w-full">{t('hero_bouton_2')}</button>
              <Link to={p('/contact')} className="mt-2 btn-light w-full">{t('nav_contact')} <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </aside>
        </div>
      </section>

      {/* 2. Guide des sols vivants */}
      <section ref={guideRef} id="guide" className="section bg-fi-mint/50 horizons scroll-mt-24">
        <div className="wrap max-w-4xl">
          <SectionHeader kicker={t('nav_guide')} title={t('guide_titre')} text={t('guide_texte')} />
          <div className="mt-12 space-y-6">
            {GUIDE.map((g) => {
              const svc = services.find((s) => s.id === g.service);
              return (
                <article key={g.id} id={g.id} className="reveal card p-6 md:p-8 scroll-mt-24">
                  <p className="kicker">{L(g.question)}</p>
                  <h3 className="mt-2 text-display-sm flex items-center gap-3"><Icon emoji={g.emoji} tile="light" className="h-12 w-12" size="h-7 w-7" /><span>{L(g.titre)}</span></h3>
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
            <div className="reveal rounded-3xl bg-fi-deep text-white grain p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1"><h2 className="text-display-sm !text-white">{t('guide_cta_titre')}</h2><p className="mt-2 text-white/75">{t('guide_cta_texte')}</p></div>
              <Link to={p('/contact')} state={{ subject: 'devis', service: 'diagnostics' }} className="btn-accent shrink-0">{t('pourquoi_bouton_2')} <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
