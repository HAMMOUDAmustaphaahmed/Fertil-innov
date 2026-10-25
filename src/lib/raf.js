// Regroupe un gestionnaire d'événements fréquent (pointermove…) à une exécution par image, avec le dernier
// événement reçu : les mesures (getBoundingClientRect) ne forcent plus un recalcul de mise en page à chaque
// mouvement, et le rendu suit toujours le pointeur à la fréquence d'affichage.
export function rafThrottle(fn) {
  let id = 0; let last = null;
  const run = () => { id = 0; const e = last; last = null; fn(e); };
  const throttled = (e) => { last = e; if (!id) id = requestAnimationFrame(run); };
  throttled.cancel = () => { cancelAnimationFrame(id); id = 0; last = null; };
  return throttled;
}
