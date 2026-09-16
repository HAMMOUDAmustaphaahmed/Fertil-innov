// Copie et optimise les images du site d'origine (../Fertil-Innov/assets/images)
// vers public/images : JPG/PNG lourds → WebP redimensionnés, SVG/ICO copiés tels quels.
// Usage : node scripts/optimize-images.mjs [chemin-source]
import sharp from 'sharp';
import { readdirSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || path.resolve('../Fertil-Innov/assets/images');
const OUT = path.resolve('public/images');
mkdirSync(OUT, { recursive: true });

// nom source → { nom de sortie, largeur max }
const WANTED = {
  'analyse-de-sol.jpg': ['hero', 1800],
  'realisation1.jpg': ['sol-profil', 1600],
  'facts1.jpg': ['labo-recherche', 1000], 'facts2.jpg': ['labo-analyse', 1000], 'facts3.jpg': ['microscope', 1000],
  'facts4.jpg': ['site-rehabilite', 1000], 'facts5.jpg': ['racines', 1000],
  'ceo1.jpg': ['equipe-souhir', 700], 'equipe2.jpg': ['equipe-alexandre', 700], 'equipe3.jpg': ['equipe-johanna', 700], 'equipe5.jpg': ['equipe-jeanclaude', 700],
  '1.jpg': ['blog-carnoules', 900], '3.jpg': ['blog-arnica', 900], '5.jpg': ['blog-endorse', 900], '6.jpg': ['blog-biostimulants', 900],
  '2.gif': ['blog-pollutec', 900],
  'sites.jpg': ['sites', 1200], 'carte_sites.png': ['carte-sites', 1200],
  'a1.jpg': ['terrain-1', 1000], 'a2.jpg': ['terrain-2', 1000], 'a3.jpeg': ['terrain-3', 1000], 'a4.jpg': ['terrain-4', 1000],
  'contactus3.jpg': ['contact', 1400],
  'mascott.webp': ['petit-pois', 600],
  'logo.png': ['logo', 400], 'new_logo.png': ['logo-rond', 500],
};
for (let i = 1; i <= 30; i++) for (const ext of ['jpg', 'png']) WANTED[`partenaire${i}.${ext}`] = [`partenaire-${i}`, 400];

let done = 0;
for (const f of readdirSync(SRC)) {
  const ext = path.extname(f).toLowerCase();
  if (['.svg', '.ico'].includes(ext)) { copyFileSync(path.join(SRC, f), path.join(OUT, f.replace(/\s|\(|\)/g, ''))); continue; }
  const w = WANTED[f];
  if (!w) continue;
  const [name, width] = w;
  const input = path.join(SRC, f);
  try {
    if (name === 'logo' || name === 'logo-rond' || name === 'petit-pois' || name.startsWith('partenaire')) {
      // Logos : PNG/WebP sans perte de transparence
      await sharp(input, { animated: false }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, `${name}.webp`));
    } else {
      await sharp(input, { animated: false }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(OUT, `${name}.webp`));
    }
    done++;
  } catch (e) { console.warn('skip', f, e.message); }
}
console.log(`${done} images optimisées → ${OUT}`);

// Favicons et icônes PWA depuis le logo rond (même icône que le logo du site).
const logo = path.join(SRC, 'new_logo.png');
for (const [name, size] of [['favicon-32.png', 32], ['favicon-16.png', 16], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(logo).rotate().trim().resize({ width: size, height: size, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(path.join(OUT, name));
}
console.log('favicons générés');
