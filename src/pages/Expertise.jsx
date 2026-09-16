import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero, SectionHeader } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';

export default function Expertise() {
  const { t, p, L } = useLang();
  const { listes } = useSite();
  const list = listes.expertise.filter((x) => x.visible !== false);
  const ref = useReveal([list.length]);
  return (
    <>
      <SEO title={t('expertise_titre')} description={t('seo_expertise')} path="/expertise" breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_expertise'), path: '/expertise' }]} />
      <PageHero title={t('expertise_titre')} text={t('expertise_texte')} image="/images/microscope.webp" />
      <section ref={ref} className="section">
        <div className="wrap">
          <div className="grid gap-5 md:grid-cols-2">
            {list.map((x) => (
              <article key={x.id} className="reveal card p-6 md:p-8">
                <span className="text-3xl" aria-hidden>{x.emoji}</span>
                <h2 className="mt-4 text-display-sm">{L(x.titre)}</h2>
                <p className="mt-3 leading-relaxed text-fi-text/80">{L(x.texte)}</p>
                <p className="mt-5 rounded-2xl bg-fi-mint px-4 py-3 text-sm font-semibold text-fi-dark">→ {L(x.impact)}</p>
              </article>
            ))}
          </div>
          <div className="mt-16 rounded-3xl bg-fi-deep text-white grain p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6">
            <SectionHeader dark kicker={t('pourquoi_kicker')} title={t('pourquoi_titre')} className="flex-1" />
            <Link to={p('/contact')} state={{ subject: 'devis' }} className="btn-accent shrink-0">{t('pourquoi_bouton_2')} <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
