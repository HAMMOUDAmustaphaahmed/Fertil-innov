// GET /api/site — configuration publique du site (textes, listes, palette, images,
// coordonnées, horaires, chiffres). Lue au chargement du front et par le pré-rendu.
import { json, error } from './_lib/http.js';
import { getSettings, publicSettings } from './_lib/settings.js';
import { parisNow } from '../src/data/infos.js';

export async function GET() {
  try {
    const settings = await getSettings();
    return json({ ...publicSettings(settings), today: parisNow().isoDate }, { headers: { 'cache-control': 'public, max-age=15, s-maxage=15' } });
  } catch (e) {
    console.error('site', e);
    return error(500, 'Configuration indisponible.');
  }
}
