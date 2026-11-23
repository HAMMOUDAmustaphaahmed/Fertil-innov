// POST /api/hit — mesure d'audience sans cookie (voir _lib/audience.js). Appelé par le site à chaque page affichée.
// Corps : { p: chemin, r: page d'origine (document.referrer), e: true au premier affichage }.
// Répond toujours 204, sans contenu : un échec de mesure ne doit jamais gêner le visiteur.
import { readJson, getIp } from './_lib/http.js';
import { recordHit, isBot } from './_lib/audience.js';

// Limite par adresse, gardée en mémoire une minute seulement (jamais enregistrée) : évite de gonfler les compteurs.
const recent = new Map();
const MAX_PER_MINUTE = 40;
function tooMany(ip) {
  const minute = Math.floor(Date.now() / 60_000);
  if (recent.size > 5000) recent.clear();
  const r = recent.get(ip);
  if (!r || r.minute !== minute) { recent.set(ip, { minute, n: 1 }); return false; }
  r.n += 1;
  return r.n > MAX_PER_MINUTE;
}

const done = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

export async function POST(request) {
  try {
    const ua = request.headers.get('user-agent') || '';
    const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
    // Uniquement les appels du site lui-même (le navigateur indique l'origine de la requête).
    const site = request.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin') return done();
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== host) return done();
    if (isBot(ua) || tooMany(getIp(request))) return done();
    const body = await readJson(request);
    if (!body || typeof body.p !== 'string') return done();
    await recordHit({ path: body.p, referrer: typeof body.r === 'string' ? body.r.slice(0, 300) : '', entry: body.e === true, ua, host });
  } catch (e) {
    console.error('hit', e?.message || e);
  }
  return done();
}
