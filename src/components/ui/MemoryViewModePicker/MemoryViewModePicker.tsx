import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createLiquidGlass, type LiquidGlassInstance } from '../../../lib/liquid-glass';
import { useGlassEnabled } from '../../../lib/settings';
import { playSound, preloadSound } from '../../../lib/sound';
// Même son que le Toggle (clic).
import tapSound from '../Toggle/tap-sound.mp3';

/** Convertit un hex (#rrggbb) + opacité en chaîne `rgba(...)`. */
function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) || 0;
  const g = parseInt(m.slice(2, 4), 16) || 0;
  const b = parseInt(m.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Deux modes de visualisation du feed de souvenirs : liste (`list`) ou carte (`map`).
 * Pendant React de `MemoryViewMode` (SwiftUI).
 */
export type MemoryViewMode = 'list' | 'map';

const MODES: { id: MemoryViewMode; title: string }[] = [
  { id: 'list', title: 'Texte1' },
  { id: 'map', title: 'Texte2' },
];

/** Paramètres de glassmorphisme réglables (pilotés par la page de détail). */
export type GlassParams = {
  /** Force de réfraction (négatif = vers l'intérieur). */
  scale: number;
  /** Adoucissement de la displacement map (transition au bord). */
  blur: number;
  /** **Vrai** flou du fond réfracté (frosted glass) — feGaussianBlur post-déplacement. */
  frostBlur: number;
  /** Saturation du fond réfracté. */
  saturation: number;
  /** Voile sombre (0 = verre clair). */
  frost: number;
  /** Aberration chromatique [r, g, b]. */
  aberration: [number, number, number];
  /** Rayon des coins du verre. */
  borderRadius: number;
  /** Couleur du fond du composant (track). */
  trackColor: string;
  /** Opacité du fond du composant. */
  trackOpacity: number;
  /** Épaisseur du contour en px (0 = aucun contour). */
  borderWidth: number;
  /** Couleur du contour. */
  borderColor: string;
  /** Drop shadow — décalage horizontal (px). */
  shadowX: number;
  /** Drop shadow — décalage vertical (px). */
  shadowY: number;
  /** Drop shadow — flou (px). */
  shadowBlur: number;
  /** Drop shadow — opacité (0 = aucune ombre). */
  shadowOpacity: number;
  /** Drop shadow — couleur. */
  shadowColor: string;
  /** Couleur du bouton de sélection intérieur (hex). */
  indicatorColor: string;
  /** Opacité du bouton de sélection. */
  indicatorOpacity: number;
};

export const DEFAULT_GLASS: GlassParams = {
  scale: -50,
  blur: 11,
  frostBlur: 0.5,
  saturation: 1.3,
  frost: 0,
  aberration: [0, 10, 20],
  borderRadius: 999,
  trackColor: '#ffffff',
  trackOpacity: 0.12,
  borderWidth: 0,
  borderColor: '#ffffff',
  shadowX: 0,
  shadowY: 6,
  shadowBlur: 18,
  shadowOpacity: 0.18,
  shadowColor: '#000000',
  indicatorColor: '#000000',
  indicatorOpacity: 0.32,
};

/**
 * Segmented control « Liste / Carte » — copie conforme de la barre d'onglets iOS 26
 * (Liquid Glass), portée en HTML/React :
 *
 * - **bulle de verre** translucide teintée qui glisse derrière les libellés (texte posé
 *   par-dessus → on voit le verre derrière le texte) ;
 * - **grab** : au pointer-down, la bulle s'agrandit (lift) ;
 * - **drag** : la bulle suit le doigt en continu, l'onglet bascule au passage du milieu ;
 * - **release / tap** : elle se cale avec un rebond (spring) et un squash « jelly ».
 *
 * Un seul jeu de Pointer Events orchestre grab + drag + tap (réponse dès le touch-down).
 * En `prefers-reduced-motion`, pas d'agrandissement ni de rebond (cf. la feuille de style).
 */
export default function MemoryViewModePicker({
  defaultMode = 'list',
  glass,
}: {
  defaultMode?: MemoryViewMode;
  /** Surcharge des paramètres de glassmorphisme (sinon `DEFAULT_GLASS`). */
  glass?: Partial<GlassParams>;
}) {
  const p: GlassParams = { ...DEFAULT_GLASS, ...glass };
  const glassEnabled = useGlassEnabled();

  const [mode, setMode] = useState<MemoryViewMode>(defaultMode);
  /** Offset (px, bord gauche) de la bulle pendant un glissé ; `null` hors glissé → calée. */
  const [dragX, setDragX] = useState<number | null>(null);
  /** `true` tant que le pointeur est posé → bulle agrandie (grab/lift). */
  const [grabbing, setGrabbing] = useState(false);
  /** Compteur de bascule pour rejouer le squash « jelly » à chaque changement d'onglet. */
  const [squashKey, setSquashKey] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const glassInst = useRef<LiquidGlassInstance | null>(null);
  const pointerDown = useRef(false);
  const moved = useRef(false);

  // Réfraction optique réelle (lib rizroze/liquid-glass) sur TOUT le composant : la lib
  // pose un `backdrop-filter: url(#…)` sur le track, qui courbe le vrai fond derrière lui
  // (Chromium ; repli `blur()` sur Safari/Firefox). Comme le track n'est jamais re-monté,
  // l'effet persiste au changement d'onglet. Auto-dimensionné via ResizeObserver.
  useEffect(() => {
    if (!glassEnabled) return; // glassmorphism désactivé (réglage global)
    const el = trackRef.current;
    if (!el) return;
    const inst = createLiquidGlass(el, {
      borderRadius: p.borderRadius,
      scale: p.scale,
      saturation: p.saturation,
      blur: p.blur,
      cssBlur: p.frostBlur,
      frost: p.frost,
      aberration: p.aberration,
    });
    glassInst.current = inst;
    return () => {
      inst.destroy();
      glassInst.current = null;
    };
    // (Re)création à l'activation ; les changements de paramètres passent par l'effet ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glassEnabled]);

  // Applique en live les paramètres modifiés depuis la page de détail.
  useEffect(() => {
    glassInst.current?.update({
      borderRadius: p.borderRadius,
      scale: p.scale,
      saturation: p.saturation,
      blur: p.blur,
      cssBlur: p.frostBlur,
      frost: p.frost,
      aberration: p.aberration,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.borderRadius, p.scale, p.saturation, p.blur, p.frostBlur, p.frost, p.aberration[0], p.aberration[1], p.aberration[2]]);

  // Précharge le son de clic (même fichier que le Toggle).
  useEffect(() => {
    preloadSound(tapSound);
  }, []);

  const segmentWidth = useCallback(() => {
    const w = trackRef.current?.clientWidth ?? 0;
    return w / 2;
  }, []);

  const switchTo = useCallback((target: MemoryViewMode) => {
    setMode((prev) => {
      if (prev !== target) setSquashKey((k) => k + 1);
      return target;
    });
  }, []);

  const localX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(Math.max(clientX - rect.left, 0), rect.width);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerDown.current = true;
    moved.current = false;
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const seg = segmentWidth();
    if (seg <= 0) return;
    const x = localX(e.clientX);
    // Suit le doigt uniquement au-delà d'un vrai mouvement (sinon : tap immobile).
    if (Math.abs(x - (mode === 'list' ? seg / 2 : seg + seg / 2)) > 2) moved.current = true;
    if (moved.current) {
      setDragX(Math.min(Math.max(x - seg / 2, 0), seg));
      switchTo(x < seg ? 'list' : 'map');
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    pointerDown.current = false;
    const seg = segmentWidth();
    switchTo(localX(e.clientX) < seg ? 'list' : 'map');
    setDragX(null); // se cale (bounce)
    setGrabbing(false);
    // Son de clic au relâché (souris/tactile) — pas sur un pointercancel.
    if (e.type === 'pointerup') playSound(tapSound);
  };

  // Recale la bulle si la largeur change (resize) — rien à stocker, le rendu suit `mode`.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => setDragX((d) => (d == null ? null : d)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pillTranslate = dragX != null ? `${dragX}px` : mode === 'list' ? '0%' : '100%';

  return (
    <div className="mvmp-root">
      <style>{styles}</style>
      {/* Stage : image de fond pour rendre visible le flou « glass » de la bulle.
          Retirée quand le glass est désactivé (plus rien à réfracter). */}
      <div className="mvmp-stage" data-glass={glassEnabled}>
        <div
          ref={trackRef}
          className="mvmp-track"
          data-glass={glassEnabled}
          style={{
            width: 232,
            background: hexToRgba(p.trackColor, p.trackOpacity),
            border: p.borderWidth > 0 ? `${p.borderWidth}px solid ${hexToRgba(p.borderColor, 1)}` : undefined,
            boxShadow:
              p.shadowOpacity > 0
                ? `${p.shadowX}px ${p.shadowY}px ${p.shadowBlur}px ${hexToRgba(p.shadowColor, p.shadowOpacity)}`
                : 'none',
          }}
          role="tablist"
          aria-label="Mode de visualisation"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {/* Indicateur de sélection (zone plus foncée, façon navbar iOS) :
              positioner (translate) > scaler (grab) > squash (jelly). */}
          <div
            className="mvmp-pill-positioner"
            data-dragging={dragX != null}
            style={{ transform: `translateX(${pillTranslate})` }}
          >
            <div className="mvmp-pill-scaler" data-grab={grabbing}>
              <div key={squashKey} className="mvmp-pill-squash">
                <div
                  className="mvmp-pill-indicator"
                  style={{
                    // Glass on : couleur + opacité réglables. Glass off : couleur opaque
                    // (look plein classique, noir par défaut, modifiable via le color picker).
                    background: glassEnabled
                      ? hexToRgba(p.indicatorColor, p.indicatorOpacity)
                      : hexToRgba(p.indicatorColor, 1),
                  }}
                />
              </div>
            </div>
          </div>

          {MODES.map((m) => {
            const selected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className="mvmp-tab"
                data-selected={selected}
                onClick={(e) => {
                  // Activation clavier (detail === 0) : le pointeur ne passe pas par
                  // endPointer, on joue donc le son ici (évite le double son à la souris).
                  if (e.detail === 0) playSound(tapSound);
                  switchTo(m.id);
                }}
              >
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = `
.mvmp-root {
  font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif);
  /* Texte non sélectionnable : évite le surlignage qui « collisionne » avec le fond. */
  user-select: none;
  -webkit-user-select: none;
}

/* Stage : image de fond (avec dégradé de repli) → le flou de la bulle devient visible. */
.mvmp-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border-radius: 20px;
  background-color: #6d5bd0;
  background-image:
    linear-gradient(135deg, rgba(109, 91, 208, 0.35), rgba(34, 197, 194, 0.35)),
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640&q=80');
  background-size: cover;
  background-position: center;
}

/* Glass off → pas d'image de fond (le composant repose sur la surface de la page). */
.mvmp-stage[data-glass='false'] {
  background: none;
}

/* Fond, contour et ombre du track sont pilotés en inline (paramètres trackColor/Opacity,
   borderWidth/Color, shadow*). Ici : forme et comportement. */
.mvmp-track {
  position: relative;
  display: flex;
  padding: 4px;
  border-radius: 9999px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* Glassmorphism désactivé : texte foncé non sélectionné / blanc sur la sélection. */
.mvmp-track[data-glass='false'] .mvmp-tab {
  color: rgba(0, 8, 46, 0.55);
  text-shadow: none;
}
.mvmp-track[data-glass='false'] .mvmp-tab[data-selected='true'] {
  color: #ffffff;
}

/* --- Bulle de verre, en 3 couches pour des timings indépendants --- */
.mvmp-pill-positioner {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  transition: transform 0.34s cubic-bezier(0.34, 1.45, 0.64, 1); /* settle (overshoot léger) */
}
.mvmp-pill-positioner[data-dragging='true'] { transition: none; } /* suit le doigt */

.mvmp-pill-scaler {
  width: 100%;
  height: 100%;
  transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1); /* grab */
}
.mvmp-pill-scaler[data-grab='true'] { transform: scale(1.07); }

.mvmp-pill-squash {
  width: 100%;
  height: 100%;
  animation: mvmp-squash 0.45s cubic-bezier(0.34, 1.45, 0.64, 1) both;
  transform-origin: center;
}

/* Indicateur de sélection : zone simplement plus foncée sur le verre (navbar iOS). */
.mvmp-pill-indicator {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.15);
}

@keyframes mvmp-squash {
  0% { transform: scaleX(1.1) scaleY(0.84); }
  100% { transform: scaleX(1) scaleY(1); }
}

/* --- Onglets (libellés posés par-dessus la bulle) --- */
.mvmp-tab {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.35px;
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.mvmp-tab[data-selected='true'] { color: #ffffff; }

@media (prefers-reduced-motion: reduce) {
  .mvmp-pill-positioner { transition: transform 0.2s ease-in-out; }
  .mvmp-pill-scaler { transition: transform 0.12s ease-in-out; }
  .mvmp-pill-scaler[data-grab='true'] { transform: none; }
  .mvmp-pill-squash { animation: none; }
}
`;
