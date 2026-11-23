// Réglages de l'IA effectifs : ceux de l'espace de pilotage (coffre chiffré) par-dessus les variables du serveur.
// Relus au plus toutes les 20 secondes : un changement fait dans l'espace est pris en compte sans redémarrage.
import { applyAi } from './env.js';
import { loadAiConfig } from './vault.js';

let at = 0;
let pending = null;

export async function ensureAi({ fresh = false } = {}) {
  if (!fresh && Date.now() - at < 20_000) return;
  pending ||= (async () => {
    try { applyAi(await loadAiConfig()); }
    catch (e) { console.error('[ai] réglages indisponibles, variables du serveur utilisées :', e.message); applyAi(null); }
    finally { at = Date.now(); pending = null; }
  })();
  await pending;
}

/** À appeler après un enregistrement : le prochain appel relit le coffre. */
export function invalidateAi() { at = 0; }
