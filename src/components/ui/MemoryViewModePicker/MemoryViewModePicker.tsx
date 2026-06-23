import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Deux modes de visualisation du feed de souvenirs : liste (`list`) ou carte (`map`).
 * Pendant React de `MemoryViewMode` (SwiftUI).
 */
export type MemoryViewMode = 'list' | 'map';

const MODES: { id: MemoryViewMode; title: string }[] = [
  { id: 'list', title: 'Texte1' },
  { id: 'map', title: 'Texte2' },
];

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
}: {
  defaultMode?: MemoryViewMode;
}) {
  const [mode, setMode] = useState<MemoryViewMode>(defaultMode);
  /** Offset (px, bord gauche) de la bulle pendant un glissé ; `null` hors glissé → calée. */
  const [dragX, setDragX] = useState<number | null>(null);
  /** `true` tant que le pointeur est posé → bulle agrandie (grab/lift). */
  const [grabbing, setGrabbing] = useState(false);
  /** Compteur de bascule pour rejouer le squash « jelly » à chaque changement d'onglet. */
  const [squashKey, setSquashKey] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const pointerDown = useRef(false);
  const moved = useRef(false);

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
      {/* Stage : image de fond pour rendre visible le flou « glass » de la bulle. */}
      <div className="mvmp-stage">
        <div
          ref={trackRef}
          className="mvmp-track"
          style={{ width: 232 }}
          role="tablist"
          aria-label="Mode de visualisation"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {/* Bulle de verre : positioner (translate) > scaler (grab) > squash (jelly) */}
          <div
            className="mvmp-pill-positioner"
            data-dragging={dragX != null}
            style={{ transform: `translateX(${pillTranslate})` }}
          >
            <div className="mvmp-pill-scaler" data-grab={grabbing}>
              <div key={squashKey} className="mvmp-pill-squash">
                <div className="mvmp-pill-glass" />
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
                onClick={() => switchTo(m.id)}
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
.mvmp-root { font-family: var(--font-sans, 'DM Sans', system-ui, sans-serif); }

/* Stage : image de fond (avec dégradé de repli) → le flou de la bulle devient visible. */
.mvmp-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border-radius: 20px;
  overflow: hidden;
  background-color: #6d5bd0;
  background-image:
    linear-gradient(135deg, rgba(109, 91, 208, 0.35), rgba(34, 197, 194, 0.35)),
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640&q=80');
  background-size: cover;
  background-position: center;
}

.mvmp-track {
  position: relative;
  display: flex;
  padding: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.14);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28), 0 6px 18px rgba(0, 0, 0, 0.18);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
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

.mvmp-pill-glass {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  backdrop-filter: blur(12px) saturate(1.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 0 0.5px rgba(255, 255, 255, 0.12);
}

@keyframes mvmp-squash {
  0% { transform: scaleX(1.1) scaleY(0.84); }
  100% { transform: scaleX(1) scaleY(1); }
}

/* --- Onglets (labels posés par-dessus la bulle) --- */
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
.mvmp-tab svg { flex: none; }

@media (prefers-reduced-motion: reduce) {
  .mvmp-pill-positioner { transition: transform 0.2s ease-in-out; }
  .mvmp-pill-scaler { transition: transform 0.12s ease-in-out; }
  .mvmp-pill-scaler[data-grab='true'] { transform: none; }
  .mvmp-pill-squash { animation: none; }
}
`;
