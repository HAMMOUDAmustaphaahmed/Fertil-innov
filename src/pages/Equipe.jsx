// Page Équipe : portraits en cartes 3D (inclinaison au survol sur ordinateur, à l'appui sur mobile),
// puis un appel à nous rejoindre / nous contacter.
import { Link } from 'react-router-dom';
import { ArrowRight, Linkedin } from 'lucide-react';
import SEO, { useSiteUrl } from '../components/SEO';
import { PageHero, SectionHeader } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';

export default function Equipe() {
  const { t, p, L } = useLang();
  const { listes, entreprise, nom } = useSite();
  const list = (listes.equipe || []).filter((m) => m.visible !== false);
  const ref = useReveal([list.length]);
  const base = useSiteUrl();
  const abs = (u) => (/^https?:/.test(u) ? u : `${base}${u}`);
  const jsonLd = [{
    '@context': 'https://schema.org', '@type': 'AboutPage', name: t('equipe_page_titre'),
    mainEntity: { '@type': 'Organization', '@id': `${base}/#org`, name: nom, employee: list.map((m) => ({ '@type': 'Person', name: m.nom, jobTitle: L(m.role), description: L(m.texte), image: abs(imgSrc(m.image)), worksFor: { '@id': `${base}/#org` } })) },
  }];
  return (
    <>
      <SEO title={t('equipe_page_titre')} description={t('seo_equipe')} path="/equipe" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_equipe'), path: '/equipe' }]} />
      <PageHero variant="network" kicker={t('equipe_kicker')} title={t('equipe_page_titre')} text={t('equipe_page_texte')} image="/images/labo-recherche.webp" />
      <section ref={ref} className="section">
        <div className="wrap">
          <SectionHeader kicker={t('equipe_kicker')} title={t('equipe_titre')} />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {list.map((m, i) => (
              <li key={m.id} className="reveal card fx-tilt overflow-hidden group" style={{ '--i': i }}>
                <div className="relative aspect-[4/4.2] overflow-hidden bg-fi-mint">
                  <img src={imgSrc(m.image)} alt={m.nom} width={600} height={690} loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-fi-deep/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span aria-hidden className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 font-display text-xs font-semibold text-fi-dark backdrop-blur tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold text-fi-dark">{m.nom}</h2>
                  <p className="text-sm font-medium text-fi-primary">{L(m.role)}</p>
                  <p className="mt-2 text-sm text-fi-text/70 leading-relaxed">{L(m.texte)}</p>
                  {entreprise.linkedin && <a href={entreprise.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn — ${m.nom}`} className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-fi-mint text-fi-dark hover:bg-fi-primary hover:text-white transition-colors"><Linkedin size={16} /></a>}
                </div>
              </li>
            ))}
          </ul>

          <div className="reveal mt-20 rounded-3xl bg-fi-deep text-white grain p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6">
            <SectionHeader dark kicker={t('equipe_kicker')} title={t('equipe_cta_titre')} text={t('equipe_cta_texte')} className="flex-1" />
            <Link to={p('/contact')} state={{ subject: 'info' }} className="btn-accent shrink-0">{t('nav_contact')} <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
