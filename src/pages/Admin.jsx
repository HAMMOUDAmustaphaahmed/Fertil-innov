// Espace propriétaire : connexion, tableau de bord des demandes et conversation avec le Chef.
// Non référencé dans la navigation ; accessible sur /admin (même mot de passe que le bot Telegram).
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LogOut, RefreshCw, Send, Trash2, Sprout, MessageSquare, LayoutDashboard, Rocket } from 'lucide-react';
import { useSite, useImage } from '../site/SiteProvider';

async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Erreur');
  return data;
}

function Login({ onOk }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pwd }) }); onOk(); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-fi-deep grain flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-leaf">
        <div className="w-12 h-12 rounded-2xl bg-fi-deep text-fi-accent flex items-center justify-center mb-5"><Sprout /></div>
        <h1 className="text-display-sm mb-1">Espace équipe</h1>
        <p className="text-sm text-fi-text/70 mb-6">Le même mot de passe que pour le bot Telegram.</p>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mot de passe" autoFocus className="w-full px-4 py-3 rounded-xl border border-fi-light bg-white outline-none focus:border-fi-primary mb-3" />
        {err && <p className="text-sm text-red-700 mb-3">{err}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Connexion…' : 'Entrer'}</button>
      </form>
    </div>
  );
}

const STATUTS = [['en_cours', 'En cours'], ['devis_envoye', 'Devis envoyé'], ['gagnee', 'Gagnée'], ['perdue', 'Perdue'], ['traitee', 'Traitée']];

function LeadRow({ l, onAction }) {
  return (
    <li className="py-3 border-b border-fi-light last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-fi-primary">{l.numero} · <span className="text-fi-text/60">{l.statut} · {l.type}{l.service ? ` · ${l.service}` : ''} · {l.recu_le}</span></p>
          <p className="font-medium text-fi-dark">{l.client}</p>
          {l.details && <p className="text-xs text-fi-text/70">{l.details}</p>}
          {l.besoin && <p className="mt-1 text-sm text-fi-text/80 whitespace-pre-line">{l.besoin}</p>}
        </div>
        <select aria-label="Changer le statut" defaultValue="" onChange={(e) => { if (e.target.value) onAction(l.numero, e.target.value); }} className="rounded-full border border-fi-light bg-white px-3 py-1.5 text-xs font-semibold text-fi-dark">
          <option value="">Statut…</option>
          {STATUTS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
        </select>
      </div>
    </li>
  );
}

function Dashboard({ data, reload }) {
  const act = async (numero, statut) => { await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'statut', numero, statut }) }); reload(); };
  const [deploying, setDeploying] = useState(null);
  const redeploy = async () => { setDeploying('…'); try { const r = await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'redeploy' }) }); setDeploying(r.ok ? 'Déploiement lancé (1 à 2 min).' : r.raison || 'Impossible'); } catch (e) { setDeploying(e.message); } };
  const Card = ({ title, count, children }) => (
    <section className="card p-5 md:p-6">
      <h2 className="text-display-sm mb-3 flex items-center justify-between">{title}{count !== undefined && <span className="text-sm font-sans text-fi-text/60">{count}</span>}</h2>
      {children}
    </section>
  );
  const st = data.stats;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="📩 Nouvelles demandes" count={data.nouvelles.nombre}>
        {data.nouvelles.nombre ? <ul>{data.nouvelles.demandes.map((l) => <LeadRow key={l.numero} l={l} onAction={act} />)}</ul> : <p className="text-sm text-fi-text/60">Aucune demande à traiter. ✅</p>}
      </Card>
      <Card title="🔄 En cours" count={data.enCours.nombre}>
        {data.enCours.nombre ? <ul>{data.enCours.demandes.map((l) => <LeadRow key={l.numero} l={l} onAction={act} />)}</ul> : <p className="text-sm text-fi-text/60">Rien en cours.</p>}
      </Card>
      <Card title="📊 7 derniers jours">
        <p className="font-display text-4xl font-semibold text-fi-dark">{st.demandes_total} <span className="text-base font-sans text-fi-text/60">demandes</span></p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div><p className="font-semibold text-fi-dark mb-1">Par type</p><ul>{Object.entries(st.par_type).map(([k, v]) => <li key={k}>{v} × {k}</li>)}</ul></div>
          <div><p className="font-semibold text-fi-dark mb-1">Par service</p><ul>{Object.entries(st.par_service).map(([k, v]) => <li key={k}>{v} × {k}</li>)}</ul></div>
        </div>
        <p className="mt-4 text-xs text-fi-text/60">Petit Pois : {st.petit_pois.requetes} requêtes · {Number(st.petit_pois.tokens).toLocaleString('fr-FR')} tokens · {data.llm.provider} / {data.llm.model}</p>
      </Card>
      <Card title="🌐 Site">
        <p className="text-sm text-fi-text/80">Configuration v{data.site.version} · police {data.site.police}</p>
        <div className="mt-3 flex gap-1.5">{Object.entries(data.site.palette).slice(0, 8).map(([k, v]) => <span key={k} title={k} className="h-7 w-7 rounded-full border border-black/10" style={{ background: v }} />)}</div>
        <p className="mt-4 text-sm text-fi-text/70">Tout se modifie dans l’onglet « Le Chef » (ou sur Telegram) : textes, services, formations, FAQ, blog, équipe, photos, couleurs, horaires…</p>
        <button type="button" onClick={redeploy} className="mt-4 btn-ghost !py-2 text-sm"><Rocket size={14} aria-hidden /> Régénérer les pages SEO</button>
        {deploying && <p className="mt-2 text-xs text-fi-text/70">{deploying}</p>}
      </Card>
      <Card title="🗓 Cette semaine" count={data.semaine.nombre}>
        {data.semaine.nombre ? <ul>{data.semaine.demandes.map((l) => <LeadRow key={l.numero} l={l} onAction={act} />)}</ul> : <p className="text-sm text-fi-text/60">Aucune demande cette semaine.</p>}
      </Card>
    </div>
  );
}

function ChefChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const load = () => api('/api/admin/chat').then((d) => setMessages(d.messages)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: '' }]);
    const update = (fn) => setMessages((m) => { const c = [...m]; const l = { ...c[c.length - 1] }; fn(l); c[c.length - 1] = l; return c; });
    try {
      const r = await fetch('/api/admin/chat', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i; while ((i = buf.indexOf('\n\n')) !== -1) {
          const line = buf.slice(0, i).split('\n').find((l) => l.startsWith('data: ')); buf = buf.slice(i + 2);
          if (!line) continue;
          try { const ev = JSON.parse(line.slice(6)); if (ev.type === 'text') update((l) => { l.text += ev.delta; }); else if (ev.type === 'replace') update((l) => { l.text = ev.text; }); else if (ev.type === 'error') update((l) => { l.text = `⚠️ ${ev.message}`; }); } catch { /* */ }
        }
      }
    } catch (e) { update((l) => { l.text = `⚠️ ${e.message}`; }); } finally { setBusy(false); }
  };
  const reset = async () => { if (!confirm('Remettre la conversation à zéro ?')) return; await api('/api/admin/chat', { method: 'DELETE' }); setMessages([]); };
  return (
    <div className="card flex flex-col h-[70vh]">
      <div className="flex items-center justify-between border-b border-fi-light px-5 py-3">
        <p className="font-display font-semibold text-fi-dark">Le Chef</p>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-fi-text/60 hover:text-red-700"><Trash2 size={14} /> Nouvelle conversation</button>
      </div>
      <div ref={scrollRef} data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 bg-fi-bg">
        {!messages.length && <p className="text-sm text-fi-text/60">Exemples : « les demandes de la semaine », « change le slogan en … », « ajoute une formation : … », « mets la palette olive terre », « 130 projets réalisés ». Pour les photos, passez par Telegram.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.from === 'user' ? 'bg-fi-primary text-white' : 'bg-white border border-fi-light text-fi-text'}`}>{m.text || (busy && i === messages.length - 1 ? '…' : '')}</div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-fi-light p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Parlez au Chef…" className="flex-1 rounded-full bg-fi-bg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-fi-primary/40" />
        <button type="submit" disabled={busy || !input.trim()} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-fi-primary text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { nom } = useSite();
  const img = useImage();
  const [auth, setAuth] = useState(null);
  const [tab, setTab] = useState('board');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => api('/api/admin/overview').then(setData).catch((e) => setErr(e.message));
  useEffect(() => { api('/api/admin/login').then((d) => setAuth(!!d.admin)).catch(() => setAuth(false)); }, []);
  useEffect(() => { if (auth) load(); }, [auth]);
  const logout = async () => { await api('/api/admin/login', { method: 'DELETE' }); setAuth(false); };

  return (
    <>
      <Helmet><title>Espace équipe — {nom}</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      {auth === null ? <div className="min-h-screen" /> : !auth ? <Login onOk={() => setAuth(true)} /> : (
        <div className="min-h-screen bg-fi-bg">
          <header className="border-b border-fi-light bg-white">
            <div className="wrap flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3"><img {...img('logo')} alt="" className="h-9 w-auto" /><h1 className="font-display font-semibold text-fi-dark">Espace équipe</h1></div>
              <nav className="flex gap-2">
                <button onClick={() => setTab('board')} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'board' ? 'bg-fi-deep text-white' : 'bg-fi-mint text-fi-dark'}`}><LayoutDashboard size={14} /> Tableau de bord</button>
                <button onClick={() => setTab('chef')} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'chef' ? 'bg-fi-deep text-white' : 'bg-fi-mint text-fi-dark'}`}><MessageSquare size={14} /> Le Chef</button>
                <button onClick={load} aria-label="Rafraîchir" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-fi-mint text-fi-dark"><RefreshCw size={14} /></button>
                <button onClick={logout} aria-label="Déconnexion" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-fi-mint text-fi-dark"><LogOut size={14} /></button>
              </nav>
            </div>
          </header>
          <main className="wrap py-6">
            {err && <p className="mb-4 text-sm text-red-700">{err}</p>}
            {tab === 'board' ? (data ? <Dashboard data={data} reload={load} /> : <p className="text-sm text-fi-text/60">Chargement…</p>) : <ChefChat />}
          </main>
        </div>
      )}
    </>
  );
}
