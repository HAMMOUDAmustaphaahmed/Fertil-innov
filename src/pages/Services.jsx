import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { PageHero } from '../components/ui';
import { useLang } from '../i18n/LangProvider';
import { useSite } from '../site/SiteProvider';
import { useReveal } from '../hooks/useReveal';
import { openPois } from '../lib/pois';

export default function Services() {
  const { t, p, L, lang } = useLang();
  const { listes } = useSite();
  const { hash } = useLocation();
  const services = listes.services.filter((s) => s.visible !== false);
  const initial = hash && services.some((s) => s.id === hash.slice(1)) ? hash.slice(1) : services[0]?.id;
  const [current, setCurrent] = useState(initial);
  useEffect(() => { if (hash && services.some((s) => s.id === hash.slice(1))) setCurrent(hash.slice(1)); }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = services.find((s) => s.id === current) || services[0];
  const ref = useReveal([current]);

  const jsonLd = services.map((s) => ({ '@context': 'https://schema.org', '@type': 'Service', name: L(s.titre), description: L(s.resume), serviceType: L(s.titre), provider: { '@type': 'Organization', name: "Fertil'Innov Environnement" }, areaServed: 'FR', url: `#${s.id}` }));

  return (
    <>
      <SEO title={t('services_page_titre')} description={t('seo_services')} path="/services" jsonLd={jsonLd} breadcrumb={[{ name: t('nav_accueil'), path: '/' }, { name: t('nav_services'), path: '/services' }]} />
      <PageHero title={t('services_page_titre')} text={t('services_page_texte')} />

      <div className="wrap -mt-8 relative z-[1]">
        {/* Onglets des services (ancrés : chaque service reste une URL partageable) */}
        <nav aria-label="Services" className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {services.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); setCurrent(s.id); window.history.replaceState(null, '', `#${s.id}`); }} aria-current={s.id === current ? 'page' : undefined}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px] inline-flex items-center gap-2 ${s.id === current ? 'bg-fi-accent text-fi-deep shadow-leaf' : 'bg-white border border-fi-light text-fi-dark hover:bg-fi-mint'}`}>
              <span aria-hidden>{s.emoji}</span>{L(s.titre)}
            </a>
          ))}
        </nav>
      </div>

      {active && (
        <section ref={ref} id={active.id} className="section !pt-12" key={active.id}>
          <div className="wrap grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4">
                <img src={`/images/${active.icone}`} alt="" aria-hidden width={80} height={80} className="h-20 w-20 object-contain" />
                <h2 className="reveal text-display-md">{L(active.titre)}</h2>
              </div>
              <p className="reveal mt-6 text-lg leading-relaxed text-fi-text/80">{L(active.intro)}</p>
              <ul className="mt-8 space-y-4">
                {active.points.map((pt, i) => (
                  <li key={i} className="reveal card p-5 flex gap-4">
                    <span className="text-2xl shrink-0" aria-hidden>{pt.emoji}</span>
                    <div><h3 className="font-display font-semibold text-fi-dark">{L(pt.titre)}</h3><p className="mt-1 text-sm text-fi-text/75 leading-relaxed">{L(pt.texte)}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-5">
              <dl className="reveal grid grid-cols-2 gap-4">
                {active.stats.map((st, i) => (
                  <div key={i} className="card p-5 text-center"><dd className="font-display text-3xl font-semibold text-fi-primary">{st.valeur}</dd><dt className="mt-1 text-sm text-fi-text/70">{L(st.label)}</dt></div>
                ))}
              </dl>
              <div className="reveal card p-6 bg-fi-deep text-white border-none grain">
                <p className="text-sm text-white/75">{t('contact_devis_24h')}</p>
                <Link to={p('/contact')} state={{ subject: 'devis', service: active.id }} className="mt-4 btn-accent w-full">{L(active.cta)} <ArrowRight size={16} aria-hidden /></Link>
                <button type="button" onClick={() => openPois(lang === 'fr' ? `Je voudrais en savoir plus sur : ${L(active.titre)}` : lang === 'en' ? `I'd like to know more about: ${L(active.titre)}` : `Quisiera saber más sobre: ${L(active.titre)}`)} className="mt-2 btn-light w-full">{t('hero_bouton_2')}</button>
              </div>
            </aside>
          </div>

          <div className="wrap mt-16">
            <h2 className="reveal text-display-sm">{t('services_autres')}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.filter((s) => s.id !== active.id).map((s) => (
                <li key={s.id} className="reveal">
                  <button type="button" onClick={() => { setCurrent(s.id); window.history.replaceState(null, '', `#${s.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="card w-full text-left p-5 hover:-translate-y-0.5 hover:shadow-leaf transition-[transform,box-shadow]">
                    <span className="text-2xl" aria-hidden>{s.emoji}</span>
                    <h3 className="mt-2 font-display font-semibold text-fi-dark">{L(s.titre)}</h3>
                    <p className="mt-1 text-sm text-fi-text/70 line-clamp-2">{L(s.resume)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Contenu complet de tous les services pour les moteurs et les IA (rendu en HTML, replié visuellement) */}
      <section className="sr-only" aria-hidden>
        {services.map((s) => (
          <article key={s.id}><h2>{L(s.titre)}</h2><p>{L(s.intro)}</p><ul>{s.points.map((pt, i) => <li key={i}>{L(pt.titre)} : {L(pt.texte)}</li>)}</ul></article>
        ))}
      </section>
    </>
  );
}
