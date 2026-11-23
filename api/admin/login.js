// Connexion à l'espace propriétaire (adresse : ESPACE_PATH), en deux étapes :
//   POST { action: 'password', login, password }  → le bot Telegram envoie un code valable 5 minutes
//   POST { action: 'code', challenge, code }       → session ouverte (cookie), alerte Telegram + e-mail
// Création / changement des identifiants (lien à usage unique émis par le bot, commande /acces) :
//   POST { action: 'setup-info', token }           → à qui appartient le lien
//   POST { action: 'setup', token, login, password }
// GET → état de la session · DELETE → déconnexion
import { env } from '../_lib/env.js';
import { json, error, readJson, getIp, hashIp } from '../_lib/http.js';
import { adminCookie, clearAdminCookie, adminSession, sameOrigin } from '../_lib/admin.js';
import { startLogin, finishLogin, peekSetup, completeSetup, getAccount, addJournal, maskIp, deviceLabel, CODE_TTL } from '../_lib/vault.js';
import { store } from '../_lib/store.js';
import { tg, broadcast } from '../_lib/telegram.js';
import { sendCustomEmail } from '../_lib/emails.js';
import { parisNow } from '../../src/data/infos.js';

export const maxDuration = 30;

const GENERIC = 'Identifiant ou mot de passe incorrect.';
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** Anti force brute par adresse (empreinte salée, jamais l'adresse en clair) : essais par heure. */
async function limited(request, bucket, max) {
  const n = await store().bumpCounter(`adm-${bucket}:${hashIp(getIp(request))}`, 3600).catch(() => 0);
  return n > max;
}

export async function GET(request) {
  const s = adminSession(request);
  if (!s) return json({ admin: false });
  const acc = await getAccount(s.accountId).catch(() => null);
  if (!acc) return json({ admin: false }, { headers: { 'set-cookie': clearAdminCookie() } });
  return json({ admin: true, login: acc.login, name: acc.name || '', expiresAt: s.exp });
}

export async function DELETE() {
  return json({ ok: true }, { headers: { 'set-cookie': clearAdminCookie() } });
}

export async function POST(request) {
  if (!sameOrigin(request)) return error(403, 'Requête refusée.');
  const body = await readJson(request);
  const action = body?.action;
  const ip = getIp(request); const ua = request.headers.get('user-agent') || '';
  try {
    // ----- Étape 1 : identifiant + mot de passe
    if (action === 'password') {
      if (await limited(request, 'pwd', 10)) return error(429, 'Trop de tentatives. Réessayez dans une heure.');
      if (!env.telegramToken) return error(503, 'Connexion momentanément indisponible.');
      const r = await startLogin({ login: body.login, password: body.password, ip, ua });
      if (!r.ok) {
        if (r.lockedNow && r.account?.chatId) {
          await tg('sendMessage', { chat_id: r.account.chatId.replace('telegram:', ''), text: `🚫 5 mots de passe erronés pour l’identifiant « ${r.account.login} » : le compte est bloqué pendant 1 heure.\nDernier essai : ${deviceLabel(ua)}, adresse ${maskIp(ip)}.\nSi ce n’est pas vous, changez votre mot de passe avec /acces.` }).catch(() => {});
        }
        return error(401, GENERIC);
      }
      const sent = await tg('sendMessage', {
        chat_id: r.account.chatId.replace('telegram:', ''), parse_mode: 'HTML',
        text: `🔐 <b>Code de connexion</b>\n\n<code>${r.code}</code>\n\nValable 5 minutes, utilisable une seule fois.\nDemandé depuis : ${esc(deviceLabel(ua))}, adresse ${esc(maskIp(ip))}.\n\n⚠️ Si ce n’est pas vous, quelqu’un connaît votre mot de passe : changez-le tout de suite avec /acces.`,
      });
      if (!sent?.ok) return error(502, 'Impossible d’envoyer le code de vérification. Réessayez.');
      return json({ step: 'code', challenge: r.challenge, expiresIn: Math.round(CODE_TTL / 1000) });
    }

    // ----- Étape 2 : code reçu sur Telegram
    if (action === 'code') {
      if (await limited(request, 'code', 30)) return error(429, 'Trop de tentatives. Réessayez dans une heure.');
      const r = await finishLogin({ challenge: body.challenge, code: body.code });
      if (!r.ok) return error(401, r.erreur, { expired: !!r.expired });
      const quand = parisNow().label;
      // Alerte à chaque connexion : Telegram (toutes les conversations autorisées) et e-mail de l'entreprise.
      // (attendues avant de répondre : sur un hébergement « serverless », une tâche lancée après la réponse peut être coupée)
      const alertes = [broadcast(`✅ Connexion à l’espace de pilotage\n\nIdentifiant : ${r.account.login}\nQuand : ${quand}\nDepuis : ${r.device}, adresse ${r.ip}\n\nSi ce n’est pas vous : /acces pour changer le mot de passe.`).catch((e) => console.error('alerte telegram', e.message))];
      if (env.companyEmail) {
        alertes.push(sendCustomEmail({
          to: env.companyEmail, subject: 'Connexion à l’espace de pilotage',
          message: `Une connexion à l’espace de pilotage vient d’avoir lieu.\n\nIdentifiant : ${r.account.login}\nQuand : ${quand}\nDepuis : ${r.device}, adresse ${r.ip}\n\nSi vous n’êtes pas à l’origine de cette connexion, changez immédiatement le mot de passe depuis le bot Telegram (commande /acces).`,
        }).catch((e) => console.error('alerte email', e.message)));
      }
      await Promise.all(alertes);
      return json({ ok: true, login: r.account.login }, { headers: { 'set-cookie': adminCookie(r.account.id) } });
    }

    // ----- Création / changement des identifiants (lien émis par le bot)
    if (action === 'setup-info') {
      if (await limited(request, 'setup', 30)) return error(429, 'Trop de tentatives. Réessayez dans une heure.');
      const info = await peekSetup(String(body.token || ''));
      if (!info) return error(410, 'Lien expiré ou déjà utilisé.');
      return json(info);
    }
    if (action === 'setup') {
      if (await limited(request, 'setup', 30)) return error(429, 'Trop de tentatives. Réessayez dans une heure.');
      const r = await completeSetup(String(body.token || ''), body.login, body.password);
      if (!r.ok) return error(400, r.erreur);
      await tg('sendMessage', { chat_id: r.chatId.replace('telegram:', ''), text: `🔐 ${r.created ? 'Vos identifiants sont créés' : 'Vos identifiants ont été modifiés'}.\nIdentifiant : ${r.login}\n\nÀ chaque connexion, je vous enverrai ici un code valable 5 minutes.` }).catch(() => {});
      return json({ ok: true, login: r.login });
    }
    return error(400, 'Action inconnue.');
  } catch (e) {
    console.error('admin/login', e);
    await addJournal({ event: 'erreur de connexion', detail: String(e.message).slice(0, 120) }).catch(() => {});
    return error(e.code === 'CONFIG' ? 503 : 500, e.code === 'CONFIG' ? e.message : 'Erreur serveur.');
  }
}
