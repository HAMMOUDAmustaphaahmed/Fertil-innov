// Réglages de l'assistant IA : interrupteur, fournisseur, clé, modèle, consignes, quotas, essai réel, journal de sécurité.
// La clé n'est jamais renvoyée par le serveur : on ne voit que ses 4 derniers caractères.
import { useEffect, useState } from 'react';
import { Power, KeyRound, FlaskConical, Save, ShieldCheck, CheckCircle2, XCircle, Info, Cpu, SlidersHorizontal, ScrollText, ListRestart, ExternalLink } from 'lucide-react';
import { api, fmtDateTime, fmtInt } from './data';

const LIMIT_LABEL = {
  maxMessagesPerSession: ['Messages par conversation', 'Au-delà, Petit Pois propose le formulaire de contact.'],
  maxMessagesPerIpPerDay: ['Messages par visiteur et par jour', 'Protège contre un visiteur qui abuserait du chat.'],
  dailyTokenBudget: ['Budget quotidien (tokens)', 'Une fois atteint, Petit Pois s’arrête jusqu’au lendemain.'],
  maxOutputTokens: ['Longueur maximale d’une réponse (tokens)', 'Environ 4 caractères par token.'],
};

function Card({ icon: Icon, title, sub, children }) {
  return (
    <section className="rounded-3xl border border-fi-light/80 bg-white p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fi-mint text-fi-primary"><Icon size={17} aria-hidden /></span><div><h2 className="font-display text-[1.08rem] font-semibold leading-tight text-slate-900">{title}</h2>{sub && <p className="mt-0.5 text-xs text-fi-text/60">{sub}</p>}</div></div>
      {children}
    </section>
  );
}
const input = 'w-full rounded-xl border border-fi-light bg-white px-3.5 py-2.5 text-sm outline-none focus:border-fi-primary';

export default function AiSettings({ onError }) {
  const [view, setView] = useState(null);
  const [f, setF] = useState(null);
  const [apiKey, setApiKey] = useState(''); const [clearKey, setClearKey] = useState(false); const [password, setPassword] = useState('');
  const [test, setTest] = useState(null); const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false); const [msg, setMsg] = useState(null);
  const [models, setModels] = useState([]); const [loadingModels, setLoadingModels] = useState(false); const [modelsMsg, setModelsMsg] = useState(null);

  const apply = (d) => { setView(d); setF({ enabled: d.reglages.enabled, provider: d.reglages.provider, model: d.reglages.model, guardModel: d.reglages.guardModel, baseUrl: d.reglages.baseUrl || '', extra: d.reglages.extra, limits: { ...d.reglages.limits } }); setApiKey(''); setClearKey(false); setPassword(''); };
  useEffect(() => { api('/api/admin/ai').then(apply).catch((e) => onError?.(e)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!view || !f) return <p className="py-16 text-center text-sm text-fi-text/60">Chargement des réglages…</p>;

  const up = (patch) => { setF((s) => ({ ...s, ...patch })); setTest(null); setMsg(null); };
  const prov = view.choix.providers.find((x) => x.id === f.provider) || view.choix.providers[0];
  const savedKeyForProvider = view.reglages.apiKeyHint && view.reglages.apiKeyProvider === f.provider;
  const serverKey = prov.cleServeur;
  const sensitive = !!apiKey.trim() || clearKey || f.provider !== view.reglages.provider || (prov.custom && f.baseUrl.trim() !== (view.reglages.baseUrl || ''));
  const pickProvider = (id) => { up({ provider: id, model: '', guardModel: '' }); setModels([]); setModelsMsg(null); setApiKey(''); setClearKey(false); };
  const loadModels = async () => {
    setLoadingModels(true); setModelsMsg(null);
    try {
      const d = await api('/api/admin/ai', { method: 'POST', body: JSON.stringify({ action: 'models', provider: f.provider, baseUrl: f.baseUrl, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) }) });
      if (d.ok) { setModels(d.modeles); setModelsMsg({ ok: true, text: `${d.modeles.length} modèle${d.modeles.length > 1 ? 's' : ''} disponible${d.modeles.length > 1 ? 's' : ''} avec cette clé.` }); } else setModelsMsg({ ok: false, text: d.erreur });
    } catch (e) { setModelsMsg({ ok: false, text: e.message }); } finally { setLoadingModels(false); }
  };
  const payload = (action) => ({ action, ...f, model: f.model, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}), ...(clearKey ? { clearKey: true } : {}), ...(sensitive ? { password } : {}) });

  const runTest = async () => {
    setTesting(true); setTest(null); setMsg(null);
    try { setTest(await api('/api/admin/ai', { method: 'POST', body: JSON.stringify(payload('test')) })); } catch (e) { setTest({ ok: false, erreur: e.message }); } finally { setTesting(false); }
  };
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try { const d = await api('/api/admin/ai', { method: 'POST', body: JSON.stringify(payload('save')) }); apply(d); setTest(null); setMsg({ ok: true, text: 'Réglages enregistrés. Ils sont pris en compte dans les 20 secondes, sans redémarrage.' }); }
    catch (e2) { setMsg({ ok: false, text: e2.message }); if (e2.data?.test) setTest(e2.data.test); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      {/* ----- État actuel */}
      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 md:p-6 ${view.actif.enabled ? 'bg-gradient-to-br from-[#128f88] via-[#27a37a] to-[#6fbe4e] text-white' : 'bg-slate-700 text-white'}`}>
        <div className="flex items-center gap-4">
          <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${view.actif.enabled ? 'bg-white text-[#128f88]' : 'bg-white/15'}`}><Power size={22} aria-hidden />{view.actif.enabled && <span aria-hidden className="absolute -inset-1 animate-ping rounded-2xl border-2 border-white/50 [animation-duration:2.6s]" />}</span>
          <div><p className="font-display text-xl font-semibold">{view.actif.enabled ? 'Petit Pois est en marche' : 'Petit Pois est coupé'}</p><p className="text-sm text-white/70">{view.actif.label} · {view.actif.model} · réglages : {view.actif.source}</p></div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold">
          <span>{f.enabled ? 'Activé' : 'Désactivé'}</span>
          <input type="checkbox" checked={f.enabled} onChange={(e) => up({ enabled: e.target.checked })} className="peer sr-only" />
          <span className="relative h-6 w-11 rounded-full bg-white/25 transition peer-checked:bg-white/60 peer-focus-visible:ring-2 peer-focus-visible:ring-white after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card icon={Cpu} title="Fournisseur et modèle" sub="Le modèle répond aux visiteurs (Petit Pois) et au propriétaire (le Chef).">
          <div className="grid gap-4">
            <div><p className="mb-1.5 text-sm font-medium text-fi-text">Fournisseur</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{view.choix.providers.map((p) => <button key={p.id} type="button" onClick={() => pickProvider(p.id)} aria-pressed={f.provider === p.id} className={`rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold leading-tight transition ${f.provider === p.id ? 'border-fi-primary bg-fi-mint text-slate-900' : 'border-fi-light text-fi-text/75 hover:border-fi-primary/50'}`}>{p.label}{p.cleServeur && <span className="mt-0.5 block text-[11px] font-normal text-fi-text/60">clé sur le serveur</span>}</button>)}</div>
              {prov.keysUrl && <a href={prov.keysUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-fi-primary hover:underline">Obtenir une clé chez {prov.label} <ExternalLink size={12} aria-hidden /></a>}
            </div>
            {prov.custom && (
              <label className="block"><span className="mb-1.5 block text-sm font-medium text-fi-text">Adresse du service</span>
                <input value={f.baseUrl} onChange={(e) => up({ baseUrl: e.target.value })} placeholder="https://api.exemple.com/v1" className={input} spellCheck={false} inputMode="url" />
                <span className="mt-1 block text-xs text-fi-text/55">Tout service compatible avec l’API d’OpenAI. Adresse publique en https uniquement.</span></label>
            )}
            <div><span className="mb-1.5 block text-sm font-medium text-fi-text">Modèle de Petit Pois</span>
              <div className="flex gap-2">
                <input list="ai-models" aria-label="Modèle de Petit Pois" value={f.model} onChange={(e) => up({ model: e.target.value })} placeholder={prov.defaut ? `Par défaut : ${prov.defaut}` : 'Choisissez un modèle'} className={input} spellCheck={false} />
                <button type="button" onClick={loadModels} disabled={loadingModels} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-fi-mint px-3.5 text-sm font-semibold text-slate-900 hover:bg-fi-light disabled:opacity-50"><ListRestart size={15} aria-hidden /> {loadingModels ? '…' : 'Charger les modèles'}</button>
              </div>
              <datalist id="ai-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
              {modelsMsg ? <p className={`mt-1 text-xs ${modelsMsg.ok ? 'text-emerald-800' : 'text-rose-800'}`} role="status">{modelsMsg.text}{modelsMsg.ok ? ' Cliquez dans le champ pour les voir.' : ''}</p>
                : <p className="mt-1 text-xs text-fi-text/55">{prov.defaut ? 'Laissez vide pour le modèle par défaut. ' : ''}« Charger les modèles » demande au fournisseur la liste réelle pour votre clé. Le modèle est essayé (réponse et appel d’outil) avant d’être enregistré.</p>}
            </div>
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-fi-text">Modèle du filtre de sécurité <span className="font-normal text-fi-text/55">(facultatif)</span></span>
              <input value={f.guardModel} onChange={(e) => up({ guardModel: e.target.value })} placeholder="Par défaut : un petit modèle rapide" className={input} spellCheck={false} /></label>
          </div>
        </Card>

        <Card icon={KeyRound} title="Clé d’API" sub="Chiffrée avant d’être enregistrée. Elle n’est jamais réaffichée.">
          <div className="mb-3 rounded-2xl bg-fi-mint/60 px-4 py-3 text-sm text-fi-dark">
            {savedKeyForProvider ? <>Clé {prov.label} enregistrée dans l’espace : <strong className="font-mono">{view.reglages.apiKeyHint}</strong></> : serverKey ? 'Aucune clé enregistrée ici : la clé du serveur est utilisée.' : `Aucune clé ${prov.label} : saisissez-en une.`}
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-fi-text">{savedKeyForProvider ? 'Remplacer la clé' : 'Nouvelle clé'}</span>
            <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setClearKey(false); setTest(null); }} autoComplete="off" placeholder="Collez la clé ici" className={`${input} font-mono`} spellCheck={false} /></label>
          {savedKeyForProvider && <label className="mt-3 flex items-center gap-2 text-sm text-fi-text/80"><input type="checkbox" checked={clearKey} onChange={(e) => { setClearKey(e.target.checked); if (e.target.checked) setApiKey(''); }} className="h-4 w-4 accent-fi-primary" /> Retirer la clé enregistrée {serverKey ? '(retour à la clé du serveur)' : ''}</label>}
          {sensitive && (
            <label className="mt-4 block rounded-2xl border border-amber-300 bg-amber-50 p-3.5"><span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900"><ShieldCheck size={15} aria-hidden /> Confirmez avec votre mot de passe</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required placeholder="Mot de passe de votre compte" className={input} />
              <span className="mt-1 block text-xs text-amber-900/80">Demandé pour changer la clé, le fournisseur ou l’adresse du service. Une alerte Telegram sera envoyée.</span></label>
          )}
        </Card>

        <Card icon={ScrollText} title="Consignes supplémentaires" sub="Elles précisent le ton et les priorités de Petit Pois. Elles ne peuvent pas lever ses règles de sécurité.">
          <textarea value={f.extra} onChange={(e) => up({ extra: e.target.value })} maxLength={1500} rows={7} placeholder="Exemples : « Mets en avant les formations de printemps. » « Rappelle que le diagnostic terrain se fait sous 15 jours. »" className={`${input} resize-y leading-relaxed`} />
          <p className="mt-1 text-right text-xs text-fi-text/55">{f.extra.length} / 1500</p>
        </Card>

        <Card icon={SlidersHorizontal} title="Quotas" sub="Ils protègent votre budget. Chaque valeur a un minimum et un maximum.">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {Object.entries(LIMIT_LABEL).map(([k, [label, hint]]) => { const [min, max] = view.choix.limits[k]; return (
              <label key={k} className="block"><span className="mb-1.5 block text-sm font-medium text-fi-text">{label}</span>
                <input type="number" min={min} max={max} value={f.limits[k]} onChange={(e) => up({ limits: { ...f.limits, [k]: e.target.value === '' ? '' : Number(e.target.value) } })} className={`${input} tabular-nums`} />
                <span className="mt-1 block text-xs text-fi-text/55">{hint} De {fmtInt(min)} à {fmtInt(max)}.</span></label>
            ); })}
          </div>
        </Card>
      </div>

      {/* ----- Essai et enregistrement */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-3xl border border-fi-light bg-white/95 p-3.5 shadow-[0_18px_40px_-18px_rgba(15,46,19,.45)] backdrop-blur">
        <button type="button" onClick={runTest} disabled={testing || saving} className="inline-flex items-center gap-2 rounded-full bg-fi-mint px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-fi-light disabled:opacity-50"><FlaskConical size={15} aria-hidden /> {testing ? 'Essai en cours…' : 'Tester ce réglage'}</button>
        <button type="submit" disabled={saving || testing} className="inline-flex items-center gap-2 rounded-full bg-fi-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-fi-dark disabled:opacity-50"><Save size={15} aria-hidden /> {saving ? 'Essai puis enregistrement…' : 'Enregistrer'}</button>
        <div className="min-w-0 flex-1 text-sm" role="status">
          {test && (test.ok
            ? <p className="flex items-center gap-1.5 text-emerald-800"><CheckCircle2 size={16} aria-hidden /> Réponse et appel d’outil réussis en {fmtInt(test.ms)} ms{test.reply ? ` : « ${test.reply} »` : ''}.</p>
            : <p className="flex items-center gap-1.5 text-rose-800"><XCircle size={16} aria-hidden /> Essai refusé : {test.erreur}</p>)}
          {msg && <p className={`flex items-center gap-1.5 ${msg.ok ? 'text-emerald-800' : 'text-rose-800'}`}>{msg.ok ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />} {msg.text}</p>}
          {!test && !msg && <p className="flex items-center gap-1.5 text-fi-text/60"><Info size={15} aria-hidden /> Un réglage actif n’est enregistré que si l’essai chez le fournisseur réussit.</p>}
        </div>
      </div>

      {/* ----- Journal */}
      <Card icon={ShieldCheck} title="Journal de sécurité" sub="Les 25 derniers événements : connexions, essais refusés, changements de clé et d’identifiants.">
        {view.journal.length ? (
          <ul className="divide-y divide-fi-light/70 text-sm">
            {view.journal.map((j, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
                <span className="font-medium text-slate-900">{j.event}{j.login ? <span className="font-normal text-fi-text/65"> · {j.login}</span> : null}</span>
                <span className="text-xs text-fi-text/55">{fmtDateTime(j.at)}{j.device ? ` · ${j.device}` : ''}{j.ip ? ` · ${j.ip}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-fi-text/55">Aucun événement pour l’instant.</p>}
        {view.reglages.updatedAt && <p className="mt-3 text-xs text-fi-text/55">Derniers réglages enregistrés le {fmtDateTime(view.reglages.updatedAt)}{view.reglages.updatedBy ? ` par ${view.reglages.updatedBy}` : ''}.</p>}
      </Card>
    </form>
  );
}
