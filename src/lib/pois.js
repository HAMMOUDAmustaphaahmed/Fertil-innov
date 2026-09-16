// Petit bus d'événements pour piloter le widget Petit Pois depuis n'importe quelle page.
//   openPois()                → ouvre le chat
//   openPois('Je voudrais…')  → ouvre le chat et envoie ce message
//   teasePois('Texte')        → affiche une bulle d'invitation près du bouton (sans ouvrir)
export const POIS_EVENT = 'pois:command';

export function openPois(message) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(POIS_EVENT, { detail: { type: 'open', message } }));
}

export function teasePois(text) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(POIS_EVENT, { detail: { type: 'tease', text } }));
}
