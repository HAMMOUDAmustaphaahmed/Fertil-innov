import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { openPois } from '../lib/pois';

export default function Faq() {
  const { t, p, L } = useLang();
  const { listes } = useSite();
  const list = listes.faq.filter((f) => f.visible !== false);
  const [open, setOpen] = useState(list[0]?.id || null);
  const ref = useReveal([list.length]);
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: L(f.question), acceptedAnswer: { '@type': 'Answer', text: L(f.reponse) } })) }];
  return (
    <>
      <SEO title={t('faq_titre')} description={t('seo_faq')} path="/faq" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_faq'), path: '/faq' }]} />
      <PageHero title={t('faq_titre')} text={t('faq_texte')} />
      <section ref={ref} className="section">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3">
            {list.map((f) => {
              const isOpen = open === f.id;
              return (
                <article key={f.id} className={`reveal card overflow-hidden transition-colors ${isOpen ? 'border-fi-primary/40' : ''}`}>
                  <h2>
                    <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen} aria-controls={`faq-${f.id}`} className="flex w-full items-center gap-4 p-5 md:p-6 text-left">
                      <span className="text-2xl shrink-0" aria-hidden>{f.emoji}</span>
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
    </>
  );
}
