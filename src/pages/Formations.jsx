import { Link } from 'react-router-dom';
import { ArrowRight, Users, Laptop, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero, SectionHeader } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';

export default function Formations() {
  const { t, p, L } = useLang();
  const { listes } = useSite();
  const list = listes.formations.filter((f) => f.visible !== false);
  const ref = useReveal([list.length]);
  const formats = [
    { Icon: Users, k: 'formations_presentiel', d: 'formations_presentiel_texte' },
    { Icon: Laptop, k: 'formations_enligne', d: 'formations_enligne_texte' },
    { Icon: MapPin, k: 'formations_sursite', d: 'formations_sursite_texte' },
  ];
  const jsonLd = list.map((f) => ({ '@context': 'https://schema.org', '@type': 'Course', name: L(f.titre), description: L(f.texte), provider: { '@type': 'Organization', name: "Fertil'Innov Environnement" }, hasCourseInstance: { '@type': 'CourseInstance', courseMode: ['onsite', 'online'], courseWorkload: `PT${f.duree * 7}H` } }));
  return (
    <>
      <SEO title={t('formations_titre')} description={t('seo_formations')} path="/formations" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_formations'), path: '/formations' }]} />
      <PageHero title={t('formations_titre')} text={t('formations_texte')} image="/images/labo-recherche.webp">
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><span className="font-display text-xl font-semibold text-fi-accent">98 %</span> {t('formations_satisfaction')}</p>
      </PageHero>

      <section ref={ref} className="section">
        <div className="wrap">
          <SectionHeader title={t('formations_formats_titre')} />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {formats.map(({ Icon, k, d }) => (
              <li key={k} className="reveal card p-6 flex gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fi-mint text-fi-primary"><Icon size={22} aria-hidden /></span>
                <div><h3 className="font-display font-semibold text-fi-dark">{t(k)}</h3><p className="mt-1 text-sm text-fi-text/75">{t(d)}</p></div>
              </li>
            ))}
          </ul>

          <ol className="mt-16 space-y-5">
            {list.map((f) => (
              <li key={f.id} className="reveal card p-6 md:p-8 grid gap-6 md:grid-cols-12 md:items-center">
                <div className="md:col-span-8">
                  <div className="flex items-center gap-3"><span className="text-3xl" aria-hidden>{f.emoji}</span><h2 className="text-display-sm">{L(f.titre)}</h2></div>
                  <p className="mt-2 font-medium text-fi-primary">{L(f.accroche)}</p>
                  <p className="mt-3 leading-relaxed text-fi-text/80">{L(f.texte)}</p>
                  <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <li className="rounded-full bg-fi-mint px-3 py-1.5 text-fi-dark">{f.duree} {t('jours')}</li>
                    {f.tags.map((tag, i) => <li key={i} className="rounded-full bg-fi-mint px-3 py-1.5 text-fi-dark">{L(tag)}</li>)}
                  </ul>
                </div>
                <div className="md:col-span-4 md:text-right">
                  <Link to={p('/contact')} state={{ subject: 'formation', formation: L(f.titre) }} className="btn-primary">{t('formations_bouton')} <ArrowRight size={16} aria-hidden /></Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
