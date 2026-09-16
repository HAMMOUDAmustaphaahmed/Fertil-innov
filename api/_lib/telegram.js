// Canal Telegram du Chef. Un seul point d'entrée : handleUpdate(update),
// utilisé par le webhook (/api/telegram, production Vercel) et par le script
// de polling local (scripts/telegram-dev.mjs).
//
// Deux vitesses :
//  - commandes, boutons et actions inline → réponses immédiates SANS modèle ;
//  - texte libre / photos → le Chef (IA), avec accusé de réception si c'est long.

import { env } from './env.js';
import { store } from './store.js';
import { uploadImage, getSettings, IMAGE_SLOTS } from './settings.js';
import { horairesAffichage } from '../../src/data/infos.js';

const API = () => `https://api.telegram.org/bot${env.telegramToken}`;

export async function tg(method, payload) {
  const r = await fetch(`${API()}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  if (!data.ok && method !== 'deleteMessage') console.error('telegram', method, data.description);
  return data;
}

export const KEYBOARD = {
  keyboard: [
    [{ text: '📩 Demandes à traiter' }, { text: '🗓 Cette semaine' }],
    [{ text: '📊 Stats' }, { text: '💬 Ce que demandent les visiteurs' }],
    [{ text: '🖼 Images' }, { text: '⚙️ Site' }],
    [{ text: '❓ Aide' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: 'Parlez au Chef…',
};

export const BOT_COMMANDS = [
  { command: 'start', description: 'Démarrer et se connecter' },
  { command: 'aide', description: 'Tout ce que le Chef sait faire' },
  { command: 'jour', description: 'Briefing du jour' },
  { command: 'demandes', description: 'Demandes à traiter' },
  { command: 'semaine', description: 'Demandes des 7 derniers jours' },
  { command: 'stats', description: 'Statistiques de la semaine' },
  { command: 'visiteurs', description: 'Ce que demandent les visiteurs à Petit Pois' },
  { command: 'images', description: 'Emplacements des images' },
  { command: 'site', description: 'Réglages du site' },
  { command: 'deploy', description: 'Régénérer les pages SEO' },
  { command: 'reset', description: 'Nouvelle conversation' },
];

export const AIDE = `🌱 Le Chef — votre assistant de gestion

Les boutons et commandes répondent instantanément. Pour tout le reste, parlez-moi normalement.

📩 Demandes clients
• « Les demandes de la semaine » / « les devis en cours »
• « Marque FI-7K3P9Q en cours » (ou les boutons sous chaque demande)
• « Réponds à FI-7K3P9Q : … » (je rédige, vous validez)
• « Qu'est-ce que les visiteurs demandent à Petit Pois ? »

🌐 Le site — tout est modifiable, en français, traduit automatiquement en anglais et en espagnol
• Nom, slogan, adresse, téléphone, email, LinkedIn, position GPS, laboratoire
• N'importe quel texte : « change le titre de l'accueil en … », « la description Google de la page Services dit … »
• Services, activités, expertise, formations, FAQ, blog, équipe, partenaires, réalisations : « ajoute une formation : … », « masque le partenaire Yara », « modifie la FAQ délais : … »
• Chiffres clés : « 130 projets réalisés », « 400 hectares traités »
• Horaires : « ouvert du lundi au vendredi 8h30–17h30 »
• Couleurs : « palette olive terre », « un vert plus foncé »
• Police : « mets la police Poppins »
• Photos : envoyez simplement une photo 📷 dans la conversation (avec une légende comme « pour le hero » ou « photo de Johanna »), je vous propose où la mettre.
• « Régénère les pages SEO » après de gros changements (/deploy)

Commandes : /jour /demandes /semaine /stats /visiteurs /images /site /deploy /reset`;

export function toTelegramHtml(text) {
  let t = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1<i>$2</i>');
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  t = t.replace(/^\s*[-•]\s+/gm, '• ');
  return t;
}

export async function send(chatId, text, extra = {}) {
  const chunks = [];
  let rest = toTelegramHtml(text || '…');
  while (rest.length > 3900) {
    let cut = rest.lastIndexOf('\n', 3900);
    if (cut < 2000) cut = 3900;
    chunks.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  chunks.push(rest);
  let last = null;
  for (const [i, c] of chunks.entries()) {
    const isLast = i === chunks.length - 1;
    const payload = { chat_id: chatId, text: c, parse_mode: 'HTML', reply_markup: isLast ? (extra.reply_markup || KEYBOARD) : undefined };
    let r = await tg('sendMessage', payload);
    if (!r.ok) r = await tg('sendMessage', { ...payload, parse_mode: undefined, text: c.replace(/<[^>]+>/g, '') });
    last = r;
  }
  return last;
}

const STATUT_EMOJI = { nouvelle: '🆕', 'en cours': '🔄', 'devis envoyé': '📄', gagnée: '🏆', perdue: '✖️', traitée: '✅' };

async function chef() { return import('./chef.js'); }

async function sendLeads(chatId, title, periode, opts = {}) {
  const { executeChefTool } = await chef();
  const { result } = await executeChefTool('list_leads', { periode, ...opts });
  const data = JSON.parse(result);
  if (!data.nombre) return send(chatId, `${title}\n\nAucune demande.`);
  const lines = [`${title} — ${data.nombre} demande${data.nombre > 1 ? 's' : ''}`];
  const buttons = [];
  for (const l of data.demandes) {
    lines.push('', `${STATUT_EMOJI[l.statut] || '•'} <b>${l.numero}</b> · ${l.type} · ${l.statut}\n👤 ${l.client}${l.service ? `\n🧪 ${l.service}` : ''}${l.details ? `\n📍 ${l.details}` : ''}${l.besoin ? `\n💬 ${l.besoin.slice(0, 220)}` : ''}`);
    if (l.statut === 'nouvelle') buttons.push([{ text: `🔄 En cours ${l.numero}`, callback_data: `ld:en_cours:${l.numero}` }, { text: `📄 Devis envoyé ${l.numero}`, callback_data: `ld:devis_envoye:${l.numero}` }]);
    else if (l.statut === 'en cours') buttons.push([{ text: `📄 Devis envoyé ${l.numero}`, callback_data: `ld:devis_envoye:${l.numero}` }, { text: `✅ Traitée ${l.numero}`, callback_data: `ld:traitee:${l.numero}` }]);
    else if (l.statut === 'devis envoyé') buttons.push([{ text: `🏆 Gagnée ${l.numero}`, callback_data: `ld:gagnee:${l.numero}` }, { text: `✖️ Perdue ${l.numero}`, callback_data: `ld:perdue:${l.numero}` }]);
  }
  if (data.note) lines.push('', data.note);
  const html = lines.join('\n');
  const r = await tg('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', reply_markup: buttons.length ? { inline_keyboard: buttons.slice(0, 30) } : KEYBOARD });
  if (!r.ok) await send(chatId, html.replace(/<[^>]+>/g, ''));
}

async function sendStats(chatId) {
  const { executeChefTool } = await chef();
  const st = JSON.parse((await executeChefTool('stats', { jours: 7 })).result);
  const lines = ['📊 7 derniers jours', '', `Demandes : ${st.demandes_total}`];
  for (const [k, v] of Object.entries(st.par_type || {})) lines.push(`• ${v} × ${k}`);
  if (Object.keys(st.par_statut || {}).length) { lines.push('', 'Par statut :'); for (const [k, v] of Object.entries(st.par_statut)) lines.push(`• ${v} ${k}`); }
  if (Object.keys(st.par_service || {}).length) { lines.push('', 'Par service :'); for (const [k, v] of Object.entries(st.par_service)) lines.push(`• ${v} × ${k}`); }
  lines.push('', `Petit Pois : ${st.petit_pois.requetes} requêtes · ${Number(st.petit_pois.tokens).toLocaleString('fr-FR')} tokens`);
  return send(chatId, lines.join('\n'));
}

async function sendImages(chatId) {
  const s = await getSettings();
  const lines = ['🖼 Emplacements des images', ''];
  for (const [slot, v] of Object.entries(IMAGE_SLOTS)) lines.push(`${s.images[slot] !== v.defaut ? '🟢' : '⚪️'} ${slot} — ${v.label}`);
  lines.push('', '🟢 = photo personnalisée. Envoyez une photo avec une légende (« pour hero », « photo de Johanna », « logo du partenaire X ») ou sans, je vous propose où la mettre.');
  return send(chatId, lines.join('\n'));
}

async function sendSite(chatId) {
  const s = await getSettings();
  const e = s.entreprise;
  const lines = [
    `⚙️ ${s.nom} — ${s.slogan?.fr || ''}`, '',
    `📍 ${e.adresse}, ${e.codePostal} ${e.ville}`, `📞 ${e.telephone} · 📱 ${e.mobile} · ✉️ ${e.email}`,
    `🕒 ${horairesAffichage(s.horaires).map((h) => `${h.jour} ${h.heures}`).join(' · ')}`,
    `🎨 Palette : principal ${s.palette.primary}, accent ${s.palette.accent}, fond ${s.palette.bg} · Police : ${s.police}`,
    `📚 ${Object.entries(s.listes).map(([k, l]) => `${l.filter((x) => x.visible !== false).length} ${k}`).join(', ')}`,
    `🔢 ${s.chiffres.projets} projets · ${s.chiffres.hectares} ha · ${s.chiffres.satisfaction} % satisfaction`,
    `✍️ Textes personnalisés : ${Object.keys(s.textes || {}).length} · Configuration v${s.version}`, '',
    'Dites-moi ce que vous voulez changer : nom, slogan, horaires, couleurs, police, textes, services, formations, FAQ, blog, équipe, chiffres, photos…',
  ];
  return send(chatId, lines.join('\n'));
}

async function ensureCommandsRegistered() {
  await tg('setMyCommands', { commands: BOT_COMMANDS, language_code: 'fr' });
  await tg('setMyCommands', { commands: BOT_COMMANDS });
}

async function downloadPhoto(fileId) {
  const info = await tg('getFile', { file_id: fileId });
  const path = info?.result?.file_path;
  if (!path) throw new Error('Fichier Telegram introuvable');
  const r = await fetch(`https://api.telegram.org/file/bot${env.telegramToken}/${path}`);
  if (!r.ok) throw new Error('Téléchargement Telegram impossible');
  const buffer = Buffer.from(await r.arrayBuffer());
  const contentType = path.endsWith('.png') ? 'image/png' : path.endsWith('.webp') ? 'image/webp' : path.endsWith('.gif') ? 'image/gif' : 'image/jpeg';
  return { buffer, contentType };
}

async function handleCallback(cb) {
  const chatId = cb.message?.chat?.id;
  const key = `telegram:${chatId}`;
  const data = String(cb.data || '');
  if (!(await store().getChefChat(key))) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Non autorisé.' });
  try {
    if (data.startsWith('ld:')) {
      const [, statut, numero] = data.split(':');
      const { executeChefTool } = await chef();
      const r = JSON.parse((await executeChefTool('update_lead_status', { numero, statut })).result);
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: r.ok ? `${numero} → ${r.statut}` : r.erreur || 'Erreur' });
      if (r.ok) await tg('sendMessage', { chat_id: chatId, text: `${STATUT_EMOJI[r.statut] || '•'} ${numero} → ${r.statut}.`, reply_markup: KEYBOARD });
      return;
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
  } catch (e) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: `Erreur : ${e.message}` });
  }
}

export async function handleUpdate(update) {
  if (update?.callback_query) return handleCallback(update.callback_query);
  const msg = update?.message || update?.edited_message;
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const key = `telegram:${chatId}`;
  const text = (msg.text || msg.caption || '').trim();
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.chat.title || 'Propriétaire';

  try {
    const chat = await store().getChefChat(key);
    if (/^\/start\b/.test(text)) {
      const pwd = text.replace(/^\/start\s*/, '').trim();
      if (!chat) {
        if (!env.adminPassword) return send(chatId, "⚠️ ADMIN_PASSWORD n'est pas configuré sur le serveur.");
        if (pwd !== env.adminPassword) return tg('sendMessage', { chat_id: chatId, text: `Bonjour ${name} 👋 Ce bot est réservé à l'équipe de Fertil'Innov.\nPour vous connecter, envoyez :\n/start VOTRE_MOT_DE_PASSE` });
        await store().authorizeChefChat(key, name);
        await ensureCommandsRegistered();
        const s = await getSettings();
        await send(chatId, `✅ Bienvenue ${name} ! Vous êtes connecté au Chef de ${s.nom}.\n\nJe gère les demandes clients, les réponses, les statistiques et tout le site web (en trois langues). Les boutons ci-dessous répondent instantanément ; pour le reste, parlez-moi.\n\n${AIDE}`);
        return;
      }
      return send(chatId, `Re-bonjour ${name} 👋 Je suis prêt. /aide pour tout voir.`);
    }
    if (!chat) return tg('sendMessage', { chat_id: chatId, text: `Ce bot est réservé à l'équipe de Fertil'Innov. Connectez-vous avec :\n/start VOTRE_MOT_DE_PASSE` });

    const cmd = /^\/(\w+)/.exec(text)?.[1]?.toLowerCase();
    const is = (c, ...labels) => cmd === c || labels.includes(text);
    if (is('aide', '❓ Aide') || cmd === 'help') return send(chatId, AIDE);
    if (is('reset')) { await store().clearChefMessages(key); return send(chatId, '🧹 Conversation remise à zéro. Je vous écoute.'); }
    if (is('jour')) { const { briefingDuJour } = await chef(); await send(chatId, await briefingDuJour()); return sendLeads(chatId, '📩 À traiter', 'toutes', { statut: 'nouvelle' }); }
    if (is('demandes', '📩 Demandes à traiter')) return sendLeads(chatId, '📩 Demandes à traiter', 'toutes');
    if (is('semaine', '🗓 Cette semaine')) return sendLeads(chatId, '🗓 7 derniers jours', 'semaine', { tous_statuts: true });
    if (is('stats', '📊 Stats')) return sendStats(chatId);
    if (is('images', '🖼 Images')) return sendImages(chatId);
    if (is('site', '⚙️ Site')) return sendSite(chatId);
    if (is('deploy')) { const { executeChefTool } = await chef(); const r = JSON.parse((await executeChefTool('redeploy', {})).result); return send(chatId, r.ok ? '🚀 Déploiement lancé : les pages SEO seront régénérées dans 1 à 2 minutes.' : `⚠️ ${r.raison}`); }
    if (is('visiteurs', '💬 Ce que demandent les visiteurs')) { /* passe par le modèle pour la synthèse */ }

    let prompt = text === '💬 Ce que demandent les visiteurs' || cmd === 'visiteurs' ? 'Fais une synthèse courte de ce que les visiteurs ont demandé à Petit Pois ces 7 derniers jours (customer_insights), avec les besoins récurrents.' : text;
    if (msg.photo?.length || (msg.document && /^image\//.test(msg.document.mime_type || ''))) {
      await tg('sendChatAction', { chat_id: chatId, action: 'upload_photo' });
      const fileId = msg.document ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
      try {
        const { buffer, contentType } = await downloadPhoto(fileId);
        const url = await uploadImage(buffer, { name: msg.document?.file_name || 'photo', contentType });
        prompt = `[PHOTO : ${url}] ${text || '(sans légende — propose-moi où placer cette photo sur le site)'}`;
        await tg('sendMessage', { chat_id: chatId, text: '📷 Photo enregistrée. Je regarde où la placer…' });
      } catch (e) {
        return send(chatId, `⚠️ Impossible d'enregistrer la photo : ${e.message}`);
      }
    }
    if (!prompt) return send(chatId, "Je n'ai pas compris ce message. /aide pour voir ce que je sais faire.");

    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    let waitMsg = null;
    const timer = setTimeout(async () => {
      waitMsg = await tg('sendMessage', { chat_id: chatId, text: "⏳ Je m'en occupe, encore quelques secondes…" });
      tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    }, 6000);
    let reply;
    try { const { chefTurn } = await chef(); reply = await chefTurn(key, prompt); } finally { clearTimeout(timer); }
    if (waitMsg?.result?.message_id) await tg('deleteMessage', { chat_id: chatId, message_id: waitMsg.result.message_id });
    await send(chatId, reply);
  } catch (e) {
    console.error('telegram handleUpdate', e);
    if (e?.status === 429) return send(chatId, '⏳ Le service IA est saturé pour l’instant (limite de tokens par minute). Réessayez dans une minute — les boutons rapides fonctionnent toujours.');
    await send(chatId, `⚠️ Une erreur est survenue : ${e.message}`);
  }
}

/** Diffuse un message à toutes les conversations Telegram autorisées (cron du matin, nouvelles demandes). */
export async function broadcast(text, reply_markup) {
  if (!env.telegramToken) return 0;
  const chats = (await store().listChefChats()).filter((c) => c.chat_id.startsWith('telegram:'));
  for (const c of chats) await send(c.chat_id.replace('telegram:', ''), text, reply_markup ? { reply_markup } : {});
  return chats.length;
}

/** Notification immédiate au propriétaire (nouvelle demande). Ne lève jamais. */
export async function notifyOwner(text, reply_markup) {
  try { return await broadcast(text, reply_markup); } catch (e) { console.error('notifyOwner', e.message); return 0; }
}
