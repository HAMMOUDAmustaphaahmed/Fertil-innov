// GET /api/admin/overview — données du tableau de bord (demandes, stats, site).
// POST /api/admin/overview { action: 'statut', numero, statut, note } — action rapide.
import { json, error, readJson } from '../_lib/http.js';
import { isAdmin } from '../_lib/admin.js';
import { executeChefTool } from '../_lib/chef.js';
import { getSettings } from '../_lib/settings.js';
import { providerInfo } from '../_lib/llm.js';

const call = async (name, input) => JSON.parse((await executeChefTool(name, input)).result);

export async function GET(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  try {
    const [nouvelles, enCours, semaine, stats, settings] = await Promise.all([
      call('list_leads', { periode: 'toutes', statut: 'nouvelle' }),
      call('list_leads', { periode: 'toutes', statut: 'en_cours' }),
      call('list_leads', { periode: 'semaine', tous_statuts: true }),
      call('stats', { jours: 7 }),
      getSettings(),
    ]);
    return json({ nouvelles, enCours, semaine, stats, site: { nom: settings.nom, version: settings.version, police: settings.police, palette: settings.palette }, llm: providerInfo() });
  } catch (e) {
    console.error('admin/overview', e);
    return error(500, e.message);
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  const body = await readJson(request);
  try {
    if (body?.action === 'statut') return json(await call('update_lead_status', { numero: body.numero, statut: body.statut, note: body.note }));
    if (body?.action === 'redeploy') return json(await call('redeploy', {}));
    return error(400, 'Action inconnue.');
  } catch (e) { return error(500, e.message); }
}
