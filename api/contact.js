// POST /api/contact — formulaire de contact : enregistre la demande (même table que
// Petit Pois), email à l'entreprise, accusé de réception au client (dans sa langue),
// notification Telegram au propriétaire.

import { error, json, readJson, getIp, hashIp } from './_lib/http.js';
import { store } from './_lib/store.js';
import { getSettings } from './_lib/settings.js';
import { buildLead, persistLead } from './_lib/leads.js';
import { notifyLead } from './_lib/petitpois.js';
import { LANGS } from '../src/data/infos.js';

export async function POST(request) {
  try {
    const body = await readJson(request);
    if (!body) return error(400, 'Requête invalide.');
    if (body.website) return json({ ok: true }); // honeypot : les bots remplissent ce champ caché

    const count = await store().bumpCounter(`contact:${hashIp(getIp(request))}`, 60 * 60 * 24).catch(() => 0);
    if (count > 5) return error(429, "Trop de messages envoyés aujourd'hui.");

    const settings = await getSettings();
    const lang = LANGS.includes(body.lang) ? body.lang : 'fr';
    const built = buildLead({
      type: body.subject,
      client: { nom: body.nom, email: body.email, telephone: body.telephone, organisation: body.organisation },
      service: body.service || null,
      details: { message: body.message, surface_ha: body.surface, localisation: body.localisation, formation: body.formation },
    }, { services: settings.listes.services.filter((s) => s.visible !== false), lang, source: 'formulaire', requirePhone: false });
    if (!built.ok) return error(400, built.erreurs.join(' · '));
    const saved = await persistLead(built.lead);
    if (!saved.ok) return error(429, saved.erreurs.join(' '));
    const notif = await notifyLead(saved.lead);
    return json({ ok: true, numero: saved.lead.numero, ack: notif.ack });
  } catch (e) {
    console.error('contact', e);
    if (e.code === 'CONFIG') return error(503, e.message, { code: 'config' });
    return error(500, 'Erreur serveur.');
  }
}
