// Espace de pilotage — appels au serveur, dates et regroupements (jour / semaine / mois).
// Partagé par le tableau de bord et par les exports PDF / Excel : les deux affichent exactement les mêmes chiffres.

export async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Erreur'); e.status = r.status; e.data = data; throw e; }
  return data;
}

// ----- Libellés et couleurs
// Types de demande : couleurs catégorielles fixes (une couleur suit toujours le même type, quel que soit le filtre).
export const TYPES = [
  { id: 'devis', label: 'Devis', color: '#2a78d6' },
  { id: 'formation', label: 'Formation', color: '#eb6834' },
  { id: 'info', label: 'Question', color: '#1baf7a' },
  { id: 'partenariat', label: 'Partenariat', color: '#eda100' },
];
export const STATUTS = [
  { id: 'nouvelle', label: 'Nouvelle', tone: 'bg-amber-100 text-amber-900', hex: 'FFF3CD' },
  { id: 'en_cours', label: 'En cours', tone: 'bg-sky-100 text-sky-900', hex: 'DCEBFA' },
  { id: 'devis_envoye', label: 'Devis envoyé', tone: 'bg-violet-100 text-violet-900', hex: 'E8E1FA' },
  { id: 'gagnee', label: 'Gagnée', tone: 'bg-emerald-100 text-emerald-900', hex: 'D8F0DD' },
  { id: 'perdue', label: 'Perdue', tone: 'bg-rose-100 text-rose-900', hex: 'F9DADA' },
  { id: 'traitee', label: 'Traitée', tone: 'bg-slate-200 text-slate-800', hex: 'E6E8EA' },
];
export const statut = (id) => STATUTS.find((s) => s.id === id) || { id, label: id, tone: 'bg-slate-100 text-slate-700', hex: 'EEEEEE' };
export const OUVERTS = ['nouvelle', 'en_cours', 'devis_envoye'];

// ----- Dates (jours « AAAA-MM-JJ », calculés sans fuseau)
const utc = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (day, n) => { const d = utc(day); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((utc(b) - utc(a)) / 86_400_000);
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const fmtDay = (day, year = false) => { const d = utc(day); return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}${year ? ` ${d.getUTCFullYear()}` : ''}`; };
export const fmtDayLong = (day) => { const d = utc(day); return `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export const fmtDateTime = (isoTs) => new Date(isoTs).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtInt = (n) => Number(n || 0).toLocaleString('fr-FR');
export const weekdayIndex = (day) => (utc(day).getUTCDay() + 6) % 7; // 0 = lundi

export function presetRange(preset, today) {
  const d = utc(today);
  if (preset === 'jour') return { du: today, au: today };
  if (preset === '7j') return { du: addDays(today, -6), au: today };
  if (preset === '30j') return { du: addDays(today, -29), au: today };
  if (preset === 'mois') return { du: iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))), au: today };
  if (preset === '3m') return { du: addDays(today, -89), au: today };
  if (preset === '12m') return { du: iso(new Date(Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate() + 1))), au: today };
  return null;
}
export const PRESETS = [['jour', 'Aujourd’hui'], ['7j', '7 jours'], ['30j', '30 jours'], ['mois', 'Ce mois'], ['3m', '3 mois'], ['12m', '12 mois']];
/** Pas conseillé pour la période : par jour jusqu'à 5 semaines, par semaine jusqu'à 6 mois, par mois au-delà. */
export const autoStep = (du, au) => { const n = diffDays(du, au) + 1; return n <= 35 ? 'jour' : n <= 185 ? 'semaine' : 'mois'; };
export const STEPS = [['jour', 'Par jour'], ['semaine', 'Par semaine'], ['mois', 'Par mois']];

// ----- Regroupement par période
const bucketKey = (day, step) => {
  if (step === 'mois') return day.slice(0, 7);
  if (step === 'semaine') return addDays(day, -weekdayIndex(day)); // lundi de la semaine
  return day;
};
const bucketLabel = (key, step) => {
  if (step === 'mois') { const [y, m] = key.split('-').map(Number); return `${MOIS[m - 1]} ${y}`; }
  if (step === 'semaine') return `sem. du ${fmtDay(key)}`;
  return fmtDay(key);
};
const bucketShort = (key, step) => {
  if (step === 'mois') { const [y, m] = key.split('-').map(Number); return `${MOIS[m - 1]} ${String(y).slice(2)}`; }
  return fmtDay(key);
};

/** Liste ordonnée des périodes couvrant [du, au], même celles sans aucune demande. */
export function buckets(du, au, step) {
  const out = []; const seen = new Set();
  for (let d = du; d <= au; d = addDays(d, 1)) {
    const k = bucketKey(d, step);
    if (!seen.has(k)) { seen.add(k); out.push({ key: k, label: bucketLabel(k, step), short: bucketShort(k, step) }); }
  }
  return out;
}

const count = (rows, f) => { const o = {}; for (const r of rows) { const k = f(r) || '—'; o[k] = (o[k] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })); };

/** Tous les chiffres du tableau de bord pour une période et un pas donnés. */
export function summarize(data, step) {
  const { du, au } = data.periode;
  const rows = data.demandes;
  const bs = buckets(du, au, step);
  const byBucket = Object.fromEntries(bs.map((b) => [b.key, { ...b, total: 0, gagnees: 0, visites: 0, pages_vues: 0, requetes: 0, ...Object.fromEntries(TYPES.map((t) => [t.id, 0])) }]));
  for (const r of rows) { const b = byBucket[bucketKey(r.jour, step)]; if (!b) continue; b.total += 1; if (b[r.type] !== undefined) b[r.type] += 1; if (r.statut === 'gagnee') b.gagnees += 1; }
  const aud = data.audience && !data.audience.erreur ? data.audience : null;
  for (const [day, v] of Object.entries(aud?.par_jour || {})) { const b = byBucket[bucketKey(day, step)]; if (b) { b.visites += v.visites; b.pages_vues += v.pages_vues; } }
  for (const u of data.petit_pois || []) { const b = byBucket[bucketKey(u.jour, step)]; if (b) b.requetes += u.requetes; }

  const gagnees = rows.filter((r) => r.statut === 'gagnee').length;
  const perdues = rows.filter((r) => r.statut === 'perdue').length;
  const delais = rows.map((r) => r.delai_h).filter((d) => d !== null && d !== undefined);
  const visites = aud?.visites || 0;
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
  const evol = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);
  const heures = Array.from({ length: 24 }, (_, h) => ({ h, value: rows.filter((r) => r.heure === h).length }));
  const semaine = JOURS_LONG.map((label, i) => ({ label, value: rows.filter((r) => weekdayIndex(r.jour) === i).length }));
  const now = Date.parse(data.genere_le);
  const aTraiter = (data.a_traiter || []).map((r) => ({ ...r, age_j: Math.max(0, Math.floor((now - Date.parse(r.cree_le)) / 86_400_000)) })).sort((a, b) => b.age_j - a.age_j);
  const devis = rows.filter((r) => r.type === 'devis').length;

  return {
    periodes: bs.map((b) => byBucket[b.key]),
    kpi: {
      total: rows.length, totalEvol: evol(rows.length, data.precedent.total),
      devis, devisEvol: evol(devis, data.precedent.devis),
      aTraiter: aTraiter.length, nouvelles: aTraiter.filter((r) => r.statut === 'nouvelle').length, enRetard: aTraiter.filter((r) => r.statut === 'nouvelle' && r.age_j >= 2).length,
      gagnees, perdues, transformation: pct(gagnees, gagnees + perdues),
      delaiMoyenH: delais.length ? Math.round((delais.reduce((a, b) => a + b, 0) / delais.length) * 10) / 10 : null,
      visites, pagesVues: aud?.pages_vues || 0, conversion: pct(rows.length, visites),
      requetes: (data.petit_pois || []).reduce((n, u) => n + u.requetes, 0), tokens: (data.petit_pois || []).reduce((n, u) => n + u.tokens, 0),
      surfaceHa: Math.round(rows.reduce((n, r) => n + (Number(r.surface_ha) || 0), 0) * 10) / 10,
    },
    parType: TYPES.map((t) => ({ ...t, value: rows.filter((r) => r.type === t.id).length })),
    parStatut: STATUTS.map((s) => ({ label: s.label, id: s.id, value: rows.filter((r) => r.statut === s.id).length })),
    parService: count(rows.filter((r) => r.service), (r) => r.service).slice(0, 8),
    parSource: count(rows, (r) => r.source),
    parLangue: count(rows, (r) => ({ fr: 'Français', en: 'Anglais', es: 'Espagnol' }[r.langue] || r.langue)),
    parLieu: count(rows.filter((r) => r.localisation), (r) => r.localisation).slice(0, 6),
    heures, semaine, aTraiter,
    audience: aud ? { pages: Object.entries(aud.pages).map(([label, value]) => ({ label, value })), provenances: Object.entries(aud.provenances).map(([label, value]) => ({ label, value })), appareils: Object.entries(aud.appareils).map(([label, value]) => ({ label, value })) } : null,
  };
}

export const periodLabel = (p) => (p.du === p.au ? fmtDayLong(p.du) : `du ${fmtDay(p.du, true)} au ${fmtDay(p.au, true)}`);
