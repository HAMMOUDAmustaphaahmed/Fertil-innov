import { ExternalLink, Headphones } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite, imgSrc } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';

const fmtDate = (iso, lang) => new Intl.DateTimeFormat({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));

export default function Blog() {
  const { t, L, lang } = useLang();
  const { listes, nom } = useSite();
  const list = listes.blog.filter((b) => b.visible !== false).sort((a, b) => b.date.localeCompare(a.date));
  const ref = useReveal([list.length]);
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'Blog', name: t('blog_titre'), blogPost: list.map((b) => ({ '@type': 'BlogPosting', headline: L(b.titre), datePublished: b.date, description: L(b.texte), url: b.lien, author: { '@type': 'Organization', name: nom } })) }];
  return (
    <>
      <SEO title={t('blog_titre')} description={t('seo_blog')} path="/blog" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_blog'), path: '/blog' }]} />
      <PageHero title={t('blog_titre')} text={t('blog_texte')} />
      <section ref={ref} className="section">
        <div className="wrap grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((b, i) => (
            <article key={b.id} className={`reveal card overflow-hidden group flex flex-col ${i === 0 ? 'md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-2' : ''}`}>
              {b.image ? <img src={imgSrc(b.image)} alt="" width={900} height={506} loading={i === 0 ? 'eager' : 'lazy'} className={`w-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ${i === 0 ? 'aspect-[16/9] lg:aspect-auto lg:h-full lg:max-h-[440px]' : 'aspect-[16/9]'}`} /> : <div className={`bg-fi-deep text-fi-accent flex items-center justify-center ${i === 0 ? 'aspect-[16/9] lg:aspect-auto' : 'aspect-[16/9]'}`}><Headphones size={48} aria-hidden /></div>}
              <div className={`p-6 flex flex-col ${i === 0 ? "justify-center" : "flex-1"}`}>
                <p className="text-xs font-semibold text-fi-primary">{L(b.categorie)} · <time dateTime={b.date}>{fmtDate(b.date, lang)}</time>{b.duree ? ` · ${b.duree} ${t('blog_min')}` : ''}</p>
                <h2 className={`mt-2 font-display font-semibold text-fi-dark leading-snug ${i === 0 ? 'text-display-sm' : 'text-lg'}`}>{L(b.titre)}</h2>
                <p className="mt-2 text-sm text-fi-text/75 leading-relaxed">{L(b.texte)}</p>
                <a href={b.lien} target="_blank" rel="noreferrer" className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fi-primary hover:gap-2.5 transition-[gap]">{b.audio ? t('blog_ecouter') : t('blog_lire')} <ExternalLink size={14} aria-hidden /></a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
