// Session de l'espace propriétaire (adresse : ESPACE_PATH) : cookie signé, valable 12 heures.
// Il est posé uniquement après les deux étapes de connexion (identifiant + mot de passe, puis code reçu sur Telegram).
//   - HttpOnly : illisible par le JavaScript de la page
//   - SameSite=Strict : jamais envoyé depuis un autre site
//   - Secure en production : uniquement en HTTPS
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, assertEnv } from './env.js';
import { parseCookies, safeEqual } from './http.js';

const COOKIE = 'fi_admin';
const MAX_AGE = 60 * 60 * 12;

function sign(payload) {
  return createHmac('sha256', env.sessionSecret).update(`admin:${payload}`).digest('base64url');
}

export function adminCookie(accountId) {
  assertEnv(['sessionSecret']);
  const payload = `${Date.now() + MAX_AGE * 1000}.${accountId}`;
  const parts = [`${COOKIE}=${payload}.${sign(payload)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${MAX_AGE}`];
  if (env.isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${env.isProd ? '; Secure' : ''}`;
}

/** Session valide → { accountId, exp } ; sinon null. */
export function adminSession(request) {
  if (!env.sessionSecret) return null;
  const token = parseCookies(request)[COOKIE];
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i); const sig = token.slice(i + 1);
  const [exp, accountId] = payload.split('.');
  if (!exp || !accountId || Number(exp) < Date.now()) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  return { accountId, exp: Number(exp) };
}

export function isAdmin(request) {
  return !!adminSession(request);
}

/** Les requêtes qui modifient quelque chose doivent venir du site lui-même (protection contre les appels depuis un autre site). */
export function sameOrigin(request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
  try { return new URL(origin).host === host; } catch { return false; }
}

/** Mot de passe d'installation (ADMIN_PASSWORD) : sert uniquement à relier une conversation Telegram au bot (/start). */
export function checkPassword(pwd) {
  if (!env.adminPassword) return false;
  return safeEqual(String(pwd || ''), env.adminPassword); // temps constant, longueur comprise
}
