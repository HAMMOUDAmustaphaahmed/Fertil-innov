// Tableau de bord de l'espace de pilotage : demandes (devis…), travail à faire, activité par jour / semaine / mois,
// audience du site, activité de Petit Pois. Exports PDF et Excel.
import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, RefreshCw, Search, TrendingUp, TrendingDown, Inbox, Clock, Target, Timer, Users, MousePointerClick, MessageSquare, ClipboardList, ChevronDown, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { api, summarize, presetRange, autoStep, PRESETS, STEPS, TYPES, STATUTS, statut, fmtInt, fmtDay, fmtDateTime, periodLabel, addDays } from './data';
import { StackedColumns, LineChart, HBars, HourStrip, Legend, Spark, BRAND } from './charts';

const todayParis = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function Panel({ title, sub, right, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-fi-light/80 bg-white p-5 shadow-[0_1px_0_rgba(15,46,19,.03),0_12px_30px_-22px_rgba(15,46,19,.35)] md:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-display text-[1.08rem] font-semibold leading-tight text-slate-900">{title}</h2>{sub && <p className="mt-0.5 text-xs text-fi-text/60">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, hint, evol, spark, tone = 'default', delay = 0 }) {
  const dark = tone === 'dark';
  return (
    <div className={`kpi-in relative overflow-hidden rounded-3xl p-5 ${dark ? 'bg-gradient-to-br from-[#128f88] via-[#27a37a] to-[#6fbe4e] text-white shadow-[0_18px_40px_-22px_rgba(18,143,136,.9)]' : 'border border-slate-200/80 bg-white'}`} style={{ animationDelay: `${delay}ms` }}>
      {dark && <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/25 blur-2xl" />}
      <div className="relative flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${dark ? 'bg-white/20 text-white' : tone === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-fi-mint text-fi-primary'}`}><Icon size={17} aria-hidden /></span>
        {spark && <Spark values={spark} color={dark ? '#ffffff' : BRAND} />}
      </div>
      <p className={`relative mt-4 font-display text-[2rem] font-semibold leading-none tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`relative mt-1.5 text-sm font-medium ${dark ? 'text-white/85' : 'text-fi-text'}`}>{label}</p>
      <p className={`relative mt-1 flex flex-wrap items-center gap-x-2 text-xs ${dark ? 'text-white/60' : 'text-fi-text/60'}`}>
        {evol !== null && evol !== undefined && <span className={`inline-flex items-center gap-0.5 font-semibold ${dark ? 'text-white' : evol >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{evol >= 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}{evol > 0 ? '+' : ''}{evol} %</span>}
        <span>{hint}</span>
      </p>
    </div>
  );
}

function Badge({ id }) { const s = statut(id); return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.tone}`}>{s.label}</span>; }

function StatusSelect({ lead, onChange, busy }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Changer le statut de {lead.numero}</span>
      <select value={lead.statut} disabled={busy} onChange={(e) => onChange(lead, e.target.value)} className={`appearance-none rounded-full py-1.5 pl-3 pr-7 text-[11px] font-semibold outline-none ring-fi-primary focus-visible:ring-2 disabled:opacity-50 ${statut(lead.statut).tone}`}>
        {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2" aria-hidden />
    </label>
  );
}

function LeadCard({ l, onStatus, busy }) {
  return (
    <li className="rounded-2xl border border-fi-light/80 p-4 transition hover:border-fi-primary/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-semibold text-fi-primary">{l.numero} <span className="font-sans font-normal text-fi-text/55">· {l.type_label} · reçue le {fmtDay(l.jour)}</span></p>
        <div className="flex items-center gap-2">
          {l.age_j >= 2 && l.statut === 'nouvelle' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-800"><AlertTriangle size={12} aria-hidden /> {l.age_j} j sans réponse</span>}
          <StatusSelect lead={l} onChange={onStatus} busy={busy} />
        </div>
      </div>
      <p className="mt-2 font-semibold text-slate-900">{l.nom || 'Client sans nom'}{l.organisation ? <span className="font-normal text-fi-text/65"> · {l.organisation}</span> : null}</p>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fi-text/75">
        {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-fi-primary"><Mail size={12} aria-hidden />{l.email}</a>}
        {l.telephone && <a href={`tel:${l.telephone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-fi-primary"><Phone size={12} aria-hidden />{l.telephone}</a>}
        {l.localisation && <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{l.localisation}{l.surface_ha ? ` · ${l.surface_ha} ha` : ''}</span>}
      </p>
      {l.service && <p className="mt-1.5 text-xs font-medium text-fi-dark">{l.service}</p>}
      {l.resume && <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-fi-text/80">{l.resume}</p>}
    </li>
  );
}

export default function Dashboard({ onError }) {
  const [preset, setPreset] = useState('30j');
  const [range, setRange] = useState(() => presetRange('30j', todayParis()));
  const [step, setStep] = useState('jour');
  const [stepAuto, setStepAuto] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [q, setQ] = useState(''); const [fType, setFType] = useState(''); const [fStatut, setFStatut] = useState('');
  const [busyLead, setBusyLead] = useState(null);
  const [shown, setShown] = useState(25);

  const load = async (r = range) => {
    setLoading(true);
    try { const d = await api(`/api/admin/dashboard?du=${r.du}&au=${r.au}`); setData(d); if (stepAuto) setStep(autoStep(d.periode.du, d.periode.au)); onError?.(null); }
    catch (e) { onError?.(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(range); }, [range.du, range.au]); // eslint-disable-line react-hooks/exhaustive-deps

  const sum = useMemo(() => (data ? summarize(data, step) : null), [data, step]);
  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.demandes.filter((r) => (!fType || r.type === fType) && (!fStatut || r.statut === fStatut) && (!needle || [r.numero, r.nom, r.organisation, r.email, r.service, r.localisation, r.resume].join(' ').toLowerCase().includes(needle)));
  }, [data, q, fType, fStatut]);

  const pick = (id) => { setPreset(id); setStepAuto(true); setRange(presetRange(id, todayParis())); };
  const setCustom = (k, v) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return; setPreset('perso'); setStepAuto(true); setRange((r) => { const n = { ...r, [k]: v }; return n.du > n.au ? { du: n.au, au: n.du } : n; }); };
  const changeStatus = async (lead, statutId) => {
    setBusyLead(lead.numero);
    try { await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'statut', numero: lead.numero, statut: statutId }) }); await load(); }
    catch (e) { onError?.(e); } finally { setBusyLead(null); }
  };
  const doExport = async (kind) => {
    if (!data || exporting) return;
    setExporting(kind);
    try { const m = await import('./exports'); await (kind === 'pdf' ? m.exportPdf : m.exportExcel)(data, sum, step); }
    catch (e) { onError?.(new Error(`Export impossible : ${e.message}`)); } finally { setExporting(null); }
  };

  const chip = (active) => `rounded-full px-3.5 py-2 text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow' : 'bg-white text-fi-text/80 hover:bg-fi-mint'}`;

  return (
    <div className="space-y-5">
      <style>{'@keyframes kpi-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} .kpi-in{animation:kpi-in .6s cubic-bezier(.16,1,.3,1) both} @media (prefers-reduced-motion:reduce){.kpi-in{animation:none}}'}</style>

      {/* ----- Filtres : une seule rangée au-dessus de tout */}
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-fi-light/80 bg-fi-mint/50 p-2.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Période">
          {PRESETS.map(([id, label]) => <button key={id} type="button" onClick={() => pick(id)} aria-pressed={preset === id} className={chip(preset === id)}>{label}</button>)}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-fi-text/80">
          <label className="sr-only" htmlFor="du">Du</label><input id="du" type="date" value={range.du} max={range.au} onChange={(e) => setCustom('du', e.target.value)} className="bg-transparent outline-none" />
          <span aria-hidden>→</span>
          <label className="sr-only" htmlFor="au">Au</label><input id="au" type="date" value={range.au} max={todayParis()} onChange={(e) => setCustom('au', e.target.value)} className="bg-transparent outline-none" />
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Regroupement">
          {STEPS.map(([id, label]) => <button key={id} type="button" onClick={() => { setStep(id); setStepAuto(false); }} aria-pressed={step === id} className={chip(step === id)}>{label}</button>)}
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button type="button" onClick={() => load()} disabled={loading} aria-label="Actualiser" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-fi-dark hover:bg-fi-mint disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button type="button" onClick={() => doExport('pdf')} disabled={!data || !!exporting} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-fi-mint disabled:opacity-50"><FileText size={15} aria-hidden /> {exporting === 'pdf' ? 'Création…' : 'PDF'}</button>
          <button type="button" onClick={() => doExport('excel')} disabled={!data || !!exporting} className="inline-flex items-center gap-1.5 rounded-full bg-fi-primary px-4 py-2 text-sm font-semibold text-white hover:bg-fi-dark disabled:opacity-50"><FileSpreadsheet size={15} aria-hidden /> {exporting === 'excel' ? 'Création…' : 'Excel'}</button>
        </div>
      </div>

      {!sum ? <p className="py-16 text-center text-sm text-fi-text/60">{loading ? 'Chargement du tableau de bord…' : 'Données indisponibles.'}</p> : (
        <>
          <p className="text-sm text-fi-text/65">Activité <strong className="text-slate-900">{periodLabel(data.periode)}</strong>, comparée aux {data.periode.jours} jours précédents. Mise à jour le {fmtDateTime(data.genere_le)}.</p>

          {/* ----- Chiffres clés */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Inbox} tone="dark" label="Demandes reçues" value={fmtInt(sum.kpi.total)} evol={sum.kpi.totalEvol} hint="vs période précédente" spark={sum.periodes.map((p) => p.total)} />
            <Kpi icon={ClipboardList} label="Demandes de devis" value={fmtInt(sum.kpi.devis)} evol={sum.kpi.devisEvol} hint="vs période précédente" spark={sum.periodes.map((p) => p.devis)} delay={60} />
            <Kpi icon={Clock} tone={sum.kpi.enRetard ? 'warn' : 'default'} label="À traiter aujourd’hui" value={fmtInt(sum.kpi.aTraiter)} hint={`${sum.kpi.nouvelles} nouvelle${sum.kpi.nouvelles > 1 ? 's' : ''}${sum.kpi.enRetard ? ` · ${sum.kpi.enRetard} de plus de 2 jours` : ''}`} delay={120} />
            <Kpi icon={Target} label="Taux de transformation" value={sum.kpi.transformation === null ? '—' : `${String(sum.kpi.transformation).replace('.', ',')} %`} hint={`${sum.kpi.gagnees} gagnée${sum.kpi.gagnees > 1 ? 's' : ''} · ${sum.kpi.perdues} perdue${sum.kpi.perdues > 1 ? 's' : ''}`} delay={180} />
            <Kpi icon={Timer} label="Délai moyen de prise en charge" value={sum.kpi.delaiMoyenH === null ? '—' : `${String(sum.kpi.delaiMoyenH).replace('.', ',')} h`} hint="de la réception au premier traitement" delay={240} />
            <Kpi icon={Users} label="Visites du site" value={fmtInt(sum.kpi.visites)} hint={`${fmtInt(sum.kpi.pagesVues)} pages vues`} spark={sum.periodes.map((p) => p.visites)} delay={300} />
            <Kpi icon={MousePointerClick} label="Visites transformées en demande" value={sum.kpi.conversion === null ? '—' : `${String(sum.kpi.conversion).replace('.', ',')} %`} hint="demandes ÷ visites" delay={360} />
            <Kpi icon={MessageSquare} label="Échanges avec Petit Pois" value={fmtInt(sum.kpi.requetes)} hint={`${fmtInt(sum.kpi.tokens)} tokens · ${data.ia.model}`} spark={sum.periodes.map((p) => p.requetes)} delay={420} />
          </div>

          {/* ----- Activité dans le temps */}
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel className="xl:col-span-2" title={`Demandes ${STEPS.find(([id]) => id === step)[1].toLowerCase()}`} sub="Chaque colonne additionne les quatre types de demande." right={<Legend series={sum.parType} />}>
              <StackedColumns periods={sum.periodes} series={TYPES} caption={`Demandes ${periodLabel(data.periode)}, par ${step} et par type`} />
            </Panel>
            <Panel title="Où en sont les demandes" sub="Statut actuel des demandes reçues sur la période.">
              <HBars items={sum.parStatut} />
            </Panel>
          </div>

          {/* ----- Travail à faire */}
          <Panel title="Travail à faire" sub={`${sum.aTraiter.length} demande${sum.aTraiter.length > 1 ? 's' : ''} ouverte${sum.aTraiter.length > 1 ? 's' : ''}, toutes périodes confondues — les plus anciennes en premier.`}>
            {sum.aTraiter.length ? <ul className="grid gap-3 lg:grid-cols-2">{sum.aTraiter.slice(0, 12).map((l) => <LeadCard key={l.numero} l={l} onStatus={changeStatus} busy={busyLead === l.numero} />)}</ul> : <p className="rounded-2xl bg-fi-mint/60 px-4 py-6 text-center text-sm text-fi-dark">Rien à traiter : tout est à jour.</p>}
            {sum.aTraiter.length > 12 && <p className="mt-3 text-xs text-fi-text/60">+ {sum.aTraiter.length - 12} autres : la liste complète est dans l’export Excel, feuille « À traiter ».</p>}
          </Panel>

          {/* ----- Répartitions */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="Services les plus demandés"><HBars items={sum.parService} empty="Aucun service précisé sur la période." /></Panel>
            <Panel title="D’où viennent les demandes" sub="Canal, puis langue du visiteur.">
              <HBars items={sum.parSource} />
              <div className="mt-5 border-t border-fi-light/70 pt-4"><HBars items={sum.parLangue} color="#8bc34a" /></div>
            </Panel>
            <Panel title="Quand arrivent les demandes" sub="Heure de Paris.">
              <HourStrip heures={sum.heures} />
              <div className="mt-4 border-t border-fi-light/70 pt-4"><HBars items={sum.semaine} /></div>
            </Panel>
          </div>

          {/* ----- Audience */}
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel className="xl:col-span-2" title="Visites du site" sub="Mesure sans cookie ni donnée personnelle : une visite = un chargement du site.">
              {sum.audience ? <LineChart periods={sum.periodes} field="visites" label="Visites" caption={`Visites du site ${periodLabel(data.periode)}`} /> : <p className="text-sm text-fi-text/55">Mesure d’audience indisponible.</p>}
            </Panel>
            <Panel title="Pages et provenances">
              {sum.audience ? (<><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fi-text/50">Pages les plus vues</p><HBars items={sum.audience.pages.slice(0, 5)} empty="Pas encore de visite mesurée." />
                <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-fi-text/50">Provenance des visites</p><HBars items={sum.audience.provenances.slice(0, 5)} color="#8bc34a" empty="Pas encore de visite mesurée." /></>) : <p className="text-sm text-fi-text/55">Mesure d’audience indisponible.</p>}
            </Panel>
          </div>

          {/* ----- Toutes les demandes de la période */}
          <Panel title="Demandes de la période" sub={`${filtered.length} sur ${data.demandes.length} affichée${filtered.length > 1 ? 's' : ''}.`}
            right={(
              <div className="flex flex-wrap gap-2">
                <label className="relative"><span className="sr-only">Rechercher</span><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fi-text/45" aria-hidden />
                  <input value={q} onChange={(e) => { setQ(e.target.value); setShown(25); }} placeholder="Nom, n°, lieu…" className="w-44 rounded-full border border-fi-light bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-fi-primary" /></label>
                <select aria-label="Filtrer par type" value={fType} onChange={(e) => setFType(e.target.value)} className="rounded-full border border-fi-light bg-white px-3 py-2 text-sm outline-none focus:border-fi-primary"><option value="">Tous les types</option>{TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                <select aria-label="Filtrer par statut" value={fStatut} onChange={(e) => setFStatut(e.target.value)} className="rounded-full border border-fi-light bg-white px-3 py-2 text-sm outline-none focus:border-fi-primary"><option value="">Tous les statuts</option>{STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              </div>
            )}>
            {filtered.length ? (
              <>
                {/* tableau sur grand écran, cartes sur téléphone */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead><tr className="border-b border-fi-light text-xs uppercase tracking-wide text-fi-text/55">{['N°', 'Reçue le', 'Type', 'Client', 'Service', 'Lieu', 'Canal', 'Statut'].map((h) => <th key={h} className="px-2 py-2.5 font-semibold">{h}</th>)}</tr></thead>
                    <tbody>
                      {filtered.slice(0, shown).map((r) => (
                        <tr key={r.numero} className="border-b border-fi-light/60 align-top last:border-0 hover:bg-fi-mint/40">
                          <td className="px-2 py-2.5 font-mono text-xs font-semibold text-fi-primary">{r.numero}</td>
                          <td className="whitespace-nowrap px-2 py-2.5 text-fi-text/75">{fmtDateTime(r.cree_le)}</td>
                          <td className="px-2 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TYPES.find((t) => t.id === r.type)?.color }} aria-hidden />{r.type_label}</span></td>
                          <td className="px-2 py-2.5"><p className="font-medium text-slate-900">{r.nom || '—'}</p><p className="text-xs text-fi-text/60">{[r.organisation, r.email].filter(Boolean).join(' · ')}</p></td>
                          <td className="px-2 py-2.5 text-fi-text/80">{r.service || '—'}</td>
                          <td className="px-2 py-2.5 text-fi-text/80">{r.localisation || '—'}</td>
                          <td className="px-2 py-2.5 text-fi-text/80">{r.source}</td>
                          <td className="px-2 py-2.5"><StatusSelect lead={r} onChange={changeStatus} busy={busyLead === r.numero} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-3 md:hidden">{filtered.slice(0, shown).map((r) => <LeadCard key={r.numero} l={{ ...r, age_j: 0 }} onStatus={changeStatus} busy={busyLead === r.numero} />)}</ul>
                {filtered.length > shown && <button type="button" onClick={() => setShown((n) => n + 50)} className="mt-4 rounded-full bg-fi-mint px-4 py-2 text-sm font-semibold text-fi-dark hover:bg-fi-light">Afficher 50 de plus</button>}
              </>
            ) : <p className="rounded-2xl bg-fi-mint/60 px-4 py-6 text-center text-sm text-fi-dark">{data.demandes.length ? 'Aucune demande ne correspond à ces filtres.' : 'Aucune demande sur cette période.'}</p>}
          </Panel>
          <p className="pb-4 text-center text-xs text-fi-text/50">Période précédente : du {fmtDay(data.periode.precedente.du, true)} au {fmtDay(addDays(data.periode.precedente.au, 0), true)} · {data.precedent.total} demande{data.precedent.total > 1 ? 's' : ''}.</p>
        </>
      )}
    </div>
  );
}

export { Badge };
