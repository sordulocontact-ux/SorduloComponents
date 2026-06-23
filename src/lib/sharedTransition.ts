/**
 * Relais pour la transition d'élément partagé : au clic sur une carte, on mémorise
 * le rectangle de son aperçu (coordonnées viewport) ; à l'arrivée sur la page de
 * détail, on le « consomme » pour rejouer un FLIP — l'aperçu du composant semble
 * voler/zoomer depuis la carte jusqu'à sa boîte finale.
 *
 * Volontairement minimal (variable de module) : une seule navigation à la fois,
 * et l'origine n'est valable que pour une transition immédiate.
 */

type Origin = { id: string; rect: DOMRect };

let pending: Origin | null = null;
let stamp = 0;

/** Mémorise le rectangle de l'aperçu de la carte cliquée. */
export function setOrigin(id: string, rect: DOMRect) {
  pending = { id, rect };
  stamp = performance.now();
}

/**
 * Récupère (et efface) l'origine pour `id`, seulement si elle correspond et reste
 * récente. Renvoie `null` sinon (ouverture directe d'URL, retour navigateur…) →
 * pas de FLIP, on retombe sur un simple fondu du composant.
 */
export function takeOrigin(id: string): DOMRect | null {
  if (!pending || pending.id !== id) return null;
  const fresh = performance.now() - stamp < 2000;
  const { rect } = pending;
  pending = null;
  return fresh ? rect : null;
}
