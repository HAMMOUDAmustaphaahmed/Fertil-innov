// GET /api/admin/dashboard?du=AAAA-MM-JJ&au=AAAA-MM-JJ — toutes les données du tableau de bord pour une période :
// demandes (devis, formations, questions, partenariats), travail à faire, activité de Petit Pois, audience du site.
// Le regroupement par jour / semaine / mois et les exports (PDF, Excel) sont faits dans la page à partir de ces lignes.
import { json, error } from '../_lib/http.js';
import { adminSession } from '../_lib/admin.js';
import { store } from '../_lib/store.js';
import { getSettings } from '../_lib/settings.js';
import { STATUS_LABEL, TYPE_LABEL } from '../_lib/leads.js';
import { audienceRange } from '../_lib/audience.js';
import { providerInfo } from '../_lib/llm.js';
import { ensureAi } from '../_lib/ai.js';
import { L } from '../../src/data/site.js';
import { parisNow } from '../../src/data/infos.js';

const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
// Jour (heure de Paris) d'un instant : les demandes sont rangées dans la journée vécue par l'équipe, pas en UTC.
const parisDay = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const parisHour = (iso) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }).format(new Date(iso))) % 24;

function row(l, services) {
  const svc = services.find((s) => s.id === l.service);
  const c = l.client || {}; const d = l.details || {};
  const handled = l.handled_at ? Math.max(0, (Date.parse(l.handled_at) - Date.parse(l.created_at)) / 3_600_000) : null;
  return {
    numero: l.numero, cree_le: l.created_at, jour: parisDay(l.created_at), heure: parisHour(l.created_at),
    type: l.type, type_label: TYPE_LABEL.fr[l.type] || l.type, statut: l.status, statut_label: STATUS_LABEL[l.status] || l.status,
    service: svc ? L(svc.titre) : l.service || '', langue: l.lang || 'fr', source: l.source === 'formulaire' ? 'Formulaire' : 'Petit Pois',
    nom: c.nom || '', email: c.email || l.client_email || '', telephone: c.telephone || '', organisation: c.organisation || '',
    localisation: d.localisation || '', surface_ha: d.surface_ha ?? null, resume: l.resume || d.message || '', notes: l.notes || '',
    traite_le: l.handled_at || null, delai_h: handled === null ? null : Math.round(handled * 10) / 10,
  };
}

export async function GET(request) {
  if (!adminSession(request)) return error(401, 'Non autorisé.');
  try {
    const url = new URL(request.url);
    const today = parisNow().isoDate;
    let au = isDay(url.searchParams.get('au')) ? url.searchParams.get('au') : today;
    let du = isDay(url.searchParams.get('du')) ? url.searchParams.get('du') : addDays(au, -29);
    if (du > au) [du, au] = [au, du];
    if (daysBetween(du, au) > 731) du = addDays(au, -731); // deux ans au maximum
    const span = daysBetween(du, au) + 1;
    const prevAu = addDays(du, -1); const prevDu = addDays(prevAu, -(span - 1));

    await ensureAi();
    const s = store();
    const settings = await getSettings();
    const services = settings.listes?.services || [];
    // Une marge d'un jour de chaque côté couvre le décalage UTC / Paris ; le tri exact se fait sur le jour de Paris.
    const [all, usage, audience, ouvertes] = await Promise.all([
      s.listLeads({ fromIso: `${addDays(prevDu, -1)}T00:00:00Z`, toIso: `${addDays(au, 2)}T00:00:00Z`, limit: 5000 }),
      s.usageSince(du).catch(() => []),
      audienceRange(du, au).catch((e) => ({ erreur: e.message })),
      s.listLeads({ statuses: ['nouvelle', 'en_cours', 'devis_envoye'], limit: 500 }),
    ]);
    const rows = all.map((l) => row(l, services));
    const periode = rows.filter((r) => r.jour >= du && r.jour <= au);
    const precedente = rows.filter((r) => r.jour >= prevDu && r.jour <= prevAu);
    return json({
      periode: { du, au, jours: span, precedente: { du: prevDu, au: prevAu } },
      demandes: periode,
      precedent: { total: precedente.length, devis: precedente.filter((r) => r.type === 'devis').length, gagnees: precedente.filter((r) => r.statut === 'gagnee').length },
      a_traiter: ouvertes.map((l) => row(l, services)),
      petit_pois: usage.filter((u) => String(u.day) <= au).map((u) => ({ jour: String(u.day).slice(0, 10), requetes: Number(u.requests) || 0, tokens: Number(u.input_tokens || 0) + Number(u.cache_read_tokens || 0) + Number(u.cache_write_tokens || 0) + Number(u.output_tokens || 0) })),
      audience,
      ia: providerInfo(),
      site: { nom: settings.nom, version: settings.version },
      genere_le: new Date().toISOString(), aujourdhui: today,
    });
  } catch (e) {
    console.error('admin/dashboard', e);
    return error(500, e.message);
  }
}
