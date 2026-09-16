// GET /api/cron/daily — appelé chaque matin par Vercel Cron (vercel.json) :
// envoie le briefing du jour au propriétaire sur Telegram.
import { env } from '../_lib/env.js';
import { json, error } from '../_lib/http.js';
import { briefingDuJour } from '../_lib/chef.js';
import { broadcast } from '../_lib/telegram.js';

export const maxDuration = 60;

export async function GET(request) {
  const auth = request.headers.get('authorization') || '';
  if (env.cronSecret && auth !== `Bearer ${env.cronSecret}`) return error(401, 'Non autorisé.');
  try {
    const text = await briefingDuJour();
    const sent = await broadcast(text).catch((e) => { console.error('broadcast', e.message); return 0; });
    return json({ ok: true, telegram: sent });
  } catch (e) {
    console.error('cron daily', e);
    return error(500, e.message);
  }
}
