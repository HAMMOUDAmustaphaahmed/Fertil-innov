// Balises <head> par page : titre, description, canonical, hreflang (fr/en/es),
// Open Graph / Twitter, JSON-LD. Utilisé par le pré-rendu (react-helmet-async).
import { Helmet } from 'react-helmet-async';
import { useLang, localePath, LOCALE } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { LANGS } from '../data/infos';

export function useSiteUrl() {
  const { entreprise } = useSite();
  // Toujours le domaine officiel : la copie *.vercel.app renvoie vers lui (canonical) et n'est pas indexée (X-Robots-Tag dans vercel.json).
  const base = entreprise.siteUrl || 'https://www.fertilinnov-environnement.com';
  return String(base).replace(/\/$/, '');
}

/** Bloc JSON-LD Organization/LocalBusiness commun à toutes les pages. */
export function organizationJsonLd(site, base, lang) {
  const e = site.entreprise;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'], '@id': `${base}/#org`,
        name: site.nom, alternateName: site.nomCourt, url: `${base}/`, logo: { '@type': 'ImageObject', url: `${base}${site.images.logo_rond}` }, image: `${base}${site.images.og}`,
        description: site.slogan?.[lang] || site.slogan?.fr, foundingDate: e.fondation, priceRange: '€€',
        address: { '@type': 'PostalAddress', streetAddress: e.adresse, addressLocality: e.ville, postalCode: e.codePostal, addressRegion: e.region, addressCountry: 'FR' },
        geo: { '@type': 'GeoCoordinates', latitude: e.coords?.[0], longitude: e.coords?.[1] },
        telephone: e.telephone, email: e.email, sameAs: [e.linkedin].filter(Boolean),
        areaServed: ['FR', 'EU'], knowsLanguage: ['fr', 'en', 'es'],
        openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' }],
        hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: (site.listes.services || []).filter((s) => s.visible !== false).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.titre?.[lang] || s.titre?.fr, description: s.resume?.[lang] || s.resume?.fr, url: `${base}${localePath('/services', lang)}#${s.id}` } })) },
        employee: (site.listes.equipe || []).filter((m) => m.visible !== false).map((m) => ({ '@type': 'Person', name: m.nom, jobTitle: m.role?.[lang] || m.role?.fr })),
      },
      { '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/`, name: site.nom, publisher: { '@id': `${base}/#org` }, inLanguage: LOCALE[lang] },
    ],
  };
}

export default function SEO({ title, description, path = '/', image, jsonLd = [], type = 'website', breadcrumb }) {
  const { lang } = useLang();
  const site = useSite();
  const base = useSiteUrl();
  const url = `${base}${localePath(path, lang)}`;
  const fullTitle = title ? (title.includes(site.nomCourt) ? title : `${title} | ${site.nomCourt}`) : `${site.nom} | ${site.slogan?.[lang] || site.slogan?.fr}`;
  const keywords = site.listes.services.filter((s) => s.visible !== false).map((s) => s.titre?.[lang] || s.titre?.fr).join(', ');
  const img = image || site.images.og;
  const absImg = /^https?:/.test(img) ? img : `${base}${img}`;
  const graphs = [organizationJsonLd(site, base, lang), ...jsonLd];
  if (breadcrumb?.length) {
    graphs.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumb.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: `${base}${localePath(b.path, lang)}` })) });
  }
  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`microbiologie des sols, analyse de sol, biofertilisation, mycorhizes, dépollution des sols, phytoremédiation, ${keywords}`} />
      <meta name="geo.region" content="FR-OCC" />
      <meta name="geo.placename" content={site.entreprise.ville} />
      <link rel="canonical" href={url} />
      {LANGS.map((l) => <link key={l} rel="alternate" hrefLang={l} href={`${base}${localePath(path, l)}`} />)}
      <link rel="alternate" hrefLang="x-default" href={`${base}${localePath(path, 'fr')}`} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={site.nom} />
      <meta property="og:locale" content={LOCALE[lang].replace('-', '_')} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absImg} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absImg} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      {graphs.map((g, i) => <script key={i} type="application/ld+json">{JSON.stringify(g)}</script>)}
    </Helmet>
  );
}
