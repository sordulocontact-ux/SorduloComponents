import { useState } from 'react';
import MemoryViewModePicker, { DEFAULT_GLASS, type GlassParams } from './MemoryViewModePicker';
import { useDetailTransition } from '../../../lib/detailTransition';
import { useGlassEnabled } from '../../../lib/settings';

/** Un curseur étiqueté + valeur courante. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-caption text-subtle">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
    </label>
  );
}

/**
 * Bac à sable du `MemoryViewModePicker` : le composant en grand + des curseurs qui
 * pilotent en direct ses paramètres de glassmorphisme (réfraction, flou, saturation,
 * aberration chromatique, voile, opacité de la sélection).
 */
export default function MemoryViewModePickerPlayground() {
  const [params, setParams] = useState<GlassParams>(DEFAULT_GLASS);
  const set = <K extends keyof GlassParams>(key: K, value: GlassParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  // Réglages propres au verre masqués quand le glass est désactivé (toggle du header).
  const glassEnabled = useGlassEnabled();

  // Transition d'entrée : la boîte d'aperçu est le « composant » qui vole/zoome
  // (heroRef) ; les réglages apparaissent en simple opacité (controlsStyle).
  const { heroRef, controlsStyle } = useDetailTransition();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      {/* Aperçu interactif — cible du FLIP (vol/zoom depuis la carte). */}
      <div
        ref={heroRef}
        className="flex min-h-[320px] items-center justify-center rounded-card bg-surface p-6"
      >
        <MemoryViewModePicker glass={params} />
      </div>

      {/* Réglages — apparition en opacité. */}
      <div
        style={controlsStyle}
        className="flex flex-col gap-5 rounded-card border border-border bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-label text-foreground">
            {glassEnabled ? 'Glassmorphisme' : 'Réglages'}
          </h2>
          <button
            type="button"
            onClick={() => setParams(DEFAULT_GLASS)}
            className="rounded-pill bg-surface px-3 py-1 text-caption text-subtle transition-colors hover:bg-surface-strong"
          >
            Réinitialiser
          </button>
        </div>

        {glassEnabled && (
          <>
        <Slider
          label="Réfraction (scale)"
          value={params.scale}
          min={-300}
          max={0}
          step={5}
          onChange={(v) => set('scale', v)}
        />
        <Slider
          label="Flou (frost)"
          value={params.frostBlur}
          min={0}
          max={16}
          step={0.5}
          onChange={(v) => set('frostBlur', v)}
          format={(v) => `${v}px`}
        />
        <Slider
          label="Saturation"
          value={params.saturation}
          min={0.5}
          max={2}
          step={0.05}
          onChange={(v) => set('saturation', v)}
          format={(v) => `${v.toFixed(2)}×`}
        />
        <Slider
          label="Voile sombre (frost)"
          value={params.frost}
          min={0}
          max={0.6}
          step={0.02}
          onChange={(v) => set('frost', v)}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Aberration verte"
          value={params.aberration[1]}
          min={0}
          max={40}
          step={1}
          onChange={(v) => set('aberration', [params.aberration[0], v, params.aberration[2]])}
        />
        <Slider
          label="Aberration bleue"
          value={params.aberration[2]}
          min={0}
          max={60}
          step={1}
          onChange={(v) => set('aberration', [params.aberration[0], params.aberration[1], v])}
        />
        <Slider
          label="Rayon des coins"
          value={params.borderRadius}
          min={4}
          max={999}
          step={1}
          onChange={(v) => set('borderRadius', v)}
          format={(v) => `${v}px`}
        />
        <Slider
          label="Opacité sélection"
          value={params.indicatorOpacity}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => set('indicatorOpacity', v)}
          format={(v) => v.toFixed(2)}
        />
          </>
        )}

        <label className="flex items-center justify-between gap-3">
          <span className="text-caption text-subtle">Couleur du bouton</span>
          <input
            type="color"
            value={params.indicatorColor}
            onChange={(e) => set('indicatorColor', e.target.value)}
            className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent"
            aria-label="Couleur du bouton de sélection"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-caption text-subtle">Couleur du composant</span>
          <input
            type="color"
            value={params.trackColor}
            onChange={(e) => set('trackColor', e.target.value)}
            className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent"
            aria-label="Couleur du fond du composant"
          />
        </label>

        <Slider
          label="Opacité composant"
          value={params.trackOpacity}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => set('trackOpacity', v)}
          format={(v) => v.toFixed(2)}
        />

        <Slider
          label="Contour (épaisseur)"
          value={params.borderWidth}
          min={0}
          max={8}
          step={0.5}
          onChange={(v) => set('borderWidth', v)}
          format={(v) => (v === 0 ? 'aucun' : `${v}px`)}
        />

        {params.borderWidth > 0 && (
          <label className="flex items-center justify-between gap-3">
            <span className="text-caption text-subtle">Couleur du contour</span>
            <input
              type="color"
              value={params.borderColor}
              onChange={(e) => set('borderColor', e.target.value)}
              className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent"
              aria-label="Couleur du contour"
            />
          </label>
        )}

        {glassEnabled ? (
          <p className="text-caption text-subtle">
            La réfraction complète s'affiche sur Chromium. Sur Safari/Firefox, repli sur un
            flou simple.
          </p>
        ) : (
          <p className="text-caption text-subtle">
            Glassmorphisme désactivé — réactive-le dans l'en-tête pour les réglages de verre.
          </p>
        )}
      </div>
    </div>
  );
}
