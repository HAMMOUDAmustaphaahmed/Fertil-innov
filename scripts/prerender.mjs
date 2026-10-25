// Pré-rendu statique de toutes les pages × langues après `vite build` :
//   dist/index.html, dist/services/index.html, dist/en/index.html, dist/es/services/index.html…
// + sitemap.xml. La configuration du site est lue dans Supabase si les variables sont
// présentes (build Vercel), sinon les défauts du code sont utilisés.
// Un échec sur une page n'interrompt pas le build : la page reste servie en SPA.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';

Object.assign(process.env, Object.fromEntries(Object.entries(loadEnv('production', process.cwd(), '')).filter(([k]) => process.env[k] === undefined)));

const DIST = path.resolve('dist');
const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const ssr = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);

const LANGS = ['fr', 'en', 'es'];
const PATHS = ['/', '/services', '/activites', '/expertise', '/formations', '/chiffres', '/blog', '/equipe', '/faq', '/contact'];
const localePath = (p, l) => (l === 'fr' ? p : p === '/' ? `/${l}` : `/${l}${p}`);

let site = null;
try {
  if (process.env.SUPABASE_URL) {
    const { getSettings, publicSettings } = await import(pathToFileURL(path.resolve('api/_lib/settings.js')).href);
    site = publicSettings(await getSettings({ fresh: true }));
    console.log(`[prerender] configuration du site chargée (v${site.version})`);
  }
} catch (e) { console.warn('[prerender] configuration Supabase indisponible, défauts utilisés :', e.message); }

// Domaine officiel (canonical, sitemap, hreflang) — indépendant de l'URL Vercel de déploiement.
const siteUrl = (site?.entreprise?.siteUrl || 'https://www.fertilinnov-environnement.com').replace(/\/$/, '');
globalThis.window = undefined; // sécurité : aucun accès window côté serveur

// Content-Security-Policy par page : seuls les scripts du site s'exécutent (fichiers de /assets + scripts en ligne
// de cette page, autorisés par leur empreinte SHA-256). Un script injecté (texte malveillant dans la configuration,
// extension, faille future) est refusé par le navigateur. frame-ancestors (anti-iframe) est dans vercel.json :
// cette directive n'est pas lue dans une balise <meta>.
function cspMeta(page) {
  const hashes = [];
  for (const [, attrs, body] of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs) || !body) continue; // fichiers externes / données JSON-LD
    // Le navigateur normalise les fins de ligne (\r\n → \n) avant de calculer l'empreinte : on fait de même.
    hashes.push(`'sha256-${createHash('sha256').update(body.replace(/\r\n?/g, '\n')).digest('base64')}'`);
  }
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // styles en ligne : mise en page pré-rendue, animations
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:", // photos envoyées via le Chef (Supabase), tuiles de la carte
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join('; ');
  return `<meta http-equiv="Content-Security-Policy" content="${policy}" />\n`;
}

let ok = 0; let ko = 0;
const urls = [];
for (const l of LANGS) for (const p of PATHS) {
  const url = localePath(p, l);
  urls.push(url);
  try {
    const { html, head, htmlAttrs } = await ssr.render(url, site);
    // '\\u003c' : « < » échappé en JSON, un texte du site contenant </script> ne peut plus fermer la balise.
    const injected = `<script>window.__SITE__=${JSON.stringify(site || null).replace(/</g, '\\u003c')};window.__SITE_URL__=${JSON.stringify(siteUrl)};</script>`;
    let page = template
      .replace('<html lang="fr">', `<html ${htmlAttrs || 'lang="fr"'}>`)
      .replace(/<title>[^<]*<\/title>/, '')
      .replace('<!--app-head-->', `<!--csp-->${head}\n${injected}`)
      .replace('<div id="root"><!--app-html--></div>', `<div id="root" data-prerendered="1">${html}</div>`);
    page = page.replace('<!--csp-->', cspMeta(page));
    const out = path.join(DIST, url === '/' ? '' : url.slice(1), 'index.html');
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, page);
    ok++;
  } catch (e) { ko++; console.error('[prerender] échec', url, e?.message || e); }
}

// Sitemap avec alternates hreflang
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PATHS.map((p) => LANGS.map((l) => `  <url>
    <loc>${siteUrl}${localePath(p, l)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' || p === '/blog' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : p === '/services' || p === '/contact' ? '0.9' : '0.7'}</priority>
${LANGS.map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${siteUrl}${localePath(p, x)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${localePath(p, 'fr')}"/>
  </url>`).join('\n')).join('\n')}
</urlset>
`;
writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
// robots.txt : on injecte l'URL réelle du sitemap
const robots = path.join(DIST, 'robots.txt');
if (existsSync(robots)) writeFileSync(robots, readFileSync(robots, 'utf8').replace(/Sitemap: .*/g, `Sitemap: ${siteUrl}/sitemap.xml`));
console.log(`[prerender] ${ok} pages générées${ko ? `, ${ko} en échec (servies en SPA)` : ''} · sitemap.xml (${urls.length} URL)`);
process.exit(0);
