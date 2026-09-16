// Traduction automatique des textes du propriétaire (français → anglais, espagnol)
// par le petit modèle rapide. Utilisé par le Chef quand il modifie un texte du site :
// le propriétaire écrit en français, les deux autres langues suivent.
import { complete } from './llm.js';
import { LANGS } from '../../src/data/infos.js';

const NAMES = { fr: 'français', en: 'anglais', es: 'espagnol' };

/** Traduit `text` (langue `from`) vers chaque langue de LANGS ; retourne { fr, en, es }. */
export async function translateAll(text, from = 'fr') {
  const out = { [from]: String(text) };
  const src = String(text || '').trim();
  if (!src) return Object.fromEntries(LANGS.map((l) => [l, '']));
  await Promise.all(LANGS.filter((l) => l !== from).map(async (l) => {
    try {
      const raw = await complete({
        system: `Tu es un traducteur professionnel pour un site web d'ingénierie écologique (microbiologie des sols, agriculture, remédiation). Traduis le texte du ${NAMES[from]} vers l'${NAMES[l]}${l === 'en' ? ' (anglais britannique)' : ''}. Conserve le ton, les chiffres, les unités, les noms propres, les noms latins d'espèces et les emojis. Réponds UNIQUEMENT par la traduction, sans guillemets ni commentaire.`,
        user: src,
        maxTokens: Math.min(1500, 80 + src.length * 2),
      });
      const t = raw.trim().replace(/^["«»“”]+|["«»“”]+$/g, '');
      out[l] = t || src;
    } catch (e) {
      console.error('translate', l, e.message);
      out[l] = src; // repli : texte source
    }
  }));
  return out;
}

/** Normalise une valeur multilingue : chaîne → { fr, en, es } traduits ; objet partiel → complété. */
export async function toMultilang(value, from = 'fr') {
  if (value == null) return undefined;
  if (typeof value === 'string') return translateAll(value, from);
  if (typeof value === 'object') {
    const base = value.fr || value[from] || Object.values(value)[0] || '';
    const missing = LANGS.filter((l) => !value[l]);
    if (!missing.length) return value;
    const all = await translateAll(base, value.fr ? 'fr' : from);
    return { ...all, ...Object.fromEntries(Object.entries(value).filter(([, v]) => v)) };
  }
  return undefined;
}
