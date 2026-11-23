import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero, Counter, SectionHeader } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';

export default function Chiffres() {
  const { t, p, L } = useLang();
  const { chiffres: c, listes } = useSite();
  const ref = useReveal();
  const big = [
    { v: c.annees, suffix: '', k: 'compteur_annees' },
    { v: c.sites, suffix: '+', k: 'chiffres_sites' },
    { v: c.projetsTotal, suffix: '', k: 'chiffres_projets' },
    { v: c.partenaires, suffix: '', k: 'chiffres_partenaires' },
  ];
  const kpis = [
    // Indicateurs suivis sur chaque projet : aucun pourcentage n'est annoncé, les résultats dépendent du site
    // et se mesurent par comparaison (avant / après, témoin non traité).
    { k: 'chiffres_rendement', n: 'chiffres_rendement_note' },
    { k: 'chiffres_eau', n: 'chiffres_eau_note' },
    { k: 'chiffres_biodiv', n: 'chiffres_biodiv_note' },
    { k: 'chiffres_co2', n: 'chiffres_co2_note' },
  ];
  const real = listes.realisations.filter((r) => r.visible !== false);
  return (
    <>
      <SEO title={t('chiffres_titre')} description={t('seo_chiffres')} path="/chiffres" breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_chiffres'), path: '/chiffres' }]} />
      <PageHero variant="data" title={t('chiffres_titre')} text={t('chiffres_texte')} image="/images/sol-profil.webp" />
      <section ref={ref} className="section">
        <div className="wrap">
          <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {big.map((b) => (
              <div key={b.k} className="reveal card p-6 text-center">
                <dd className="font-display text-4xl md:text-5xl font-semibold text-fi-primary"><Counter value={b.v} suffix={b.suffix} /></dd>
                <dt className="mt-2 text-sm text-fi-text/70">{t(b.k)}</dt>
              </div>
            ))}
          </dl>
          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            {kpis.map((k) => (
              <div key={k.k} className="reveal card p-6 md:p-8 bg-fi-mint/50">
                <p className="kicker mb-1">{t('chiffres_indicateur')}</p>
                <dt className="font-display text-lg font-semibold text-fi-dark">{t(k.k)}</dt>
                <dd className="mt-1 text-sm text-fi-text/70">{t(k.n)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-16">
            <SectionHeader kicker={t('realisations_kicker')} title={t('chiffres_video_titre')} text={t('chiffres_video_texte')} />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {real.map((r) => (
                <li key={r.id} className="reveal relative overflow-hidden rounded-2xl">
                  <img src={imgSrc(r.image)} alt={L(r.titre)} width={600} height={450} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fi-deep/90 to-transparent p-4 pt-10 text-white"><p className="text-xs text-fi-accent">{L(r.categorie)}</p><p className="font-display font-semibold leading-tight">{L(r.titre)}</p></div>
                </li>
              ))}
            </ul>
            <Link to={p('/contact')} state={{ subject: 'devis' }} className="reveal mt-8 btn-primary">{t('pourquoi_bouton_2')} <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
