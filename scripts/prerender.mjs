// Pré-rendu statique de toutes les pages × langues après `vite build` :
//   dist/index.html, dist/services/index.html, dist/en/index.html, dist/es/services/index.html…
// + sitemap.xml. La configuration du site est lue dans Supabase si les variables sont
// présentes (build Vercel), sinon les défauts du code sont utilisés.
// Un échec sur une page n'interrompt pas le build : la page reste servie en SPA.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

Object.assign(process.env, Object.fromEntries(Object.entries(loadEnv('production', process.cwd(), '')).filter(([k]) => process.env[k] === undefined)));

const DIST = path.resolve('dist');
const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const ssr = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);

const LANGS = ['fr', 'en', 'es'];
const PATHS = ['/', '/services', '/activites', '/expertise', '/formations', '/chiffres', '/blog', '/sols', '/faq', '/contact'];
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

let ok = 0; let ko = 0;
const urls = [];
for (const l of LANGS) for (const p of PATHS) {
  const url = localePath(p, l);
  urls.push(url);
  try {
    const { html, head, htmlAttrs } = await ssr.render(url, site);
    const injected = `<script>window.__SITE__=${JSON.stringify(site || null).replace(/</g, '\u003c')};window.__SITE_URL__=${JSON.stringify(siteUrl)};</script>`;
    let page = template
      .replace('<html lang="fr">', `<html ${htmlAttrs || 'lang="fr"'}>`)
      .replace(/<title>[^<]*<\/title>/, '')
      .replace('<!--app-head-->', `${head}\n${injected}`)
      .replace('<div id="root"><!--app-html--></div>', `<div id="root" data-prerendered="1">${html}</div>`);
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
