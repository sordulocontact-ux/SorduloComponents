/**
 * Constantes et utilitaires de mouvement partagés par la transition de page
 * (sortie de l'accueil → entrée sur la page de détail). Centralisés ici pour que
 * l'accueil (orchestration + délai de navigation), les cartes (chute des aperçus,
 * disparition du titre), le découpage de texte et le FLIP restent synchronisés et
 * cohérents.
 *
 * Principe : tout glisse et se fait rogner (overflow hidden), jamais d'opacité sur
 * les composants. Easings homogènes : entrées/atterrissages en sortie douce,
 * sorties/chutes en accélération.
 */

/** Décélération douce et profonde — entrées, apparitions, atterrissage du FLIP. */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
/** Accélération — sorties : aperçus qui tombent, textes qui glissent/disparaissent. */
export const EASE_IN = 'cubic-bezier(0.5, 0, 0.75, 0)';

/** Durée de chute d'un aperçu (translateY + rotation), en ms. */
export const PREVIEW_FALL_MS = 520;
/** Décalage entre la chute de deux aperçus consécutifs, en ms. */
export const PREVIEW_STAGGER_MS = 50;
/** Délai (court) entre le départ de la chute des aperçus et celui du texte, en ms. */
export const TEXT_DELAY_MS = 170;
/** Décalage entre deux lettres consécutives, en ms. */
export const LETTER_STAGGER_MS = 22;
/** Durée de transition d'une lettre (apparition/disparition), en ms. */
export const LETTER_DURATION_MS = 460;
/** Durée du vol/zoom du composant (FLIP) vers la page de détail, en ms. */
export const HERO_FLIP_MS = 880;
/**
 * Délai avant que le reste (titre, réglages, description…) ne commence à apparaître :
 * on attend que le vol/zoom du composant soit presque terminé (~80 % du FLIP).
 */
export const ENTRY_DELAY_MS = 680;
/** Durée des fondus d'apparition (réglages, reste) sur la page de détail, en ms. */
export const FADE_MS = 720;

/** L'utilisateur préfère les animations réduites ? */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Durée totale de la sortie de l'accueil avant de basculer sur la page de détail :
 * chute des aperçus, puis disparition lettre par lettre du texte le plus long.
 */
export function exitDurationMs(longestText: number) {
  return TEXT_DELAY_MS + longestText * LETTER_STAGGER_MS + LETTER_DURATION_MS + 100;
}
