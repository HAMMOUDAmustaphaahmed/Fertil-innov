// Demandes clients (« leads ») : devis, formation, information, partenariat.
// Créées par Petit Pois (outil create_lead) ou par le formulaire de contact.
// Validation stricte côté serveur, numéro lisible FI-XXXXXX, notifications
// (email à l'entreprise + accusé de réception au client + Telegram au propriétaire).

import { randomBytes } from 'node:crypto';
import { store } from './store.js';
import { env } from './env.js';
import { L } from '../../src/data/site.js';
import { LANGS } from '../../src/data/infos.js';

export const LEAD_TYPES = ['devis', 'formation', 'info', 'partenariat'];
export const LEAD_STATUS = ['nouvelle', 'en_cours', 'devis_envoye', 'gagnee', 'perdue', 'traitee'];
export const STATUS_LABEL = { nouvelle: 'nouvelle', en_cours: 'en cours', devis_envoye: 'devis envoyé', gagnee: 'gagnée', perdue: 'perdue', traitee: 'traitée' };
export const TYPE_LABEL = {
  fr: { devis: 'Demande de devis', formation: 'Formation', info: 'Question', partenariat: 'Partenariat / R&D' },
  en: { devis: 'Quote request', formation: 'Training', info: 'Question', partenariat: 'Partnership / R&D' },
  es: { devis: 'Solicitud de presupuesto', formation: 'Formación', info: 'Pregunta', partenariat: 'Colaboración / I+D' },
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const normPhone = (s) => String(s || '').replace(/[\s.\-()]/g, '');
const isPhone = (s) => /^\+?\d{9,15}$/.test(normPhone(s));

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newNumero() {
  const b = randomBytes(6);
  return 'FI-' + [...b].map((x) => ALPHABET[x % ALPHABET.length]).join('');
}

/**
 * Valide et normalise une demande. Retourne { ok, lead } ou { ok:false, erreurs }.
 * `services` = liste des services visibles (pour vérifier l'id).
 */
export function buildLead(input = {}, { services = [], lang = 'fr', source = 'chat', requirePhone = true } = {}) {
  const erreurs = [];
  const type = LEAD_TYPES.includes(input.type) ? input.type : null;
  if (!type) erreurs.push(`type invalide (attendu : ${LEAD_TYPES.join(', ')})`);
  const c = input.client || {};
  const nom = String(c.nom || '').trim().slice(0, 120);
  const email = String(c.email || '').trim().toLowerCase().slice(0, 200);
  const telephone = String(c.telephone || '').trim().slice(0, 40);
  const organisation = String(c.organisation || '').trim().slice(0, 160);
  if (nom.length < 2) erreurs.push('nom du client manquant');
  if (!isEmail(email)) erreurs.push('email invalide');
  if (telephone && !isPhone(telephone)) erreurs.push('téléphone invalide (9 à 15 chiffres)');
  if (requirePhone && type === 'devis' && !telephone) erreurs.push('téléphone requis pour un devis');

  let service = String(input.service || '').trim().toLowerCase() || null;
  if (service && services.length && !services.some((s) => s.id === service)) {
    erreurs.push(`service inconnu « ${service} » (ids : ${services.map((s) => s.id).join(', ')})`);
  }
  const d = input.details || {};
  const details = {
    message: String(d.message || input.message || '').trim().slice(0, 3000) || null,
    surface_ha: d.surface_ha != null && d.surface_ha !== '' && Number.isFinite(Number(d.surface_ha)) ? Number(d.surface_ha) : null,
    localisation: String(d.localisation || '').trim().slice(0, 200) || null,
    formation: String(d.formation || '').trim().slice(0, 120) || null,
    type_site: String(d.type_site || '').trim().slice(0, 120) || null,
    echeance: String(d.echeance || '').trim().slice(0, 120) || null,
  };
  if (!details.message && !input.resume) erreurs.push('description du besoin manquante');
  if (erreurs.length) return { ok: false, erreurs };
  return {
    ok: true,
    lead: {
      numero: newNumero(), source, type, lang: LANGS.includes(lang) ? lang : 'fr',
      client: { nom, email, telephone: telephone ? normPhone(telephone).replace(/^0033/, '+33') : null, organisation: organisation || null },
      client_email: email, service, details,
      resume: String(input.resume || '').trim().slice(0, 2000) || null,
      status: 'nouvelle',
    },
  };
}

/** Vue « publique » (ticket dans le chat, emails). */
export function publicLead(lead, { services = [], lang = 'fr' } = {}) {
  const svc = services.find((s) => s.id === lead.service);
  return {
    numero: lead.numero, type: lead.type, type_label: TYPE_LABEL[lang]?.[lead.type] || lead.type,
    statut: STATUS_LABEL[lead.status] || lead.status,
    client: lead.client, service: svc ? L(svc.titre, lang) : lead.service,
    details: lead.details, resume: lead.resume, cree_le: lead.created_at,
  };
}

/** Vérifie les quotas puis enregistre la demande. Retourne { ok, lead } ou { ok:false, erreurs }. */
export async function persistLead(lead, { sessionId = null } = {}) {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  if (sessionId && (await store().countLeads('session_id', sessionId, since)) >= env.maxLeadsPerSession) {
    return { ok: false, erreurs: ['Nombre maximum de demandes atteint pour cette conversation. Propose le téléphone ou le formulaire (handoff_to_human).'] };
  }
  if ((await store().countLeads('client_email', lead.client_email, since)) >= env.maxLeadsPerEmailPerDay) {
    return { ok: false, erreurs: ["Cette adresse email a déjà envoyé plusieurs demandes aujourd'hui. Propose le téléphone."] };
  }
  const saved = await store().createLead({ ...lead, session_id: sessionId });
  return { ok: true, lead: saved };
}
