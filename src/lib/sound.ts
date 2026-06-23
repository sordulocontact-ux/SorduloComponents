/**
 * Lecture des sons de la vitrine.
 * - met en cache un élément Audio par source (préchargé) ;
 * - clone le nœud à chaque lecture → rejouabilité immédiate, même en clics rapprochés ;
 * - surface les erreurs en dev (autoplay bloqué, source illisible…).
 */

const cache = new Map<string, HTMLAudioElement>();

/** Précharge le son (à appeler au montage du composant qui le possède). */
export function preloadSound(src: string): void {
  if (cache.has(src)) return;
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.load();
  cache.set(src, audio);
}

/**
 * Joue le son (depuis le début) et renvoie sa durée en ms (0 si encore inconnue).
 * `volume` ∈ [0, 1].
 */
export function playSound(src: string, volume = 1): number {
  let base = cache.get(src);
  if (!base) {
    base = new Audio(src);
    base.preload = 'auto';
    cache.set(src, base);
  }

  // Cloner permet des lectures superposées sans couper la précédente.
  const node = base.cloneNode(true) as HTMLAudioElement;
  node.volume = volume;
  node.currentTime = 0;

  const played = node.play();
  if (played) {
    played.catch((err) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[sound] lecture impossible:', src, err);
      }
    });
  }

  // `base` est préchargé → sa durée est généralement déjà disponible.
  return Number.isFinite(base.duration) ? base.duration * 1000 : 0;
}
