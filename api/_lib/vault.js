// Coffre privé de l'espace de pilotage : comptes administrateurs, réglages de l'IA (clé chiffrée),
// codes de connexion à usage unique, liens de création d'accès, journal de sécurité.
//
// Où : dans la table de configuration (fi_site_settings), mais dans des lignes SÉPARÉES de la configuration
// publique du site (id « main », envoyée aux navigateurs) : « vault » (durable) et « vault-tmp » (codes en cours).
// Ces lignes ne sont lues que par le serveur, jamais renvoyées telles quelles.
//
// Ce qui n'est jamais enregistré en clair :
//   - mots de passe      → empreinte scrypt (sel aléatoire par compte), à sens unique
//   - clé d'API de l'IA  → chiffrée en AES-256-GCM avec une clé dérivée de SESSION_SECRET
//   - codes et liens     → seule leur empreinte SHA-256 est gardée
import { randomBytes, randomInt, scrypt, createCipheriv, createDecipheriv, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { store } from './store.js';
import { env, assertEnv } from './env.js';
import { PROVIDER_IDS, PROVIDERS, checkBaseUrl } from './providers.js';

const scryptAsync = promisify(scrypt);
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sha = (v) => createHash('sha256').update(String(v)).digest('hex');
const now = () => Date.now();

export const CODE_TTL = 5 * 60 * 1000;      // code de connexion : 5 minutes
export const SETUP_TTL = 15 * 60 * 1000;    // lien de création / changement d'identifiants : 15 minutes
const MAX_CODE_TRIES = 5;
const MAX_FAILS = 5;                         // mots de passe erronés avant blocage du compte
const LOCK_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Lecture / écriture
// ---------------------------------------------------------------------------
const EMPTY = () => ({ accounts: [], ai: null, journal: [] });
export async function loadVault() { return { ...EMPTY(), ...((await store().getPrivate('vault')) || {}) }; }
async function saveVault(v) { await store().savePrivate('vault', v); }
async function loadTmp() {
  const t = { challenges: {}, setups: {}, ...((await store().getPrivate('vault-tmp')) || {}) };
  for (const bag of [t.challenges, t.setups]) for (const [k, v] of Object.entries(bag)) if (v.exp < now()) delete bag[k]; // purge des expirés
  return t;
}
async function saveTmp(t) { await store().savePrivate('vault-tmp', t); }

// ---------------------------------------------------------------------------
// Mots de passe (scrypt) et chiffrement (AES-256-GCM)
// ---------------------------------------------------------------------------
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(String(password), salt, 64, SCRYPT);
  return { algo: 'scrypt', N: SCRYPT.N, salt: b64(salt), hash: b64(hash) };
}
async function verifyPassword(password, rec) {
  // Compte inconnu : on fait quand même le calcul, pour que le délai de réponse ne révèle pas si l'identifiant existe.
  const salt = rec ? Buffer.from(rec.salt, 'base64url') : Buffer.alloc(16, 1);
  const hash = await scryptAsync(String(password), salt, 64, { ...SCRYPT, N: rec?.N || SCRYPT.N });
  if (!rec) return false;
  const expected = Buffer.from(rec.hash, 'base64url');
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

let vaultKey;
async function key() {
  assertEnv(['sessionSecret']);
  vaultKey ||= await scryptAsync(env.sessionSecret, 'fertilinnov-vault-v1', 32, { N: 16384, r: 8, p: 1 });
  return vaultKey;
}
export async function encrypt(plain) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', await key(), iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return `v1.${b64(iv)}.${b64(c.getAuthTag())}.${b64(ct)}`;
}
export async function decrypt(blob) {
  const [v, iv, tag, ct] = String(blob || '').split('.');
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Donnée chiffrée illisible.');
  const d = createDecipheriv('aes-256-gcm', await key(), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8');
}

// ---------------------------------------------------------------------------
// Règles sur l'identifiant et le mot de passe
// ---------------------------------------------------------------------------
export const normLogin = (v) => String(v || '').trim().toLowerCase();
export function checkCredentials(login, password) {
  const l = normLogin(login); const p = String(password || '');
  if (!/^[a-z0-9][a-z0-9._@-]{2,63}$/.test(l)) return 'Identifiant : 3 à 64 caractères (lettres, chiffres, point, tiret, @).';
  if (p.length < 12) return 'Mot de passe : 12 caractères au minimum.';
  if (p.length > 200) return 'Mot de passe trop long.';
  if (/^(.)\1+$/.test(p) || /^(0123456789|1234567890|123456789012|abcdefghijkl|azertyuiopqs|qwertyuiopas)/i.test(p)) return 'Mot de passe trop simple.';
  const low = p.toLowerCase();
  if (low.includes(l.split('@')[0]) || /fertil.?innov|motdepasse|password/.test(low)) return 'Mot de passe trop facile à deviner (il contient l’identifiant ou le nom de l’entreprise).';
  return null;
}

// ---------------------------------------------------------------------------
// Journal de sécurité (50 dernières entrées)
// ---------------------------------------------------------------------------
export const maskIp = (ip) => (/^\d+\.\d+\.\d+\.\d+$/.test(ip || '') ? ip.split('.').slice(0, 2).join('.') + '.x.x' : String(ip || '').split(':').slice(0, 3).join(':') + ':…');
export function deviceLabel(ua = '') {
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'appareil inconnu';
  const br = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'navigateur inconnu';
  return `${br} sur ${os}`;
}
function log(v, entry) { v.journal = [{ at: new Date().toISOString(), ...entry }, ...(v.journal || [])].slice(0, 50); }
export async function addJournal(entry) { const v = await loadVault(); log(v, entry); await saveVault(v); }

// ---------------------------------------------------------------------------
// Création / changement des identifiants : lien à usage unique émis par le bot Telegram
// ---------------------------------------------------------------------------
export async function createSetupToken({ chatId, name }) {
  const token = b64(randomBytes(32));
  const t = await loadTmp();
  for (const [k, s] of Object.entries(t.setups)) if (s.chatId === String(chatId)) delete t.setups[k]; // un seul lien valide par conversation
  t.setups[sha(token)] = { chatId: String(chatId), name: name || '', exp: now() + SETUP_TTL };
  await saveTmp(t);
  return token;
}
export async function peekSetup(token) {
  const s = (await loadTmp()).setups[sha(token)];
  if (!s) return null;
  const v = await loadVault();
  const acc = v.accounts.find((a) => a.chatId === s.chatId);
  return { name: s.name, login: acc?.login || '', exists: !!acc };
}
/** Crée le compte lié à la conversation Telegram, ou remplace son identifiant / mot de passe. */
export async function completeSetup(token, login, password) {
  const t = await loadTmp();
  const h = sha(token); const s = t.setups[h];
  if (!s) return { ok: false, erreur: 'Lien expiré ou déjà utilisé.' };
  const bad = checkCredentials(login, password);
  if (bad) return { ok: false, erreur: bad };
  const v = await loadVault();
  const l = normLogin(login);
  if (v.accounts.some((a) => a.login === l && a.chatId !== s.chatId)) return { ok: false, erreur: 'Cet identifiant est déjà utilisé.' };
  const pwd = await hashPassword(password);
  let acc = v.accounts.find((a) => a.chatId === s.chatId);
  const created = !acc;
  if (!acc) { acc = { id: b64(randomBytes(9)), chatId: s.chatId, createdAt: new Date().toISOString() }; v.accounts.push(acc); }
  Object.assign(acc, { login: l, name: s.name, pwd, fails: 0, lockedUntil: 0, pwdChangedAt: new Date().toISOString() });
  log(v, { event: created ? 'compte créé' : 'identifiants modifiés', login: l });
  delete t.setups[h];
  await Promise.all([saveVault(v), saveTmp(t)]);
  return { ok: true, created, login: l, chatId: s.chatId };
}
export async function accountForChat(chatId) { return (await loadVault()).accounts.find((a) => a.chatId === String(chatId)) || null; }
export async function deleteAccountForChat(chatId) {
  const v = await loadVault();
  const acc = v.accounts.find((a) => a.chatId === String(chatId));
  if (!acc) return false;
  v.accounts = v.accounts.filter((a) => a !== acc);
  log(v, { event: 'compte supprimé', login: acc.login });
  await saveVault(v);
  return true;
}
export async function hasAccounts() { return (await loadVault()).accounts.length > 0; }

// ---------------------------------------------------------------------------
// Connexion — étape 1 : identifiant + mot de passe → code à usage unique
// ---------------------------------------------------------------------------
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans 0/O, 1/I/L : lisible et sans ambiguïté
function newCode() { let c = ''; for (let i = 0; i < 8; i++) c += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]; return `${c.slice(0, 4)}-${c.slice(4)}`; }
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function startLogin({ login, password, ip, ua }) {
  const v = await loadVault();
  const acc = v.accounts.find((a) => a.login === normLogin(login));
  const locked = acc && acc.lockedUntil > now();
  const ok = await verifyPassword(password, acc?.pwd);
  if (!acc || locked || !ok) {
    if (acc && !locked) {
      acc.fails = (acc.fails || 0) + 1;
      if (acc.fails >= MAX_FAILS) { acc.lockedUntil = now() + LOCK_MS; acc.fails = 0; }
      log(v, { event: acc.lockedUntil > now() ? 'compte bloqué 1 h' : 'mot de passe refusé', login: acc.login, ip: maskIp(ip), device: deviceLabel(ua) });
      await saveVault(v);
    }
    // Même réponse dans tous les cas : on ne dit pas si c'est l'identifiant ou le mot de passe qui est faux.
    return { ok: false, lockedNow: !!acc && acc.lockedUntil > now() && !locked, account: acc || null };
  }
  const code = newCode();
  const id = b64(randomBytes(18));
  const t = await loadTmp();
  for (const [k, c] of Object.entries(t.challenges)) if (c.accountId === acc.id) delete t.challenges[k]; // un seul code valide à la fois
  t.challenges[id] = { accountId: acc.id, codeHash: sha(`${id}:${normCode(code)}`), exp: now() + CODE_TTL, tries: 0, ip: maskIp(ip), device: deviceLabel(ua) };
  await saveTmp(t);
  return { ok: true, challenge: id, code, account: acc };
}

// ---------------------------------------------------------------------------
// Connexion — étape 2 : vérification du code
// ---------------------------------------------------------------------------
export async function finishLogin({ challenge, code }) {
  const t = await loadTmp();
  const c = t.challenges[String(challenge || '')];
  if (!c) return { ok: false, erreur: 'Code expiré. Recommencez la connexion.', expired: true };
  c.tries += 1;
  const good = timingSafeEqual(Buffer.from(c.codeHash), Buffer.from(sha(`${challenge}:${normCode(code)}`)));
  if (!good) {
    const left = MAX_CODE_TRIES - c.tries;
    if (left <= 0) delete t.challenges[challenge];
    await saveTmp(t);
    return { ok: false, erreur: left > 0 ? `Code incorrect (${left} essai${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}).` : 'Trop d’essais. Recommencez la connexion.', expired: left <= 0 };
  }
  delete t.challenges[challenge];
  const v = await loadVault();
  const acc = v.accounts.find((a) => a.id === c.accountId);
  if (!acc) { await saveTmp(t); return { ok: false, erreur: 'Compte introuvable.', expired: true }; }
  acc.fails = 0; acc.lastLoginAt = new Date().toISOString();
  log(v, { event: 'connexion', login: acc.login, ip: c.ip, device: c.device });
  await Promise.all([saveVault(v), saveTmp(t)]);
  return { ok: true, account: acc, ip: c.ip, device: c.device };
}

/** Vérifie le mot de passe du compte connecté (redemandé avant une action sensible : changer la clé d'IA). */
export async function confirmPassword(accountId, password) {
  const acc = (await loadVault()).accounts.find((a) => a.id === accountId);
  return !!acc && (await verifyPassword(password, acc.pwd));
}
export async function getAccount(accountId) { return (await loadVault()).accounts.find((a) => a.id === accountId) || null; }

// ---------------------------------------------------------------------------
// Réglages de l'IA
// ---------------------------------------------------------------------------
export const AI_LIMITS = { // bornes : un réglage hors de ces valeurs est refusé (protège le budget)
  maxMessagesPerSession: [4, 60], maxMessagesPerIpPerDay: [10, 500], dailyTokenBudget: [50_000, 20_000_000], maxOutputTokens: [300, 4000],
};
export const AI_PROVIDERS = PROVIDER_IDS;

/** Réglages enregistrés, clé déchiffrée (usage serveur uniquement). */
export async function loadAiConfig() {
  const ai = (await loadVault()).ai;
  if (!ai) return null;
  let apiKey = '';
  try { if (ai.apiKeyEnc) apiKey = await decrypt(ai.apiKeyEnc); } catch (e) { console.error('[vault] clé IA illisible (SESSION_SECRET changé ?)', e.message); }
  return { ...ai, apiKey };
}

/** Enregistre les réglages. apiKey : undefined = inchangée · '' = effacée (retour à la clé du serveur). */
export async function saveAiConfig(patch, { login } = {}) {
  const v = await loadVault();
  const prev = v.ai || {};
  const next = { ...prev };
  if (patch.enabled !== undefined) next.enabled = !!patch.enabled;
  if (patch.provider !== undefined) { if (!AI_PROVIDERS.includes(patch.provider)) throw new Error('Fournisseur inconnu.'); next.provider = patch.provider; }
  for (const k of ['model', 'guardModel']) if (patch[k] !== undefined) next[k] = String(patch[k] || '').trim().slice(0, 120);
  if (PROVIDERS[next.provider]?.custom) {
    if (patch.baseUrl !== undefined) { const c = checkBaseUrl(patch.baseUrl); if (c.erreur) throw new Error(c.erreur); next.baseUrl = c.url; }
  } else delete next.baseUrl;
  if (patch.extra !== undefined) next.extra = String(patch.extra || '').trim().slice(0, 1500);
  if (patch.limits) {
    next.limits = { ...(prev.limits || {}) };
    for (const [k, [min, max]] of Object.entries(AI_LIMITS)) {
      if (patch.limits[k] === undefined || patch.limits[k] === null || patch.limits[k] === '') continue;
      const n = Math.round(Number(patch.limits[k]));
      if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Valeur hors limites pour ${k} (${min} à ${max}).`);
      next.limits[k] = n;
    }
  }
  let keyChanged = false;
  if (patch.apiKey !== undefined) {
    const k = String(patch.apiKey || '').trim();
    if (k) { next.apiKeyEnc = await encrypt(k); next.apiKeyHint = `…${k.slice(-4)}`; next.apiKeyProvider = next.provider; } else { delete next.apiKeyEnc; delete next.apiKeyHint; delete next.apiKeyProvider; }
    keyChanged = true;
  }
  next.updatedAt = new Date().toISOString(); next.updatedBy = login || '';
  v.ai = next;
  log(v, { event: keyChanged ? 'clé d’IA modifiée' : 'réglages IA modifiés', login: login || '' });
  await saveVault(v);
  return { keyChanged };
}

/** Bascule rapide marche / arrêt (bot Telegram). */
export async function setAiEnabled(enabled, { login } = {}) { return saveAiConfig({ enabled }, { login }); }
