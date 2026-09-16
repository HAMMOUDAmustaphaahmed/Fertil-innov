// Menus guidés du bot Telegram : le propriétaire modifie le site avec des boutons
// (palettes, police, afficher/masquer/supprimer un élément, photos, annulation…)
// sans passer par le modèle. Ce qui demande un texte (nouveau titre, nouvel article…)
// affiche un exemple de phrase à taper : le Chef (IA) prend alors le relais.
//
// Format des callbacks (≤ 64 octets) :
//   m:<menu>            ouvrir un menu (site, textes, couleurs, police, horaires, info, chiffres, photos, aide)
//   m:l:<liste>         menu d'une liste (services, faq, blog…)
//   pal:<preset>        appliquer une palette · font:<preset> appliquer une police
//   li:<liste>:<action>:<id>  vis (afficher/masquer) · del (demander) · delok (supprimer) · edit (exemple) · add (exemple)
//   undo · undo:ok      annuler la dernière modification
//   dep                 régénérer les pages SEO

import { getSettings, updateSettings, undoSettings, settingsHistory, PALETTE_PRESETS, FONT_PRESETS, IMAGE_SLOTS, LISTES, triggerRedeploy, env } from './settings.js';
import { CONTENT } from '../../src/data/content.js';
import { L } from '../../src/data/site.js';
import { horairesAffichage } from '../../src/data/infos.js';

export const LISTE_LABEL = {
  services: '🧪 Services', activites: '🔬 Activités', expertise: '🧬 Expertise', formations: '🎓 Formations', faq: '❓ FAQ',
  blog: '📰 Blog', equipe: '👥 Équipe', partenaires: '🤝 Partenaires', realisations: '🏗 Réalisations', pourquoi: '💡 Pourquoi nous',
};
const FONT_LABEL = { bricolage: 'Bricolage (défaut)', poppins: 'Poppins (site d’origine)', sora: 'Sora', outfit: 'Outfit', jakarta: 'Plus Jakarta' };
const SITE_URL = () => env.siteUrl || '';

const itemLabel = (x) => x.nom || (x.titre && L(x.titre)) || (x.question && L(x.question)) || x.id;
const rows = (buttons, perRow = 2) => { const out = []; for (let i = 0; i < buttons.length; i += perRow) out.push(buttons.slice(i, i + perRow)); return out; };
const back = (to = 'site') => [{ text: '◀️ Retour', callback_data: `m:${to}` }];

/** Menu principal « Modifier le site ». */
export async function siteMenu() {
  const s = await getSettings();
  const text = [`🌐 <b>${s.nom}</b> — que voulez-vous modifier ?`, '', 'Choisissez une rubrique, ou écrivez-moi directement (ex. « change le slogan en … »).', SITE_URL() ? `\n🔗 ${SITE_URL()}` : ''].join('\n');
  const inline_keyboard = [
    [{ text: '✍️ Textes', callback_data: 'm:textes' }, { text: '📞 Coordonnées', callback_data: 'm:info' }],
    [{ text: '🎨 Couleurs', callback_data: 'm:couleurs' }, { text: '🔤 Police', callback_data: 'm:police' }],
    [{ text: '🕒 Horaires', callback_data: 'm:horaires' }, { text: '🔢 Chiffres clés', callback_data: 'm:chiffres' }],
    ...rows(LISTES.map((l) => ({ text: LISTE_LABEL[l], callback_data: `m:l:${l}` })), 2),
    [{ text: '🖼 Photos', callback_data: 'm:photos' }, { text: '↩️ Annuler la dernière modif', callback_data: 'undo' }],
    [{ text: '🚀 Régénérer les pages SEO', callback_data: 'dep' }],
  ];
  return { text, reply_markup: { inline_keyboard } };
}

export async function couleursMenu() {
  const s = await getSettings();
  const current = Object.keys(PALETTE_PRESETS).find((k) => JSON.stringify(PALETTE_PRESETS[k]) === JSON.stringify(s.palette));
  const text = [`🎨 <b>Couleurs</b> — palette actuelle : ${current ? `« ${current} »` : 'personnalisée'} (principal ${s.palette.primary}, accent ${s.palette.accent})`, '', 'Touchez une palette pour l’appliquer immédiatement, ou écrivez par ex. « mets un vert plus foncé » / « couleur principale #1f6b3a ».'].join('\n');
  const inline_keyboard = [...rows(Object.keys(PALETTE_PRESETS).map((k) => ({ text: `${k === current ? '✅ ' : ''}${k}`, callback_data: `pal:${k}` })), 2), back()];
  return { text, reply_markup: { inline_keyboard } };
}

export async function policeMenu() {
  const s = await getSettings();
  const text = `🔤 <b>Police</b> — actuelle : ${FONT_LABEL[s.police] || s.police}\n\nTouchez une police pour l’appliquer.`;
  const inline_keyboard = [...rows(FONT_PRESETS.map((f) => ({ text: `${f === s.police ? '✅ ' : ''}${FONT_LABEL[f]}`, callback_data: `font:${f}` })), 2), back()];
  return { text, reply_markup: { inline_keyboard } };
}

export async function horairesMenu() {
  const s = await getSettings();
  const text = [`🕒 <b>Horaires</b> — ${horairesAffichage(s.horaires).map((h) => `${h.jour} ${h.heures}`).join(' · ')}`, '', 'Pour changer, écrivez par exemple :', '• « ouvert du lundi au vendredi 8h30–17h30 »', '• « ouvert aussi le samedi matin 9h–12h »', '• « fermé le mercredi »'].join('\n');
  return { text, reply_markup: { inline_keyboard: [back()] } };
}

export async function infoMenu() {
  const s = await getSettings(); const e = s.entreprise;
  const text = [`📞 <b>Coordonnées</b>`, `• Nom : ${s.nom} (court : ${s.nomCourt})`, `• Slogan : ${s.slogan?.fr}`, `• Siège : ${e.adresse}, ${e.codePostal} ${e.ville}`, `• Laboratoire : ${e.labo?.adresse}, ${e.labo?.codePostal} ${e.labo?.ville}`, `• Tél : ${e.telephone} · Mobile : ${e.mobile}`, `• Email : ${e.email}`, `• LinkedIn : ${e.linkedin}`, '', 'Pour changer, écrivez par exemple :', '• « change le téléphone en 04 99 00 00 00 »', '• « le slogan devient : … »', '• « nouvelle adresse du labo : … »'].join('\n');
  return { text, reply_markup: { inline_keyboard: [back()] } };
}

export async function chiffresMenu() {
  const s = await getSettings(); const c = s.chiffres;
  const text = [`🔢 <b>Chiffres clés</b>`, `• Projets réalisés : ${c.projets} (objectif ${c.projetsObjectif})`, `• Hectares traités : ${c.hectares} (objectif ${c.hectaresObjectif})`, `• Satisfaction : ${c.satisfaction} % · Années d’expérience : ${c.annees}`, `• CO₂ séquestré : ${c.co2Tonnes} t ≈ ${c.arbresEquivalent} arbres · Arbres plantés : ${c.arbresPlantes}`, `• Formations : ${c.formations} · Partenaires : ${c.partenaires}`, `• Page Chiffres : ${c.sites} sites, ${c.projetsTotal} projets, +${c.rendement} % rendement, −${c.eau} % eau, +${c.biodiversite} % biodiversité, ${c.co2Min}–${c.co2Max} t CO₂/ha/an`, '', 'Pour changer, écrivez par exemple : « 130 projets réalisés », « 400 hectares traités », « satisfaction 98 % ».'].join('\n');
  return { text, reply_markup: { inline_keyboard: [back()] } };
}

export async function textesMenu() {
  const pages = [...new Set(Object.values(CONTENT).map((v) => v.page))];
  const text = ['✍️ <b>Textes du site</b>', '', 'Tous les titres, paragraphes, boutons, messages de Petit Pois et descriptions Google se modifient en me disant simplement quoi changer :', '• « change le grand titre de l’accueil en : … »', '• « le texte d’accueil de Petit Pois devient : … »', '• « la description Google de la page Services : … »', '', 'Vous écrivez en français, je traduis en anglais et en espagnol automatiquement.', `Pages : ${pages.join(', ')}. Dites « liste les textes de la page contact » pour voir les textes d’une page.`].join('\n');
  return { text, reply_markup: { inline_keyboard: [back()] } };
}

export async function photosMenu() {
  const s = await getSettings();
  const lines = ['🖼 <b>Photos du site</b>', ''];
  for (const [slot, v] of Object.entries(IMAGE_SLOTS)) lines.push(`${s.images[slot] !== v.defaut ? '🟢' : '⚪️'} ${v.label}`);
  lines.push('', '📷 Envoyez simplement une photo dans la conversation, avec une légende comme « pour la grande image d’accueil », « photo de Johanna », « logo du partenaire Yara », « image de l’article Pollutec » — ou sans légende : je vous propose où la mettre.', '🟢 = photo personnalisée, ⚪️ = image d’origine. « remets l’image d’origine du hero » pour revenir en arrière.');
  return { text: lines.join('\n'), reply_markup: { inline_keyboard: [back()] } };
}

/** Menu d'une liste : chaque élément avec ses boutons afficher/masquer, modifier, supprimer. */
export async function listeMenu(liste) {
  const s = await getSettings();
  const items = s.listes[liste] || [];
  const lines = [`${LISTE_LABEL[liste]} — ${items.length} élément${items.length > 1 ? 's' : ''}`, ''];
  const inline_keyboard = [];
  for (const x of items.slice(0, 25)) {
    const hidden = x.visible === false;
    lines.push(`${hidden ? '🚫' : '✅'} ${itemLabel(x)}`);
    inline_keyboard.push([
      { text: `${hidden ? '👁 Afficher' : '🙈 Masquer'} · ${itemLabel(x).slice(0, 18)}`, callback_data: `li:${liste}:vis:${x.id}`.slice(0, 64) },
      { text: '✏️', callback_data: `li:${liste}:edit:${x.id}`.slice(0, 64) },
      { text: '🗑', callback_data: `li:${liste}:del:${x.id}`.slice(0, 64) },
    ]);
  }
  if (items.length > 25) lines.push(`… et ${items.length - 25} autres (dites « liste les ${liste} »).`);
  lines.push('', '✅ visible · 🚫 masqué · ✏️ modifier · 🗑 supprimer. Pour ajouter, touchez ➕ ou écrivez « ajoute … ».');
  inline_keyboard.push([{ text: '➕ Ajouter', callback_data: `li:${liste}:add:-` }, ...back()]);
  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

const EXAMPLES = {
  services: 'ajoute un service : Analyse de compost — Contrôle de maturité et de qualité microbiologique de vos composts (résumé + 3 points forts si vous voulez)',
  activites: 'ajoute une activité : Serres expérimentales — Tests en conditions contrôlées …',
  expertise: 'ajoute une expertise : Salinité des sols — Un sol salin … · impact : −40 % de sel en 2 ans',
  formations: 'ajoute une formation : Compostage et biostimulants — 1 jour — Apprenez à … · certifiée',
  faq: 'ajoute une question FAQ : Intervenez-vous hors Occitanie ? — Oui, dans toute la France et en Espagne …',
  blog: 'ajoute un article : Titre — catégorie Recherche — date 2026-09-16 — résumé … — lien https://… (envoyez la photo juste après)',
  equipe: 'ajoute un membre : Prénom Nom — Ingénieur agronome — Spécialiste des couverts végétaux (puis envoyez sa photo avec « photo de Prénom »)',
  partenaires: 'ajoute un partenaire : Nom (puis envoyez son logo avec « logo de Nom »)',
  realisations: 'ajoute une réalisation : Titre — catégorie Agriculture bio — lieu Nîmes, France (puis envoyez la photo)',
  pourquoi: 'ajoute un argument : Titre — texte — points : a, b, c',
};

/** Traite un callback de menu/liste. Retourne { text, reply_markup?, edit?: boolean } ou null si non reconnu. */
export async function handleMenuCallback(data) {
  if (data === 'm:site') return { ...(await siteMenu()), edit: true };
  if (data === 'm:couleurs') return { ...(await couleursMenu()), edit: true };
  if (data === 'm:police') return { ...(await policeMenu()), edit: true };
  if (data === 'm:horaires') return { ...(await horairesMenu()), edit: true };
  if (data === 'm:info') return { ...(await infoMenu()), edit: true };
  if (data === 'm:chiffres') return { ...(await chiffresMenu()), edit: true };
  if (data === 'm:textes') return { ...(await textesMenu()), edit: true };
  if (data === 'm:photos') return { ...(await photosMenu()), edit: true };
  if (data.startsWith('m:l:')) { const l = data.slice(4); if (LISTES.includes(l)) return { ...(await listeMenu(l)), edit: true }; }

  if (data.startsWith('pal:')) {
    const key = data.slice(4);
    if (!PALETTE_PRESETS[key]) return { text: 'Palette inconnue.' };
    await updateSettings({ palette: PALETTE_PRESETS[key] }, { label: `palette ${key}` });
    return { ...(await couleursMenu()), edit: true, toast: `🎨 Palette « ${key} » appliquée` };
  }
  if (data.startsWith('font:')) {
    const f = data.slice(5);
    if (!FONT_PRESETS.includes(f)) return { text: 'Police inconnue.' };
    await updateSettings({ police: f }, { label: `police ${f}` });
    return { ...(await policeMenu()), edit: true, toast: `🔤 Police ${FONT_LABEL[f]} appliquée` };
  }
  if (data === 'undo') {
    const h = await settingsHistory();
    if (!h.length) return { text: '↩️ Aucune modification à annuler.', edit: false };
    return { text: `↩️ Annuler la dernière modification : <b>${h[0].label}</b> (${new Date(h[0].at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}) ?${h.length > 1 ? `\nEncore ${h.length - 1} annulation${h.length > 2 ? 's' : ''} possible${h.length > 2 ? 's' : ''} ensuite.` : ''}`, reply_markup: { inline_keyboard: [[{ text: '✅ Oui, annuler', callback_data: 'undo:ok' }, { text: '◀️ Non', callback_data: 'm:site' }]] }, edit: true };
  }
  if (data === 'undo:ok') {
    const r = await undoSettings();
    return { text: r.ok ? `↩️ Modification « ${r.label} » annulée. ${r.restantes ? `Encore ${r.restantes} annulation(s) possible(s).` : ''}` : `⚠️ ${r.raison}`, reply_markup: { inline_keyboard: [back()] }, edit: true };
  }
  if (data === 'dep') {
    const r = await triggerRedeploy('telegram');
    return { text: r.ok ? '🚀 Déploiement lancé : les pages pré-rendues (Google, IA) seront à jour dans 1 à 2 minutes. Les visiteurs voient déjà vos changements.' : `⚠️ ${r.raison}`, reply_markup: { inline_keyboard: [back()] }, edit: true };
  }

  if (data.startsWith('li:')) {
    const [, liste, action, id] = data.split(':');
    if (!LISTES.includes(liste)) return null;
    const s = await getSettings();
    const items = (s.listes[liste] || []).map((x) => ({ ...x }));
    const idx = items.findIndex((x) => x.id === id);
    if (action === 'add') return { text: `➕ Pour ajouter dans « ${LISTE_LABEL[liste]} », écrivez-moi par exemple :\n\n<i>${EXAMPLES[liste]}</i>\n\nJe traduis automatiquement en anglais et en espagnol.`, reply_markup: { inline_keyboard: [back(`l:${liste}`)] }, edit: true };
    if (idx < 0) return { text: 'Élément introuvable (liste modifiée entre-temps).', reply_markup: { inline_keyboard: [back(`l:${liste}`)] }, edit: true };
    const label = itemLabel(items[idx]);
    if (action === 'vis') {
      items[idx].visible = items[idx].visible === false;
      await updateSettings({ listes: { [liste]: items } }, { label: `${items[idx].visible ? 'afficher' : 'masquer'} ${label}` });
      return { ...(await listeMenu(liste)), edit: true, toast: items[idx].visible ? `👁 « ${label} » affiché` : `🙈 « ${label} » masqué` };
    }
    if (action === 'del') return { text: `🗑 Supprimer définitivement « <b>${label}</b> » de ${LISTE_LABEL[liste]} ?\n(Vous pourrez annuler avec ↩️ juste après.)`, reply_markup: { inline_keyboard: [[{ text: '✅ Oui, supprimer', callback_data: `li:${liste}:delok:${id}`.slice(0, 64) }, { text: '◀️ Non', callback_data: `m:l:${liste}` }]] }, edit: true };
    if (action === 'delok') {
      items.splice(idx, 1);
      await updateSettings({ listes: { [liste]: items } }, { label: `suppression ${label}` });
      return { ...(await listeMenu(liste)), edit: true, toast: `🗑 « ${label} » supprimé` };
    }
    if (action === 'edit') return { text: `✏️ Pour modifier « <b>${label}</b> », écrivez-moi ce qui change, par exemple :\n• « ${liste === 'faq' ? `la question « ${label} » : réponse : …` : `renomme « ${label} » en …`} »\n• « ${liste === 'equipe' ? `le rôle de ${label} devient …` : `le texte de « ${label} » : …`} »\n• envoyez une photo avec la légende « pour ${label} »`, reply_markup: { inline_keyboard: [back(`l:${liste}`)] }, edit: true };
  }
  return null;
}
