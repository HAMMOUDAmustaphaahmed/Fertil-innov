// Emails transactionnels : notification d'une nouvelle demande à l'entreprise,
// accusé de réception au client (dans sa langue), email libre rédigé par le Chef.
// Fournisseur : Mailjet (SMTP, défaut si MAILJET_API_KEY), Gmail (mot de passe
// d'application) ou Resend (domaine vérifié).

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env, assertEnv } from './env.js';
import { getSettings } from './settings.js';
import { TYPE_LABEL } from './leads.js';
import { L } from '../../src/data/site.js';
import { horairesAffichage } from '../../src/data/infos.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let resend; let smtp;
function transport() {
  if (env.emailProvider === 'gmail') {
    assertEnv(['gmailUser', 'gmailAppPassword']);
    smtp ||= nodemailer.createTransport({ service: 'gmail', auth: { user: env.gmailUser, pass: env.gmailAppPassword } });
    return smtp;
  }
  assertEnv(['mailjetKey', 'mailjetSecret', 'mailjetSender']);
  smtp ||= nodemailer.createTransport({ host: 'in-v3.mailjet.com', port: 587, secure: false, auth: { user: env.mailjetKey, pass: env.mailjetSecret } });
  return smtp;
}

// Requête HTTP avec délai maximum (les fonctions serverless ne doivent jamais rester bloquées).
async function fetchTimeout(url, init, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

/** Envoi générique : { to, subject, html, replyTo? } → id du message ou null. Lève une erreur explicite en cas d'échec. */
export async function sendMail({ to, subject, html, replyTo }) {
  const s = await getSettings();
  const nom = s.nom;
  if (env.emailProvider === 'mailjet') {
    // API REST Mailjet (HTTPS) : contrairement au SMTP, une adresse expéditrice non validée
    // ou un refus renvoie une vraie erreur au lieu d'un message silencieusement perdu.
    assertEnv(['mailjetKey', 'mailjetSecret', 'mailjetSender']);
    const auth = Buffer.from(`${env.mailjetKey}:${env.mailjetSecret}`).toString('base64');
    const tos = (Array.isArray(to) ? to : [to]).map((Email) => ({ Email }));
    const r = await fetchTimeout('https://api.mailjet.com/v3.1/send', {
      method: 'POST', headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: JSON.stringify({ Messages: [{ From: { Email: env.mailjetSender, Name: nom }, To: tos, Subject: subject, HTMLPart: html, ...(replyTo ? { ReplyTo: { Email: replyTo } } : {}) }] }),
    });
    const data = await r.json().catch(() => ({}));
    const m = data.Messages?.[0];
    if (!r.ok || m?.Status !== 'success') {
      const detail = m?.Errors?.map((x) => x.ErrorMessage).join(' ; ') || data.ErrorMessage || `HTTP ${r.status}`;
      const err = new Error(`Mailjet : ${detail}`); err.code = 'EMAIL'; throw err;
    }
    return m.To?.[0]?.MessageID || null;
  }
  if (env.emailProvider === 'resend') {
    assertEnv(['resendKey']);
    resend ||= new Resend(env.resendKey);
    const from = env.emailFrom || `${nom} <onboarding@resend.dev>`;
    const { data, error } = await resend.emails.send({ from, to: Array.isArray(to) ? to : [to], subject, html, ...(replyTo ? { replyTo } : {}) });
    if (error) { const err = new Error(error.message || 'Envoi email impossible'); err.code = 'EMAIL'; throw err; }
    return data?.id || null;
  }
  const sender = env.emailProvider === 'gmail' ? env.gmailUser : env.mailjetSender;
  const info = await transport().sendMail({ from: `${nom} <${sender}>`, to: Array.isArray(to) ? to.join(', ') : to, subject, html, ...(replyTo ? { replyTo } : {}) });
  return info?.messageId || null;
}

async function layout(title, body, lang = 'fr') {
  const s = await getSettings();
  const e = s.entreprise;
  return `
  <div style="font-family:Inter,Arial,sans-serif;color:#263238;max-width:620px;margin:0 auto;padding:24px;background:#ffffff">
    <p style="font-size:20px;font-weight:700;color:#2e7d32;margin:0 0 4px">🌱 ${esc(s.nom)}</p>
    <h2 style="color:#1b5e20;margin:12px 0 18px;font-size:22px">${title}</h2>
    ${body}
    <p style="color:#8a8a8a;font-size:12px;margin-top:32px;border-top:1px solid #e8f5e9;padding-top:12px">
      ${esc(s.nom)} · ${esc(e.adresse)}, ${esc(e.codePostal)} ${esc(e.ville)} · ${esc(e.telephone)} · ${esc(e.email)}<br>
      ${horairesAffichage(s.horaires, lang).map((h) => `${esc(h.jour)} ${esc(h.heures)}`).join(' · ')}
    </p>
  </div>`;
}

const row = (k, v) => `<tr><td style="padding:6px 8px;color:#777;width:170px;vertical-align:top">${esc(k)}</td><td style="padding:6px 8px"><strong>${esc(v)}</strong></td></tr>`;

function detailRows(lead, services, lang) {
  const svc = services.find((x) => x.id === lead.service);
  const d = lead.details || {};
  const T = TXT[lang] || TXT.fr;
  return [
    row(T.type, TYPE_LABEL[lang]?.[lead.type] || lead.type),
    svc ? row(T.service, L(svc.titre, lang)) : '',
    d.formation ? row(T.formation, d.formation) : '',
    d.surface_ha ? row(T.surface, `${d.surface_ha} ha`) : '',
    d.localisation ? row(T.localisation, d.localisation) : '',
    d.type_site ? row(T.typeSite, d.type_site) : '',
    d.echeance ? row(T.echeance, d.echeance) : '',
  ].join('');
}

const TXT = {
  fr: { type: 'Objet', service: 'Service', formation: 'Formation', surface: 'Surface', localisation: 'Localisation', typeSite: 'Type de site', echeance: 'Échéance', nom: 'Nom', email: 'Email', tel: 'Téléphone', org: 'Organisation', message: 'Message', resume: 'Résumé de Petit Pois', source: 'Source', chat: 'conversation avec Petit Pois', form: 'formulaire de contact',
    ackSubject: (n, num) => `Nous avons bien reçu votre demande ${num} — ${n}`, ackTitle: (nom) => `Merci ${nom}, votre demande est bien reçue`, ackText: (num) => `Votre demande <strong>${num}</strong> a été transmise à notre équipe. Un expert vous recontacte sous <strong>24 h ouvrées</strong> (jours ouvrés, 8 h – 18 h).`, ackRecap: 'Récapitulatif', ackReply: 'Vous pouvez répondre directement à cet email pour compléter votre demande.' },
  en: { type: 'Subject', service: 'Service', formation: 'Training', surface: 'Area', localisation: 'Location', typeSite: 'Site type', echeance: 'Timeline', nom: 'Name', email: 'Email', tel: 'Phone', org: 'Organisation', message: 'Message', resume: 'Petit Pois summary', source: 'Source', chat: 'chat with Petit Pois', form: 'contact form',
    ackSubject: (n, num) => `We have received your request ${num} — ${n}`, ackTitle: (nom) => `Thank you ${nom}, your request has been received`, ackText: (num) => `Your request <strong>${num}</strong> has been passed on to our team. An expert will contact you within <strong>24 working hours</strong> (weekdays, 8am – 6pm CET).`, ackRecap: 'Summary', ackReply: 'You can reply directly to this email to add to your request.' },
  es: { type: 'Asunto', service: 'Servicio', formation: 'Formación', surface: 'Superficie', localisation: 'Ubicación', typeSite: 'Tipo de sitio', echeance: 'Plazo', nom: 'Nombre', email: 'Correo', tel: 'Teléfono', org: 'Organización', message: 'Mensaje', resume: 'Resumen de Petit Pois', source: 'Origen', chat: 'conversación con Petit Pois', form: 'formulario de contacto',
    ackSubject: (n, num) => `Hemos recibido su solicitud ${num} — ${n}`, ackTitle: (nom) => `Gracias ${nom}, hemos recibido su solicitud`, ackText: (num) => `Su solicitud <strong>${num}</strong> se ha transmitido a nuestro equipo. Un experto le contactará en <strong>24 h laborables</strong> (días laborables, 8 – 18 h CET).`, ackRecap: 'Resumen', ackReply: 'Puede responder directamente a este correo para completar su solicitud.' },
};

/** Email à l'entreprise : nouvelle demande. */
export async function sendLeadToCompany(lead) {
  assertEnv(['companyEmail']);
  const s = await getSettings();
  const services = s.listes.services;
  const T = TXT.fr;
  const c = lead.client;
  const body = `
    <table style="border-collapse:collapse;width:100%">
      ${row('Numéro', lead.numero)}
      ${detailRows(lead, services, 'fr')}
      ${row(T.nom, c.nom)}${row(T.email, c.email)}${c.telephone ? row(T.tel, c.telephone) : ''}${c.organisation ? row(T.org, c.organisation) : ''}
      ${row('Langue', lead.lang)}${row(T.source, lead.source === 'chat' ? T.chat : T.form)}
    </table>
    ${lead.details?.message ? `<h3 style="margin:18px 0 6px">${T.message}</h3><p style="white-space:pre-wrap;background:#f9fbf8;padding:14px;border-radius:10px;border:1px solid #e8f5e9">${esc(lead.details.message)}</p>` : ''}
    ${lead.resume ? `<h3 style="margin:18px 0 6px">${T.resume}</h3><p style="white-space:pre-wrap;background:#f9fbf8;padding:14px;border-radius:10px;border:1px solid #e8f5e9">${esc(lead.resume)}</p>` : ''}`;
  return sendMail({ to: env.companyEmail, replyTo: c.email, subject: `[Site] ${TYPE_LABEL.fr[lead.type]} ${lead.numero} — ${c.nom}${c.organisation ? ` (${c.organisation})` : ''}`, html: await layout(`Nouvelle demande — ${TYPE_LABEL.fr[lead.type]}`, body) });
}

/** Accusé de réception au client, dans sa langue. */
export async function sendLeadAck(lead) {
  const s = await getSettings();
  const lang = TXT[lead.lang] ? lead.lang : 'fr';
  const T = TXT[lang];
  const c = lead.client;
  const body = `
    <p>${T.ackText(esc(lead.numero))}</p>
    <h3 style="margin:18px 0 6px">${T.ackRecap}</h3>
    <table style="border-collapse:collapse;width:100%">${detailRows(lead, s.listes.services, lang)}</table>
    ${lead.details?.message ? `<p style="white-space:pre-wrap;background:#f9fbf8;padding:14px;border-radius:10px;border:1px solid #e8f5e9">${esc(lead.details.message)}</p>` : ''}
    <p style="color:#555;font-size:14px">${T.ackReply}</p>`;
  return sendMail({ to: c.email, replyTo: s.entreprise.email, subject: T.ackSubject(s.nom, lead.numero), html: await layout(T.ackTitle(esc(c.nom)), body, lang) });
}

/** Email libre rédigé par le Chef (après validation du propriétaire). */
export async function sendCustomEmail({ to, subject, message, lang = 'fr' }) {
  const s = await getSettings();
  const html = await layout(esc(subject), `<div style="white-space:pre-wrap;line-height:1.6">${esc(message)}</div>`, lang);
  return sendMail({ to, replyTo: s.entreprise.email, subject, html });
}
