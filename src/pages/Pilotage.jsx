// Espace de pilotage du propriétaire (adresse : ESPACE_PATH dans src/data/infos.js) : connexion en deux étapes, tableau de bord, réglages de l'IA, le Chef.
// Non référencé dans la navigation du site ni dans le sitemap ; l'ancienne adresse /admin y redirige.
import { Suspense, lazy, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LayoutDashboard, Bot, MessageSquare, LogOut, Rocket, ShieldCheck } from 'lucide-react';
import { useSite, useImage } from '../site/SiteProvider';
import { api } from '../admin/data';
import Login from '../admin/Login';

const Dashboard = lazy(() => import('../admin/Dashboard'));
const AiSettings = lazy(() => import('../admin/AiSettings'));
const ChefChat = lazy(() => import('../admin/ChefChat'));

const TABS = [['board', 'Tableau de bord', LayoutDashboard], ['ia', 'Assistant IA', Bot], ['chef', 'Le Chef', MessageSquare]];

export default function Pilotage() {
  const { nom } = useSite();
  const img = useImage();
  const [status, setStatus] = useState(null); // null = vérification en cours
  const [tab, setTab] = useState('board');
  const [err, setErr] = useState(null);
  const [deploy, setDeploy] = useState(null);

  const check = () => api('/api/admin/login').then(setStatus).catch(() => setStatus({ admin: false }));
  useEffect(() => { check(); }, []);

  // Une session expirée (12 h) ramène à la connexion au lieu d'afficher des erreurs.
  const onError = (e) => { if (!e) return setErr(null); if (e.status === 401) { setStatus({ admin: false }); return undefined; } return setErr(e.message); };
  const logout = async () => { await api('/api/admin/login', { method: 'DELETE' }).catch(() => {}); setStatus({ admin: false }); };
  const redeploy = async () => {
    setDeploy('Lancement…');
    try { const r = await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'redeploy' }) }); setDeploy(r.ok ? 'Pages SEO en cours de régénération (1 à 2 min).' : r.raison || 'Impossible.'); }
    catch (e) { setDeploy(e.message); }
    setTimeout(() => setDeploy(null), 8000);
  };

  return (
    <>
      <Helmet><title>{`Pilotage — ${nom}`}</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      {status === null ? <div className="min-h-screen bg-[#f6f9fb]" /> : !status.admin ? <Login status={status} onOk={check} /> : (
        <div className="min-h-screen bg-[#f5f8fa]">
          <header className="sticky top-0 z-30 border-b border-fi-light/80 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <img {...img('logo')} alt="" className="h-9 w-auto shrink-0" />
                <div className="min-w-0"><h1 className="truncate font-display text-base font-semibold leading-tight text-slate-900">Pilotage</h1><p className="flex items-center gap-1 truncate text-xs text-fi-text/60"><ShieldCheck size={12} className="shrink-0 text-fi-primary" aria-hidden /> {status.login}</p></div>
              </div>
              <nav aria-label="Sections" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-fi-mint/70 p-1 md:order-2 md:w-auto">
                {TABS.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => { setTab(id); setErr(null); }} aria-current={tab === id ? 'page' : undefined} className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${tab === id ? 'bg-slate-900 text-white shadow' : 'text-fi-dark hover:bg-white/70'}`}><Icon size={15} aria-hidden /> {label}</button>)}
              </nav>
              <div className="order-2 flex items-center gap-1.5 md:order-3">
                <button type="button" onClick={redeploy} title="Régénérer les pages lues par Google" className="hidden items-center gap-1.5 rounded-full bg-fi-mint px-3.5 py-2 text-sm font-semibold text-fi-dark hover:bg-fi-light sm:inline-flex"><Rocket size={14} aria-hidden /> Pages SEO</button>
                <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-full bg-fi-mint px-3.5 py-2 text-sm font-semibold text-fi-dark hover:bg-fi-light"><LogOut size={14} aria-hidden /> <span className="hidden sm:inline">Déconnexion</span></button>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 md:py-7">
            {deploy && <p className="mb-4 rounded-2xl bg-fi-mint px-4 py-3 text-sm text-fi-dark" role="status">{deploy}</p>}
            {err && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{err}</p>}
            <Suspense fallback={<p className="py-16 text-center text-sm text-fi-text/60">Chargement…</p>}>
              {tab === 'board' && <Dashboard onError={onError} />}
              {tab === 'ia' && <AiSettings onError={onError} />}
              {tab === 'chef' && <ChefChat />}
            </Suspense>
          </main>
        </div>
      )}
    </>
  );
}
