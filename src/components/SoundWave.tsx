import type { CSSProperties } from 'react';

/**
 * Hauteur de pic de chaque barre (px) — silhouette d'égaliseur de la maquette.
 * Au repos, toutes les barres sont à `BASE_HEIGHT` (petites, égales = aucun son).
 */
const PEAK_HEIGHTS = [10, 12, 9, 12, 16, 9];
const BASE_HEIGHT = 4;

/** Durée minimale de l'onde (ms) — laisse le temps à une montée/descente douce. */
export const SOUND_WAVE_MIN_DURATION = 1100;

type SoundWaveProps = {
  /** Durée de l'animation (montée → descente), en ms. */
  durationMs?: number;
};

/**
 * Icône « son » animée, jouée une fois à chaque montage (le parent force un
 * remontage via `key` pour la rejouer).
 * État initial = barres petites et égales (aucun son). Au clic, la hauteur de
 * chaque barre monte jusqu'à son pic puis revient à l'état initial (on anime la
 * hauteur, pas un scaleY, pour garder des extrémités arrondies nettes).
 */
export default function SoundWave({ durationMs = SOUND_WAVE_MIN_DURATION }: SoundWaveProps) {
  return (
    <div className="sw" aria-hidden="true" style={{ animationDuration: `${durationMs}ms` }}>
      <style>{styles}</style>
      {PEAK_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="sw-bar"
          style={
            {
              ['--peak']: `${h}px`,
              animationDuration: `${durationMs}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

const styles = `
.sw {
  position: absolute;
  top: 23px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1px;
  /* La durée vient du style inline. */
  animation-name: sw-fade;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

.sw-bar {
  width: 2px;
  height: ${BASE_HEIGHT}px; /* base : petite, identique pour toutes (= aucun son) */
  border-radius: 60px;
  background: var(--color-surface-strong);
  animation-name: sw-rise;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

/* Conteneur : fondu d'apparition puis de disparition. */
@keyframes sw-fade {
  0%   { opacity: 0; }
  12%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { opacity: 0; }
}

/* Barre : part de l'état initial, monte jusqu'à son pic, revient à l'initial. */
@keyframes sw-rise {
  0%   { height: ${BASE_HEIGHT}px; }
  45%  { height: var(--peak); }
  90%  { height: ${BASE_HEIGHT}px; }
  100% { height: ${BASE_HEIGHT}px; }
}

@media (prefers-reduced-motion: reduce) {
  .sw-bar { animation: none; }
}
`;
