// Serveur Node autonome : fait tourner le site complet HORS de Vercel (hébergeur classique avec Node.js,
// VPS, cPanel « Setup Node.js App » / Passenger via app.cjs…). Aucune dépendance en plus de celles du projet.
//
//   npm run build     → génère dist/ (pages pré-rendues)
//   npm start         → sert dist/ + /api/* sur le port PORT (3000 par défaut)
//
// Il reproduit ce que Vercel fait à partir de vercel.json, qui reste la source unique :
//   - redirections, en-têtes de sécurité et de cache, adresses sans « / » final, pages sans « .html »
//   - fonctions api/*.js (même signature Web : Request → Response, flux SSE compris)
//   - tâche planifiée (« crons ») : briefing du matin
//   - repli sur index.html pour les adresses inconnues (comme la règle « rewrites »)
// Sur Vercel, ce fichier n'est simplement pas utilisé.
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const API = path.join(ROOT, 'api');

// ---------------------------------------------------------------------------------------------------
// Variables d'environnement : .env.local puis .env (celles déjà définies par l'hébergeur ont priorité).
// ---------------------------------------------------------------------------------------------------
for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!existsSync(p)) continue;
  for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(raw);
    if (!m) continue; // ligne vide ou commentaire
    let v = m[2].trim();
    const quoted = /^(['"])(.*)\1$/.exec(v);
    if (quoted) v = quoted[2]; else v = v.replace(/\s+#.*$/, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ---------------------------------------------------------------------------------------------------
// Règles de vercel.json
// ---------------------------------------------------------------------------------------------------
// Motif de redirection (« /:lang(en|es)/sols », « /sols ») → expression régulière + noms des paramètres.
function compileRoute(source) {
  const names = [];
  const rx = source.replace(/[.+*?^${}|[\]\\]/g, (c) => (c === '(' || c === ')' || c === '|' ? c : `\\${c}`))
    .replace(/:([A-Za-z_]\w*)(\(([^)]*)\))?/g, (_, name, _g, pattern) => { names.push(name); return `(${pattern || '[^/]+'})`; });
  return { rx: new RegExp(`^${rx}$`), names };
}
const redirects = (config.redirects || []).map((r) => ({ ...compileRoute(r.source), destination: r.destination, status: r.statusCode || (r.permanent ? 308 : 307) }));
// Les « source » des en-têtes sont déjà des expressions régulières (« /images/(.*) », « /(.*) »).
const headerRules = (config.headers || []).map((h) => ({ rx: new RegExp(`^${h.source}$`), headers: h.headers, missing: h.missing || [] }));

function ruleHeaders(pathname, host) {
  const out = {};
  for (const rule of headerRules) {
    if (!rule.rx.test(pathname)) continue;
    // « missing » : la règle ne s'applique que si la condition n'est PAS remplie (ex. autre hôte que le domaine officiel → noindex).
    if (rule.missing.some((c) => c.type === 'host' && c.value === host)) continue;
    for (const { key, value } of rule.headers) out[key] = value;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------
// Fichiers statiques
// ---------------------------------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.map': 'application/json; charset=utf-8', '.pdf': 'application/pdf',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

/** Chemin demandé → fichier de dist/ (pages sans « .html », dossiers → index.html). Jamais hors de dist/. */
function resolveStatic(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }
  if (rel.includes('\0')) return null;
  const base = path.join(DIST, rel);
  if (base !== DIST && !base.startsWith(DIST + path.sep)) return null; // tentative de sortie du dossier
  if (path.basename(base).startsWith('.')) return null; // fichiers cachés (.htaccess…) non servis
  for (const candidate of [base, `${base}.html`, path.join(base, 'index.html')]) {
    try { if (statSync(candidate).isFile()) return candidate; } catch { /* suivant */ }
  }
  return null;
}

// Compression à la volée, gardée en mémoire par fichier (dist/ ne change pas pendant que le serveur tourne).
const compressed = new Map();
function compress(file, stat, encoding) {
  const key = `${encoding}:${file}:${stat.mtimeMs}`;
  if (!compressed.has(key)) {
    const raw = readFileSync(file);
    compressed.set(key, encoding === 'br'
      ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
      : zlib.gzipSync(raw, { level: 8 }));
  }
  return compressed.get(key);
}

function sendFile(req, res, file, status, extra) {
  const stat = statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const etag = `W/"${stat.size.toString(16)}-${Math.round(stat.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': type,
    // Par défaut comme Vercel : toujours revalidé (les fichiers /assets, /images, /fonts ont leur propre règle longue durée).
    'Cache-Control': 'public, max-age=0, must-revalidate',
    ETag: etag,
    'Last-Modified': stat.mtime.toUTCString(),
    ...extra,
  };
  if (status === 200 && req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  const accept = String(req.headers['accept-encoding'] || '');
  const encoding = COMPRESSIBLE.test(type) && stat.size > 1024 ? (/\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : '') : '';
  headers.Vary = 'Accept-Encoding';
  if (encoding) {
    const body = compress(file, stat, encoding);
    res.writeHead(status, { ...headers, 'Content-Encoding': encoding, 'Content-Length': body.length });
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  res.writeHead(status, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  return createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

// ---------------------------------------------------------------------------------------------------
// Fonctions /api/*
// ---------------------------------------------------------------------------------------------------
const MAX_BODY = 12 * 1024 * 1024; // photos envoyées depuis l'espace propriétaire
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Corps trop volumineux'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const modules = new Map();
function loadApi(name) {
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(name) || name.split('/').some((s) => s.startsWith('_'))) return null; // api/_lib n'est pas exposé
  const file = path.join(API, `${name}.js`);
  if (!existsSync(file)) return null;
  if (!modules.has(file)) modules.set(file, import(pathToFileURL(file).href));
  return modules.get(file);
}

function toRequest(req, body) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  // Sans proxy devant le serveur, l'adresse du visiteur est celle de la connexion.
  if (!headers.has('x-forwarded-for') && req.socket.remoteAddress) headers.set('x-forwarded-for', req.socket.remoteAddress);
  if (!headers.has('x-forwarded-proto')) headers.set('x-forwarded-proto', req.socket.encrypted ? 'https' : 'http');
  const proto = headers.get('x-forwarded-proto').split(',')[0].trim();
  const url = new URL(req.url, `${proto}://${req.headers.host || 'localhost'}`);
  return new Request(url, { method: req.method, headers, body: body && body.length ? body : undefined });
}

async function handleApi(req, res, pathname, extra) {
  const name = pathname.slice(5).replace(/\/$/, '');
  const loading = loadApi(name);
  if (!loading) { res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', ...extra }); return res.end('{"error":"Introuvable."}'); }
  try {
    const mod = await loading;
    const handler = mod[req.method] || (req.method === 'HEAD' && mod.GET) || mod.default;
    if (!handler) { res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', ...extra }); return res.end('{"error":"Méthode non autorisée."}'); }
    const body = ['GET', 'HEAD'].includes(req.method) ? null : await readBody(req);
    const response = await handler(toRequest(req, body));
    for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
    response.headers.forEach((v, k) => { if (k !== 'set-cookie') res.setHeader(k, v); });
    const cookies = response.headers.getSetCookie?.() || [];
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.writeHead(response.status);
    if (!response.body || req.method === 'HEAD') return res.end();
    // Flux (SSE de Petit Pois) : chaque morceau est envoyé dès qu'il arrive.
    res.flushHeaders();
    const reader = response.body.getReader();
    req.on('close', () => reader.cancel().catch(() => {}));
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();
  } catch (e) {
    console.error(`[api] ${req.method} ${pathname}`, e);
    if (res.headersSent) return res.end();
    res.writeHead(e.status || 500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
    return res.end(JSON.stringify({ error: e.status === 413 ? 'Fichier trop volumineux.' : 'Erreur serveur.' }));
  }
}

// ---------------------------------------------------------------------------------------------------
// Requêtes
// ---------------------------------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); return res.end(); }
  const pathname = url.pathname.replace(/\/{2,}/g, '/');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  const extra = ruleHeaders(pathname, host);

  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname, extra);

  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD', ...extra }); return res.end(); }

  // « trailingSlash: false » : /services/ → /services
  if (config.trailingSlash === false && pathname.length > 1 && pathname.endsWith('/')) {
    res.writeHead(308, { Location: pathname.replace(/\/+$/, '') + url.search, ...extra }); return res.end();
  }
  // « cleanUrls » : /services.html → /services
  if (config.cleanUrls && pathname.endsWith('.html')) {
    const clean = pathname.replace(/(\/index)?\.html$/, '') || '/';
    res.writeHead(308, { Location: clean + url.search, ...extra }); return res.end();
  }
  for (const r of redirects) {
    const m = r.rx.exec(pathname);
    if (!m) continue;
    let to = r.destination;
    r.names.forEach((n, i) => { to = to.replace(new RegExp(`:${n}\\b`, 'g'), m[i + 1]); });
    res.writeHead(r.status, { Location: to, ...extra }); return res.end();
  }

  const file = resolveStatic(pathname);
  if (file) return sendFile(req, res, file, 200, extra);
  // Fichier demandé (avec extension) mais absent : vraie erreur 404, pas la page d'accueil.
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...extra }); return res.end('Introuvable'); }
  // Adresse inconnue : l'application s'affiche et montre sa page « introuvable » (règle « rewrites » de vercel.json).
  return sendFile(req, res, path.join(DIST, 'index.html'), 200, extra);
});

// ---------------------------------------------------------------------------------------------------
// Tâches planifiées (« crons » de vercel.json, heure UTC) : motifs « minute heure * * * ».
// ---------------------------------------------------------------------------------------------------
const crons = (config.crons || []).map((c) => {
  const [min, hour, ...rest] = c.schedule.trim().split(/\s+/);
  if (!/^\d+$/.test(min) || !/^\d+$/.test(hour) || rest.join(' ') !== '* * *') { console.warn(`[cron] planification non gérée par server.mjs : « ${c.schedule} » (${c.path})`); return null; }
  return { path: c.path, min: Number(min), hour: Number(hour), last: '' };
}).filter(Boolean);

async function runCron(c) {
  const loading = loadApi(c.path.replace(/^\/api\//, ''));
  if (!loading) return console.warn(`[cron] ${c.path} introuvable`);
  try {
    const mod = await loading;
    const headers = process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {};
    const origin = (process.env.PUBLIC_SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
    const response = await (mod.GET || mod.default)(new Request(origin + c.path, { headers }));
    console.log(`[cron] ${c.path} → ${response.status}`);
  } catch (e) { console.error(`[cron] ${c.path}`, e); }
}
// DISABLE_CRON=1 : à poser si l'hébergeur lance plusieurs processus, ou si une tâche planifiée externe appelle déjà l'adresse.
if (crons.length && process.env.DISABLE_CRON !== '1') {
  setInterval(() => {
    const now = new Date(); const day = now.toISOString().slice(0, 10);
    for (const c of crons) if (now.getUTCHours() === c.hour && now.getUTCMinutes() === c.min && c.last !== day) { c.last = day; runCron(c); }
  }, 30_000).unref();
}

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html est absent : lancez « npm run build » avant « npm start ».');
  process.exit(1);
}
server.listen(PORT, HOST, () => console.log(`Fertil'Innov — serveur prêt sur le port ${PORT} (${process.env.NODE_ENV})`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
