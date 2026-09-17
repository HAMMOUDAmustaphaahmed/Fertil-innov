// « Le Chef » : l'agent du propriétaire. Même moteur que Petit Pois (runTurn),
// mais des outils d'action : demandes clients, emails, statistiques… et le
// pilotage complet du site (textes, coordonnées, horaires, palette, police,
// images, listes de contenu, chiffres). Le propriétaire écrit en français ;
// les textes du site sont traduits automatiquement en anglais et en espagnol.
// Accessible uniquement après autorisation (Telegram : /start <mot de passe> ; web : /admin).

import { store } from './store.js';
import { env } from './env.js';
import { runTurn, looksLikeFakeAction, NUDGE_TEXT, nullableOptionals } from './llm.js';
import { STATUS_LABEL, LEAD_STATUS, LEAD_TYPES, TYPE_LABEL } from './leads.js';
import { sendCustomEmail } from './emails.js';
import { getSettings, updateSettings, undoSettings, settingsHistory, IMAGE_SLOTS, PALETTE_PRESETS, PALETTE_DEFAULT, FONT_PRESETS, LISTES, isHex, resolveImageUrl, triggerRedeploy } from './settings.js';
import { toMultilang } from './i18n.js';
import { CONTENT, CONTENT_PAGES } from '../../src/data/content.js';
import { L } from '../../src/data/site.js';
import { parisNow, horairesAffichage } from '../../src/data/infos.js';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export async function buildChefSystem() {
  const s = await getSettings();
  return `Tu es « le Chef », assistant de gestion de ${s.nom} (ingénierie écologique, microbiologie des sols, ${s.entreprise.ville}). Tu parles au propriétaire ou à son équipe, jamais aux clients. Tu agis via tes outils.

Règles :
- Vérité : n'annonce une action que si l'outil répond ok:true. Sinon dis-le et corrige (bon outil, bons champs).
- Confirmation « oui » explicite requise avant : envoyer un email à un client, supprimer un élément (service, article, membre…), marquer une demande perdue. Tout le reste se fait directement, puis résume en une phrase.
- Le site est trilingue (français, anglais, espagnol). Le propriétaire écrit en français : tu passes le texte français aux outils, la traduction est automatique. Ne traduis pas toi-même.
- Quel outil : nom/slogan/coordonnées/GPS/LinkedIn → set_info · n'importe quel texte d'interface (titres, paragraphes, boutons, message d'accueil de Petit Pois, descriptions Google…) → list_content pour trouver la clé puis set_content · services, activités, expertise, formations, FAQ, articles du blog, équipe, partenaires, réalisations, arguments « pourquoi nous » → manage_list (lister d'abord pour connaître les ids) · chiffres clés (projets, hectares, satisfaction, CO₂…) → set_chiffres · horaires → set_hours · couleurs → set_palette (list_palettes pour les palettes prêtes) · police → set_fonts · photo [PHOTO : url] → set_image (si l'emplacement n'est pas dit : list_image_slots puis propose 2-3 emplacements et attends) ou manage_list avec champ image pour illustrer un membre, un article, un partenaire ou une réalisation. Si le propriétaire veut changer une image sans l'avoir envoyée, demande-lui d'envoyer la photo directement dans la conversation (jamais « donne-moi une URL ») ; une URL reste acceptée s'il la propose · demandes clients → list_leads / get_lead / update_lead_status · réponse à un client → send_email_to_client · ce que demandent les visiteurs → customer_insights · statistiques → stats · « annule » / « reviens en arrière » → undo_last_change · après des changements de contenu importants, propose redeploy (met à jour les pages pré-rendues pour Google et les IA ; les visiteurs voient déjà les changements immédiatement).
- Ne devine jamais un numéro de demande (list_leads).
- Français, tutoiement, ton direct, messages courts avec tirets et quelques emojis (🌱📩✅⚠️). Pas de tableaux ni de titres #. Dates depuis le contexte fourni (heure de Paris).

Entreprise : ${s.entreprise.adresse}, ${s.entreprise.codePostal} ${s.entreprise.ville} · ${s.entreprise.telephone} · ${s.entreprise.email}. Horaires : ${horairesAffichage(s.horaires).map((h) => `${h.jour} ${h.heures}`).join(' · ')}.`;
}

const PERIODES = ['aujourdhui', 'hier', 'semaine', 'mois', 'toutes', 'dates'];

const RAW_CHEF_TOOLS = [
  { name: 'list_leads', description: `Liste les demandes clients. periode: ${PERIODES.join('|')} (du/au AAAA-MM-JJ pour dates). Par défaut : nouvelles + en cours ; statut (${LEAD_STATUS.join('|')}) ou type (${LEAD_TYPES.join('|')}) pour filtrer ; tous_statuts pour tout.`, input_schema: { type: 'object', properties: { periode: { type: 'string', enum: PERIODES }, du: { type: 'string' }, au: { type: 'string' }, statut: { type: 'string', enum: LEAD_STATUS }, type: { type: 'string', enum: LEAD_TYPES }, tous_statuts: { type: 'boolean' } }, required: ['periode'], additionalProperties: false } },
  { name: 'get_lead', description: "Détail d'une demande (FI-XXXXXX).", input_schema: { type: 'object', properties: { numero: { type: 'string' } }, required: ['numero'], additionalProperties: false } },
  { name: 'update_lead_status', description: `Change le statut d'une demande (${LEAD_STATUS.join('|')}) et/ou ajoute une note interne. perdue = confirmation requise.`, input_schema: { type: 'object', properties: { numero: { type: 'string' }, statut: { type: 'string', enum: LEAD_STATUS }, note: { type: 'string' } }, required: ['numero'], additionalProperties: false } },
  { name: 'send_email_to_client', description: 'Email à un client (numero de demande ou email). Après « oui » explicite. La langue du client est reprise de sa demande.', input_schema: { type: 'object', properties: { numero: { type: 'string' }, email: { type: 'string' }, sujet: { type: 'string' }, message: { type: 'string', description: 'texte complet, signé par l’entreprise' } }, required: ['sujet', 'message'], additionalProperties: false } },
  { name: 'stats', description: 'Statistiques sur N jours (demandes par type/statut/service, activité de Petit Pois).', input_schema: { type: 'object', properties: { jours: { type: 'integer' } }, additionalProperties: false } },
  { name: 'customer_insights', description: 'Derniers messages des visiteurs à Petit Pois (pour synthèse des besoins).', input_schema: { type: 'object', properties: { jours: { type: 'integer' } }, additionalProperties: false } },
  { name: 'get_settings', description: 'Configuration actuelle du site (résumé).', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'set_info', description: 'Nom, nom court, slogan (français, traduit automatiquement), coordonnées, LinkedIn, GPS, laboratoire. Ne passer que les champs à changer.', input_schema: { type: 'object', properties: { nom: { type: 'string' }, nomCourt: { type: 'string' }, slogan: { type: 'string' }, adresse: { type: 'string' }, codePostal: { type: 'string' }, ville: { type: 'string' }, telephone: { type: 'string' }, mobile: { type: 'string' }, email: { type: 'string' }, linkedin: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' }, labo_adresse: { type: 'string' }, labo_codePostal: { type: 'string' }, labo_ville: { type: 'string' } }, additionalProperties: false } },
  { name: 'list_content', description: `Textes d'interface modifiables (clé, libellé, début de la valeur). TOUJOURS filtrer : recherche (mot du libellé, ex. « services », « slogan », « Petit Pois ») ou page (${CONTENT_PAGES.join('|')}).`, input_schema: { type: 'object', properties: { page: { type: 'string' }, recherche: { type: 'string' } }, additionalProperties: false } },
  { name: 'set_content', description: 'Modifie des textes d’interface : valeurs = {cle: nouveau texte en français} (clés de list_content). Traduction EN/ES automatique. Valeur vide = retour au texte d’origine.', input_schema: { type: 'object', properties: { valeurs: { type: 'object', additionalProperties: { type: 'string' } } }, required: ['valeurs'], additionalProperties: false } },
  { name: 'set_fonts', description: `Police du site : ${FONT_PRESETS.join(' | ')} (bricolage = défaut, poppins = police du site d'origine).`, input_schema: { type: 'object', properties: { police: { type: 'string', enum: FONT_PRESETS } }, required: ['police'], additionalProperties: false } },
  { name: 'set_hours', description: 'Horaires : plages [{jours:[lundi…dimanche|tous], ouverture:"HH:MM", fermeture:"HH:MM"} ou {jours, ferme:true}].', input_schema: { type: 'object', properties: { plages: { type: 'array', items: { type: 'object', properties: { jours: { type: 'array', items: { type: 'string' } }, ouverture: { type: 'string' }, fermeture: { type: 'string' }, ferme: { type: 'boolean' } }, required: ['jours'], additionalProperties: false } } }, required: ['plages'], additionalProperties: false } },
  { name: 'list_palettes', description: 'Palettes prêtes et rôle de chaque couleur.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'set_palette', description: `Couleurs du site : preset (nom de palette prête) ou couleurs {role:"#rrggbb"} (${Object.keys(PALETTE_DEFAULT).join(', ')}) ou reinitialiser.`, input_schema: { type: 'object', properties: { preset: { type: 'string' }, couleurs: { type: 'object', additionalProperties: { type: 'string' } }, reinitialiser: { type: 'boolean' } }, additionalProperties: false } },
  { name: 'manage_list', description: `Contenu structuré : liste = ${LISTES.join('|')} · action = lister | ajouter | modifier | supprimer (confirmation) | masquer | afficher | ordonner (ids dans l’ordre voulu). id = élément visé ; champs = valeurs en français (titre, texte, resume, intro, question, reponse, accroche, nom, role, categorie, lieu, date AAAA-MM-JJ, duree, lien, emoji, points [textes], stats [{valeur,label}], image = URL de photo reçue [PHOTO : url]). Traduction automatique.`, input_schema: { type: 'object', properties: { liste: { type: 'string', enum: LISTES }, action: { type: 'string', enum: ['lister', 'ajouter', 'modifier', 'supprimer', 'masquer', 'afficher', 'ordonner'] }, id: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } }, champs: { type: 'object', additionalProperties: true } }, required: ['liste', 'action'], additionalProperties: false } },
  { name: 'set_chiffres', description: 'Chiffres clés affichés (accueil + page Chiffres). Ne passer que ceux à changer : projets, projetsObjectif, hectares, hectaresObjectif, satisfaction, annees, co2Tonnes, arbresEquivalent, formations, partenaires, arbresPlantes, sites, projetsTotal, rendement, eau, biodiversite, co2Min, co2Max, progression [{annee,pct}].', input_schema: { type: 'object', properties: { valeurs: { type: 'object', additionalProperties: true } }, required: ['valeurs'], additionalProperties: false } },
  { name: 'list_image_slots', description: 'Emplacements d’images du site et image actuelle.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'set_image', description: 'Place une image (url reçue via [PHOTO : url]) dans un emplacement (slot), ou reinitialiser.', input_schema: { type: 'object', properties: { slot: { type: 'string' }, url: { type: 'string' }, reinitialiser: { type: 'boolean' } }, required: ['slot'], additionalProperties: false } },
  { name: 'undo_last_change', description: 'Annule la dernière modification du site (5 niveaux). Sans confirmation si le propriétaire le demande explicitement.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'redeploy', description: 'Relance le déploiement du site pour régénérer les pages pré-rendues (SEO Google / IA) après des changements de contenu. Les visiteurs voient déjà les changements sans cela.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
];

export const CHEF_TOOLS = nullableOptionals(RAW_CHEF_TOOLS);

// ---------------------------------------------------------------------------
// Utilitaires dates (heure de Paris)
// ---------------------------------------------------------------------------
function parisDayBounds(dayIso) {
  const [y, m, d] = dayIso.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0);
  const wall = parisNow(new Date(guess));
  const [wy, wm, wd] = wall.isoDate.split('-').map(Number);
  const offset = Date.UTC(wy, wm - 1, wd, wall.hour, wall.minute) - guess;
  const start = guess - offset;
  return { fromIso: new Date(start).toISOString(), toIso: new Date(start + 86_400_000).toISOString() };
}
const addDays = (dayIso, n) => { const [y, m, d] = dayIso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const monthStart = (dayIso) => dayIso.slice(0, 8) + '01';
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const toDecimal = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ''); return m ? Number(m[1]) + Number(m[2]) / 60 : null; };
const fmtDate = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function brief(l, services = []) {
  const svc = services.find((x) => x.id === l.service);
  const d = l.details || {};
  return {
    numero: l.numero, statut: STATUS_LABEL[l.status] || l.status, type: TYPE_LABEL.fr[l.type] || l.type, recu_le: fmtDate(l.created_at), langue: l.lang, source: l.source,
    client: `${l.client?.nom}${l.client?.organisation ? ` (${l.client.organisation})` : ''} · ${l.client?.email}${l.client?.telephone ? ` · ${l.client.telephone}` : ''}`,
    service: svc ? L(svc.titre) : l.service || null,
    details: [d.type_site, d.localisation, d.surface_ha ? `${d.surface_ha} ha` : null, d.formation, d.echeance].filter(Boolean).join(' · ') || null,
    besoin: (l.resume || d.message || '').slice(0, 400), ...(l.notes ? { notes: l.notes } : {}),
  };
}

// ---------------------------------------------------------------------------
// Listes de contenu : schéma des champs par liste (texte multilingue vs brut)
// ---------------------------------------------------------------------------
const LIST_SCHEMA = {
  services: { text: ['titre', 'resume', 'intro', 'cta'], plain: ['emoji', 'icone'], textArrays: [], objects: { points: { text: ['titre', 'texte'], plain: ['emoji'] }, stats: { text: ['label'], plain: ['valeur'] } }, image: false },
  activites: { text: ['titre', 'sousTitre', 'texte'], plain: [], textArrays: ['points'], objects: { stats: { text: ['label'], plain: ['valeur'] } }, image: true },
  expertise: { text: ['titre', 'texte', 'impact'], plain: ['emoji'], textArrays: [], objects: {}, image: false },
  formations: { text: ['titre', 'accroche', 'texte'], plain: ['emoji', 'duree'], textArrays: ['tags'], objects: {}, image: false },
  faq: { text: ['question', 'reponse'], plain: ['emoji'], textArrays: [], objects: {}, image: false },
  blog: { text: ['titre', 'texte', 'categorie'], plain: ['date', 'duree', 'lien', 'audio'], textArrays: [], objects: {}, image: true },
  equipe: { text: ['role', 'texte'], plain: ['nom'], textArrays: [], objects: {}, image: true },
  partenaires: { text: [], plain: ['nom'], textArrays: [], objects: {}, image: true },
  realisations: { text: ['titre', 'categorie'], plain: ['lieu'], textArrays: [], objects: {}, image: true },
  pourquoi: { text: ['titre', 'texte'], plain: ['emoji'], textArrays: ['points'], objects: {}, image: false },
};
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

async function imageValue(v) {
  const url = String(v || '').trim();
  if (!url) return undefined;
  if (url.startsWith('/images/') || url.includes('/storage/v1/object/public/')) return url;
  return (await resolveImageUrl(url)).url;
}

/** Applique `champs` (valeurs françaises) à un élément existant ou nouveau, avec traduction. */
async function applyFields(liste, existing, champs) {
  const sc = LIST_SCHEMA[liste];
  const item = { ...(existing || {}) };
  for (const f of sc.text) if (champs[f] !== undefined) item[f] = champs[f] === '' ? undefined : await toMultilang(champs[f]);
  for (const f of sc.plain) if (champs[f] !== undefined) item[f] = champs[f];
  for (const f of sc.textArrays) if (Array.isArray(champs[f])) item[f] = await Promise.all(champs[f].map((x) => toMultilang(String(x))));
  for (const [f, sub] of Object.entries(sc.objects)) {
    if (!Array.isArray(champs[f])) continue;
    item[f] = await Promise.all(champs[f].map(async (o) => {
      const out = {};
      for (const k of sub.text) if (o[k] !== undefined) out[k] = await toMultilang(String(o[k]));
      for (const k of sub.plain) if (o[k] !== undefined) out[k] = o[k];
      return out;
    }));
  }
  if (sc.image && champs.image !== undefined) item.image = await imageValue(champs.image);
  return item;
}

const summarize = (liste, x) => ({ id: x.id, ...(x.nom ? { nom: x.nom } : {}), ...(x.titre ? { titre: L(x.titre) } : {}), ...(x.question ? { question: L(x.question) } : {}), ...(x.date ? { date: x.date } : {}), ...(x.image ? { image: x.image } : {}), masque: x.visible === false });

// ---------------------------------------------------------------------------
// Exécution des outils
// ---------------------------------------------------------------------------
export async function executeChefTool(name, input, ctx = {}) {
  const today = parisNow().isoDate;
  const s = store();
  const J = (o) => ({ result: JSON.stringify(o) });
  const settings = await getSettings();
  const services = settings.listes.services;

  switch (name) {
    // ----- Demandes -----
    case 'list_leads': {
      const p = input?.periode;
      const active = ['nouvelle', 'en_cours'];
      const statuses = input?.tous_statuts ? undefined : input?.statut ? [input.statut] : active;
      let f = { statuses };
      if (p === 'aujourdhui') f = { ...parisDayBounds(today), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'hier') f = { ...parisDayBounds(addDays(today, -1)), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'semaine') f = { fromIso: parisDayBounds(addDays(today, -7)).fromIso, statuses };
      else if (p === 'mois') f = { fromIso: parisDayBounds(monthStart(today)).fromIso, statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'dates') { if (!isDay(input.du) || !isDay(input.au)) return J({ erreur: 'du et au requis (AAAA-MM-JJ).' }); f = { fromIso: parisDayBounds(input.du).fromIso, toIso: parisDayBounds(input.au).toIso, statuses: input?.tous_statuts || input?.statut ? statuses : undefined }; }
      if (input?.type) f.types = [input.type];
      const list = await s.listLeads(f);
      return J({ periode: p, nombre: list.length, demandes: list.slice(0, 40).map((l) => brief(l, services)), ...(list.length > 40 ? { note: `${list.length - 40} autres non affichées.` } : {}) });
    }
    case 'get_lead': {
      const l = await s.getLeadByNumero(String(input.numero || '').trim().toUpperCase());
      return J(l ? { trouvee: true, demande: { ...brief(l, services), message_complet: l.details?.message, resume_complet: l.resume, details: l.details } } : { trouvee: false });
    }
    case 'update_lead_status': {
      const l = await s.getLeadByNumero(String(input.numero || '').trim().toUpperCase());
      if (!l) return J({ ok: false, erreur: 'Demande introuvable.' });
      const patch = {};
      if (input.statut) { if (!LEAD_STATUS.includes(input.statut)) return J({ ok: false, erreur: `Statut inconnu (${LEAD_STATUS.join(', ')}).` }); patch.status = input.statut; if (['traitee', 'gagnee', 'perdue'].includes(input.statut)) patch.handled_at = new Date().toISOString(); }
      if (input.note) patch.notes = [l.notes, `${today} : ${String(input.note).trim().slice(0, 500)}`].filter(Boolean).join('\n');
      if (!Object.keys(patch).length) return J({ ok: false, erreur: 'Indique statut et/ou note.' });
      const up = await s.updateLead(l.id, patch);
      return J({ ok: true, numero: up.numero, statut: STATUS_LABEL[up.status], notes: up.notes || null });
    }
    case 'send_email_to_client': {
      let to = String(input.email || '').trim(); let lang = 'fr';
      if (input.numero) { const l = await s.getLeadByNumero(String(input.numero).trim().toUpperCase()); if (!l) return J({ ok: false, erreur: 'Demande introuvable.' }); to = l.client.email; lang = l.lang; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return J({ ok: false, erreur: 'Email du destinataire invalide.' });
      try { await sendCustomEmail({ to, subject: String(input.sujet).slice(0, 150), message: String(input.message).slice(0, 5000), lang }); return J({ ok: true, envoye_a: to }); }
      catch (e) { return J({ ok: false, erreur: e.message }); }
    }
    case 'stats': {
      const jours = Number(input?.jours) || 7;
      const list = await s.listLeads({ fromIso: parisDayBounds(addDays(today, -jours)).fromIso, limit: 1000 });
      const by = (k, f) => { const o = {}; for (const l of list) { const v = f(l); o[v] = (o[v] || 0) + 1; } return o; };
      const usage = await s.usageSince(addDays(today, -jours));
      const tokens = usage.reduce((n, u) => n + Number(u.input_tokens) + Number(u.cache_read_tokens) + Number(u.cache_write_tokens) + Number(u.output_tokens), 0);
      return J({ periode_jours: jours, demandes_total: list.length, par_type: by('type', (l) => TYPE_LABEL.fr[l.type] || l.type), par_statut: by('status', (l) => STATUS_LABEL[l.status] || l.status), par_service: by('service', (l) => { const svc = services.find((x) => x.id === l.service); return svc ? L(svc.titre) : l.service || '—'; }), par_langue: by('lang', (l) => l.lang), par_source: by('source', (l) => l.source), petit_pois: { requetes: usage.reduce((n, u) => n + Number(u.requests), 0), tokens, modele: env.model } });
    }
    case 'customer_insights': {
      const jours = Number(input?.jours) || 2;
      const rows = await s.recentCustomerMessages(new Date(Date.now() - jours * 86_400_000).toISOString());
      const visiteurs = rows.filter((r) => r.role === 'user').map((r) => r.display_text).slice(-120);
      return J({ jours, nombre_messages: visiteurs.length, messages: visiteurs });
    }

    // ----- Site -----
    case 'get_settings':
      return J({
        nom: settings.nom, nomCourt: settings.nomCourt, slogan: settings.slogan, entreprise: settings.entreprise,
        horaires: horairesAffichage(settings.horaires), palette: settings.palette, police: settings.police,
        images: Object.fromEntries(Object.entries(IMAGE_SLOTS).map(([k, v]) => [k, { emplacement: v.label, personnalisee: settings.images[k] !== v.defaut }])),
        listes: Object.fromEntries(LISTES.map((l) => [l, `${(settings.listes[l] || []).filter((x) => x.visible !== false).length} visibles / ${(settings.listes[l] || []).length}`])),
        chiffres: settings.chiffres, textes_modifies: Object.keys(settings.textes || {}).length, version: settings.version,
      });

    case 'list_content': {
      const page = input?.page && CONTENT_PAGES.includes(input.page) ? input.page : null;
      const q = String(input?.recherche || '').toLowerCase();
      // Résultat compact (le quota Groq est de 8 000 tokens/min) : valeur complète seulement si recherche.
      const rows = Object.entries(CONTENT).filter(([, v]) => !page || v.page === page)
        .map(([key, v]) => { const val = settings.textes?.[key]?.fr || v.defaut.fr; return { cle: key, libelle: v.label, valeur: q ? val : String(val).slice(0, 50), ...(settings.textes?.[key] ? { modifie: true } : {}) }; })
        .filter((r) => !q || r.libelle.toLowerCase().includes(q) || String(settings.textes?.[r.cle]?.fr || CONTENT[r.cle].defaut.fr).toLowerCase().includes(q) || r.cle.includes(q));
      return J({ nombre: rows.length, textes: rows.slice(0, 40), ...(rows.length > 40 ? { note: 'Affine avec page ou recherche (mot du libellé) pour voir le reste.' } : {}) });
    }
    case 'set_content': {
      const textes = {}; const inconnues = [];
      for (const [k, v] of Object.entries(input?.valeurs || {})) {
        if (!CONTENT[k]) { inconnues.push(k); continue; }
        const val = v === null || v === undefined ? '' : String(v).trim().slice(0, 800);
        textes[k] = val ? await toMultilang(val) : null;
      }
      if (!Object.keys(textes).length) return J({ ok: false, erreur: `Aucune clé valide${inconnues.length ? ` (inconnues : ${inconnues.join(', ')})` : ''}. Utilise list_content.` });
      const next = await updateSettings({ textes });
      return J({ ok: true, modifie: Object.keys(textes).map((k) => ({ cle: k, libelle: CONTENT[k].label, fr: next.textes?.[k]?.fr || CONTENT[k].defaut.fr, en: next.textes?.[k]?.en || CONTENT[k].defaut.en })), ...(inconnues.length ? { ignorees: inconnues } : {}) });
    }
    case 'set_fonts': {
      if (!FONT_PRESETS.includes(input?.police)) return J({ ok: false, erreur: `Police inconnue. Choix : ${FONT_PRESETS.join(', ')}.` });
      await updateSettings({ police: input.police });
      return J({ ok: true, police: input.police });
    }
    case 'set_info': {
      const patch = {}; const e = {};
      if (input.nom) patch.nom = String(input.nom).trim().slice(0, 80);
      if (input.nomCourt) patch.nomCourt = String(input.nomCourt).trim().slice(0, 40);
      if (input.slogan) patch.slogan = await toMultilang(String(input.slogan).trim().slice(0, 160));
      for (const k of ['adresse', 'codePostal', 'ville', 'telephone', 'mobile', 'email', 'linkedin']) if (input[k] !== undefined) e[k] = String(input[k]).trim().slice(0, 200);
      if (Number.isFinite(input.latitude) && Number.isFinite(input.longitude)) e.coords = [Number(input.latitude), Number(input.longitude)];
      const labo = {};
      for (const k of ['adresse', 'codePostal', 'ville']) if (input[`labo_${k}`] !== undefined) labo[k] = String(input[`labo_${k}`]).trim().slice(0, 200);
      if (Object.keys(labo).length) e.labo = { ...settings.entreprise.labo, ...labo };
      if (Object.keys(e).length) patch.entreprise = e;
      if (!Object.keys(patch).length) return J({ ok: false, erreur: 'Aucun champ fourni.' });
      const next = await updateSettings(patch);
      return J({ ok: true, modifie: Object.keys(patch), nom: next.nom, slogan: next.slogan, entreprise: next.entreprise });
    }
    case 'set_hours': {
      const horaires = { ...settings.horaires };
      for (const pl of input.plages || []) {
        const list = (pl.jours || []).map((j) => String(j).toLowerCase().trim());
        const days = list.includes('tous') ? [0, 1, 2, 3, 4, 5, 6] : list.map((j) => JOURS.indexOf(j)).filter((i) => i >= 0);
        if (!days.length) return J({ ok: false, erreur: `Jours non reconnus : ${list.join(', ')} (lundi … dimanche, ou tous).` });
        if (pl.ferme) { for (const dd of days) horaires[dd] = null; continue; }
        const o = toDecimal(pl.ouverture), cl = toDecimal(pl.fermeture);
        if (o === null || cl === null || cl <= o) return J({ ok: false, erreur: 'Heures attendues au format HH:MM, fermeture après ouverture.' });
        for (const dd of days) horaires[dd] = [o, cl];
      }
      const next = await updateSettings({ horaires });
      return J({ ok: true, horaires: horairesAffichage(next.horaires) });
    }
    case 'list_palettes':
      return J({
        roles: { primary: 'vert principal (boutons, liens, titres)', secondary: 'vert clair (accents)', accent: 'lime (surlignages)', dark: 'vert foncé (texte sur fond clair, header)', deep: 'fond des sections sombres', light: 'vert pâle (fonds doux)', mint: 'fond menthe (cartes)', bg: 'fond général de la page', text: 'texte courant', soil: 'brun terre (touches « sol »)', loam: 'brun clair' },
        palettes: Object.fromEntries(Object.entries(PALETTE_PRESETS).map(([k, v]) => [k, { primary: v.primary, accent: v.accent, deep: v.deep, bg: v.bg }])),
        actuelle: settings.palette,
      });
    case 'set_palette': {
      let palette;
      if (input.reinitialiser) palette = PALETTE_DEFAULT;
      else if (input.preset) {
        const key = Object.keys(PALETTE_PRESETS).find((k) => k.toLowerCase() === String(input.preset).toLowerCase().trim());
        if (!key) return J({ ok: false, erreur: `Palette inconnue. Disponibles : ${Object.keys(PALETTE_PRESETS).join(', ')}.` });
        palette = PALETTE_PRESETS[key];
      } else if (input.couleurs) {
        palette = { ...settings.palette }; const bad = [];
        for (const [k, v] of Object.entries(input.couleurs)) { if (!(k in PALETTE_DEFAULT)) bad.push(k); else if (!isHex(v)) bad.push(`${k}=${v}`); else palette[k] = v.toLowerCase(); }
        if (bad.length) return J({ ok: false, erreur: `Valeurs invalides : ${bad.join(', ')} (rôles : ${Object.keys(PALETTE_DEFAULT).join(', ')} ; format #rrggbb).` });
      } else return J({ ok: false, erreur: 'Indique preset, couleurs ou reinitialiser.' });
      const next = await updateSettings({ palette });
      return J({ ok: true, palette: next.palette });
    }
    case 'manage_list': {
      const liste = input.liste;
      if (!LISTES.includes(liste)) return J({ ok: false, erreur: `Liste inconnue (${LISTES.join(', ')}).` });
      const items = (settings.listes[liste] || []).map((x) => ({ ...x }));
      if (input.action === 'lister') return J({ liste, elements: items.map((x) => ({ ...summarize(liste, x), ...(LIST_SCHEMA[liste].text.length ? Object.fromEntries(LIST_SCHEMA[liste].text.filter((f) => x[f]).map((f) => [f, L(x[f])])) : {}) })) });
      if (input.action === 'ordonner') {
        const ids = input.ids || [];
        const ordered = [...ids.map((id) => items.find((x) => x.id === id)).filter(Boolean), ...items.filter((x) => !ids.includes(x.id))];
        const next = await updateSettings({ listes: { [liste]: ordered } });
        return J({ ok: true, ordre: next.listes[liste].map((x) => x.id) });
      }
      const champs = input.champs || {};
      const idx = items.findIndex((x) => x.id === String(input.id || '').trim());
      try {
        if (input.action === 'ajouter') {
          const base = champs.titre || champs.question || champs.nom || input.id;
          if (!base) return J({ ok: false, erreur: 'Donne au moins un titre / une question / un nom.' });
          let id = slug(input.id || base) || `${liste}-${Date.now()}`;
          if (items.some((x) => x.id === id)) id = `${id}-${items.length + 1}`;
          const item = await applyFields(liste, { id, visible: true }, champs);
          items.push(item);
        } else {
          if (idx < 0) return J({ ok: false, erreur: `Élément « ${input.id} » introuvable dans ${liste}. Ids : ${items.map((x) => x.id).join(', ')}.` });
          if (input.action === 'supprimer') items.splice(idx, 1);
          else if (input.action === 'masquer') items[idx].visible = false;
          else if (input.action === 'afficher') items[idx].visible = true;
          else items[idx] = await applyFields(liste, items[idx], champs);
        }
      } catch (e) { return J({ ok: false, erreur: e.message }); }
      const next = await updateSettings({ listes: { [liste]: items } });
      return J({ ok: true, liste, elements: next.listes[liste].map((x) => summarize(liste, x)) });
    }
    case 'set_chiffres': {
      const patch = {}; const bad = [];
      for (const [k, v] of Object.entries(input.valeurs || {})) {
        if (!(k in settings.chiffres)) { bad.push(k); continue; }
        if (k === 'progression') { if (Array.isArray(v)) patch.progression = v.map((p) => ({ annee: Number(p.annee), pct: Number(p.pct) })).filter((p) => Number.isFinite(p.annee) && Number.isFinite(p.pct)); continue; }
        if (!Number.isFinite(Number(v))) { bad.push(`${k}=${v}`); continue; }
        patch[k] = Number(v);
      }
      if (!Object.keys(patch).length) return J({ ok: false, erreur: `Aucune valeur valide${bad.length ? ` (${bad.join(', ')})` : ''}. Champs : ${Object.keys(settings.chiffres).join(', ')}.` });
      const next = await updateSettings({ chiffres: patch });
      return J({ ok: true, chiffres: next.chiffres, ...(bad.length ? { ignores: bad } : {}) });
    }
    case 'list_image_slots':
      return J({ emplacements: Object.entries(IMAGE_SLOTS).map(([slot, v]) => ({ slot, emplacement: v.label, page: v.page, image_actuelle: settings.images[slot], personnalisee: settings.images[slot] !== v.defaut })) });
    case 'set_image': {
      const slot = String(input.slot || '').trim();
      if (!IMAGE_SLOTS[slot]) return J({ ok: false, erreur: `Emplacement inconnu. Disponibles : ${Object.keys(IMAGE_SLOTS).join(', ')}.` });
      let url = input.reinitialiser ? IMAGE_SLOTS[slot].defaut : String(input.url || '').trim();
      if (!input.reinitialiser && !/^https?:\/\//.test(url)) return J({ ok: false, erreur: "URL invalide. Demande au propriétaire d'envoyer la photo directement dans Telegram." });
      let source = 'photo';
      if (!input.reinitialiser && !url.includes('/storage/v1/object/public/')) {
        try { ({ url, source } = await resolveImageUrl(url)); }
        catch (e) { return J({ ok: false, erreur: `${e.message} Propose au propriétaire d'envoyer la photo directement dans Telegram.` }); }
      }
      await updateSettings({ images: { [slot]: url } });
      return J({ ok: true, slot, emplacement: IMAGE_SLOTS[slot].label, url, ...(source === 'page' ? { note: "L'adresse était une page web : j'ai pris sa photo principale." } : {}) });
    }
    case 'undo_last_change':
      return J(await undoSettings());
    case 'redeploy':
      return J(await triggerRedeploy('chef'));
    default:
      return J({ erreur: `Outil inconnu : ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Un tour de conversation avec le Chef (historique en base par chat_id)
// ---------------------------------------------------------------------------
const MAX_ROUNDS = 6;

export function tidy(text) {
  const lines = String(text || '').split('\n');
  const junk = /^\s*(?:[.…·\-—_*]+|(?:oops|okay|ok|sorry|the|we|probably|hmm)[\s.…!?]*)\s*$/i;
  return lines.filter((l) => !junk.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function chefContext(now = new Date()) {
  const p = parisNow(now);
  return `[Contexte : nous sommes le ${p.label} (Paris), date ISO ${p.isoDate}.]`;
}

// Sous-ensemble d'outils selon le sujet du message (moins de tokens par requête).
const TOOL_GROUPS = {
  demandes: ['list_leads', 'get_lead', 'update_lead_status', 'send_email_to_client', 'stats', 'customer_insights'],
  info: ['get_settings', 'set_info', 'set_hours'],
  textes: ['list_content', 'set_content'],
  style: ['list_palettes', 'set_palette', 'set_fonts'],
  listes: ['manage_list'],
  chiffres: ['set_chiffres'],
  images: ['list_image_slots', 'set_image', 'manage_list'],
  meta: ['undo_last_change', 'redeploy', 'get_settings'],
};
const TOPIC_WORDS = {
  demandes: /demande|devis|lead|client|prospect|fi-[a-z0-9]{4}|répond|repond|stat|combien|semaine|mois|hier|aujourd|visiteur|petit pois|synth|résum|resum|traite|gagn|perdu|en cours/i,
  info: /nom |nom$|slogan|adresse|téléphone|telephone|mobile|mail|linkedin|gps|coordonn|labo|horaire|ouvert|ferm|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|\d+h/i,
  textes: /texte|titre|paragraphe|bouton|accueil de petit pois|description google|seo|kicker|sous-titre|intro|pied de page|footer|message d'accueil|mention/i,
  style: /couleur|palette|police|typo|vert|bleu|brun|fonc|clair|font/i,
  listes: /service|activit|expertise|formation|faq|question|blog|article|actualit|équipe|equipe|membre|partenaire|réalisation|realisation|pourquoi|argument|ajoute|supprime|masque|affiche|liste|renomme/i,
  chiffres: /chiffre|objectif|projets réalisés|hectare|satisfaction|co2|co₂|arbres|années|rendement|biodiversit|sites traités/i,
  images: /photo|image|logo|\[photo|illustr|bandeau|hero|portrait/i,
  meta: /annul|retour en arri|défai|defai|erreur|déploi|deploi|regénèr|regener|régénér|google|configuration|résumé du site|version/i,
};
export function selectTools(text, history = '') {
  const probe = `${text} ${history}`;
  const names = new Set();
  for (const [topic, re] of Object.entries(TOPIC_WORDS)) if (re.test(probe)) TOOL_GROUPS[topic].forEach((n) => names.add(n));
  if (!names.size) return CHEF_TOOLS;
  return CHEF_TOOLS.filter((t) => names.has(t.name));
}

function trimHistory(messages, keepTurns = 1) {
  const userTextIdx = messages.map((m, i) => (m.role === 'user' && !(Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result')) ? i : -1)).filter((i) => i >= 0);
  const cutoff = userTextIdx.length > keepTurns ? userTextIdx[userTextIdx.length - keepTurns] : 0;
  return messages.map((m, i) => {
    if (i >= cutoff || m.role !== 'user' || !Array.isArray(m.content)) return m;
    return { ...m, content: m.content.map((b) => (b.type === 'tool_result' ? { ...b, content: '(résultat omis — ancien tour)' } : b)) };
  });
}

export async function chefTurn(chatId, text, onText = () => {}) {
  const s = store();
  await s.saveChefMessage(chatId, { role: 'user', kind: 'text', content: text, displayText: text });
  const rows = await s.loadChefMessages(chatId, 40);
  const firstUser = rows.findIndex((r) => r.role === 'user' && r.kind === 'text');
  const messages = rows.slice(firstUser).map((r) => ({ role: r.role, content: r.content }));
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_use')) {
      const next = messages[i + 1];
      const answered = next && next.role === 'user' && Array.isArray(next.content) && next.content.some((b) => b.type === 'tool_result');
      if (!answered) messages.splice(i, 1);
    }
  }
  const last = messages[messages.length - 1];
  last.content = [{ type: 'text', text: last.content }, { type: 'text', text: chefContext() }];
  const history = trimHistory(messages.slice(0, -1));
  history.push(last);
  messages.length = 0; messages.push(...history);

  const prevUser = rows.filter((r) => r.role === 'user' && r.kind === 'text').slice(-3, -1).map((r) => r.display_text).join(' ');
  const tools = selectTools(text, prevUser);
  const system = await buildChefSystem();
  let fullText = ''; let nudged = false;
  for (let round = 0; round <= MAX_ROUNDS; round++) {
    let roundText = '';
    const message = await runTurn({ system, tools, messages, maxTokens: 1500, model: env.chefModel || undefined, onText: (d) => { fullText += d; roundText += d; onText(d); } });
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    const textOnly = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    if (!nudged && round < MAX_ROUNDS && looksLikeFakeAction(textOnly, toolUses)) {
      nudged = true;
      await s.saveChefMessage(chatId, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
      messages.push({ role: 'assistant', content: message.content });
      const nudge = [{ type: 'text', text: NUDGE_TEXT }];
      await s.saveChefMessage(chatId, { role: 'user', kind: 'tool', content: nudge, displayText: null });
      messages.push({ role: 'user', content: nudge });
      fullText = '';
      continue;
    }
    if (message.stop_reason !== 'tool_use' || !toolUses.length || round === MAX_ROUNDS) {
      const display = tidy(fullText || textOnly) || '(pas de réponse)';
      await s.saveChefMessage(chatId, { role: 'assistant', kind: 'text', content: message.content.length ? message.content : [{ type: 'text', text: display }], displayText: display });
      return display;
    }
    await s.saveChefMessage(chatId, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
    messages.push({ role: 'assistant', content: message.content });
    const results = [];
    for (const tu of toolUses) {
      const { result } = await executeChefTool(tu.name, tu.input, { chatId });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
    }
    await s.saveChefMessage(chatId, { role: 'user', kind: 'tool', content: results, displayText: null });
    messages.push({ role: 'user', content: results });
  }
  return tidy(fullText);
}

/** Briefing du jour (texte prêt à envoyer), utilisé par le cron et la commande /jour. */
export async function briefingDuJour() {
  const settings = await getSettings();
  const services = settings.listes.services;
  const today = parisNow().isoDate;
  const nouvelles = await store().listLeads({ statuses: ['nouvelle'] });
  const enCours = await store().listLeads({ statuses: ['en_cours', 'devis_envoye'] });
  const hier = await store().listLeads({ ...parisDayBounds(addDays(today, -1)) });
  const lines = [`🌱 Briefing du ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${today}T12:00:00Z`))} — ${settings.nomCourt}`];
  lines.push(`📩 ${nouvelles.length} demande${nouvelles.length > 1 ? 's' : ''} à traiter · ${enCours.length} en cours · ${hier.length} reçue${hier.length > 1 ? 's' : ''} hier`);
  if (nouvelles.length) {
    lines.push('', 'À traiter :');
    for (const l of nouvelles.slice(0, 8)) { const b = brief(l, services); lines.push(`• ${b.numero} · ${b.type}${b.service ? ` · ${b.service}` : ''} — ${l.client?.nom}${l.client?.organisation ? ` (${l.client.organisation})` : ''}${b.details ? ` — ${b.details}` : ''}`); }
    if (nouvelles.length > 8) lines.push(`… et ${nouvelles.length - 8} autres (/demandes).`);
  } else lines.push('', 'Aucune nouvelle demande. ✅');
  return lines.join('\n');
}
