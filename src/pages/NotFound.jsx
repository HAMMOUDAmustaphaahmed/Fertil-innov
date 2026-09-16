import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../i18n/LangProvider';
import { useImage } from '../site/SiteProvider';

const TXT = {
  fr: { t: 'Page introuvable', s: 'Cette page a été déplacée ou n’existe pas. Petit Pois vous ramène à l’accueil.', b: 'Retour à l’accueil' },
  en: { t: 'Page not found', s: 'This page has moved or does not exist. Petit Pois will take you back home.', b: 'Back to home' },
  es: { t: 'Página no encontrada', s: 'Esta página se ha movido o no existe. Petit Pois le lleva de vuelta al inicio.', b: 'Volver al inicio' },
};

export default function NotFound() {
  const { lang, p } = useLang();
  const img = useImage();
  const x = TXT[lang] || TXT.fr;
  return (
    <section className="min-h-[80vh] flex items-center pt-[var(--header-h)]">
      <Helmet><title>404 — {x.t}</title><meta name="robots" content="noindex" /></Helmet>
      <div className="wrap text-center">
        <img {...img('petit_pois')} alt="" width={160} height={160} className="mx-auto w-36 float" />
        <h1 className="mt-6 text-display-md">{x.t}</h1>
        <p className="mt-3 text-fi-text/70">{x.s}</p>
        <Link to={p('/')} className="mt-6 btn-primary">{x.b}</Link>
      </div>
    </section>
  );
}
