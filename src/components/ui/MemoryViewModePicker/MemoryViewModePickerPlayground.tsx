import { useRef, useState } from 'react';
import MemoryViewModePicker, { DEFAULT_GLASS, type GlassParams } from './MemoryViewModePicker';
import { useDetailTransition } from '../../../lib/detailTransition';
import { useGlassEnabled } from '../../../lib/settings';

/**
 * Pad 2D pour déplacer l'ombre : on glisse le point dans la zone, le centre = (0,0),
 * les bords = ±range px. Met à jour les décalages X (horizontal) et Y (vertical).
 */
function ShadowPad({
  x,
  y,
  range,
  onChange,
}: {
  x: number;
  y: number;
  range: number;
  onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFrom = (clientX: number, clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (clientX - r.left) / r.width; // 0..1
    const py = (clientY - r.top) / r.height;
    const nx = Math.round(Math.min(Math.max(px * 2 - 1, -1), 1) * range);
    const ny = Math.round(Math.min(Math.max(py * 2 - 1, -1), 1) * range);
    onChange(nx, ny);
  };

  // Position du point en % (centre = 50 %).
  const left = ((x / range) * 0.5 + 0.5) * 100;
  const top = ((y / range) * 0.5 + 0.5) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-caption text-subtle">
        <span>Position</span>
        <span className="tabular-nums text-foreground">
          {x}, {y}px
        </span>
      </span>
      <div
        ref={ref}
        className="relative h-28 w-full cursor-crosshair touch-none rounded-card border border-border bg-surface"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFrom(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFrom(e.clientX, e.clientY);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* Repères : croix centrale */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-border" />
        {/* Point déplaçable */}
        <div
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-brand shadow"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      </div>
    </div>
  );
}

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
/** Titre de section de réglages. */
function Section({ title }: { title: string }) {
  return (
    <h3 className="mt-2 border-t border-border pt-4 text-caption font-semibold uppercase tracking-wide text-foreground">
      {title}
    </h3>
  );
}

/** Ligne « libellé + sélecteur de couleur ». */
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-caption text-subtle">{label}</span>
      <span className="mvmp-swatch">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <span className="mvmp-swatch-hex">{value.toUpperCase()}</span>
      </span>
    </label>
  );
}

/** Style du sélecteur de couleur (swatch arrondi + valeur hex). Injecté une fois. */
const colorPickerCss = `
.mvmp-swatch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px 3px 3px;
  border-radius: 9999px;
  border: 1px solid var(--color-border, rgba(0, 8, 46, 0.12));
  background: #fff;
  transition: border-color 0.15s ease;
}
.mvmp-swatch:focus-within { border-color: var(--color-brand, #00082e); }
.mvmp-swatch input[type='color'] {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: none;
  cursor: pointer;
}
.mvmp-swatch input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
.mvmp-swatch input[type='color']::-webkit-color-swatch {
  border: 1px solid rgba(0, 8, 46, 0.18);
  border-radius: 9999px;
}
.mvmp-swatch input[type='color']::-moz-color-swatch {
  border: 1px solid rgba(0, 8, 46, 0.18);
  border-radius: 9999px;
}
.mvmp-swatch-hex {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
  color: var(--color-foreground, #000);
}
`;

// Jeux de réglages indépendants par mode. Seule la couleur du bouton est partagée.
const GLASS_DEFAULTS: GlassParams = { ...DEFAULT_GLASS, trackOpacity: 0.12 };
const PLAIN_DEFAULTS: GlassParams = { ...DEFAULT_GLASS, trackOpacity: 1 };

export default function MemoryViewModePickerPlayground() {
  // Réglages propres au verre masqués quand le glass est désactivé (toggle du header).
  const glassEnabled = useGlassEnabled();

  // Deux jeux de paramètres distincts (glass / plein), + une couleur de bouton commune.
  const [glassParams, setGlassParams] = useState<GlassParams>(GLASS_DEFAULTS);
  const [plainParams, setPlainParams] = useState<GlassParams>(PLAIN_DEFAULTS);
  const [indicatorColor, setIndicatorColor] = useState(DEFAULT_GLASS.indicatorColor);

  const active = glassEnabled ? glassParams : plainParams;
  const setActive = glassEnabled ? setGlassParams : setPlainParams;
  const params: GlassParams = { ...active, indicatorColor };

  const set = <K extends keyof GlassParams>(key: K, value: GlassParams[K]) => {
    if (key === 'indicatorColor') setIndicatorColor(value as string);
    else setActive((p) => ({ ...p, [key]: value }));
  };
  const reset = () => setActive(glassEnabled ? GLASS_DEFAULTS : PLAIN_DEFAULTS);

  // Transition d'entrée : la boîte d'aperçu est le « composant » qui vole/zoome
  // (heroRef) ; les réglages apparaissent en simple opacité (controlsStyle).
  const { heroRef, controlsStyle } = useDetailTransition();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <style>{colorPickerCss}</style>
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
          <h2 className="text-label text-foreground">Réglages</h2>
          <button
            type="button"
            onClick={reset}
            className="rounded-pill bg-surface px-3 py-1 text-caption text-subtle transition-colors hover:bg-surface-strong"
          >
            Réinitialiser
          </button>
        </div>

        {/* Bouton */}
        <Section title="Bouton" />
        <ColorRow
          label="Couleur"
          value={params.indicatorColor}
          onChange={(v) => set('indicatorColor', v)}
        />

        {/* Composant */}
        <Section title="Composant" />
        <ColorRow label="Couleur" value={params.trackColor} onChange={(v) => set('trackColor', v)} />
        <Slider
          label="Opacité"
          value={Math.round(params.trackOpacity * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => set('trackOpacity', v / 100)}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Contour"
          value={params.borderWidth}
          min={0}
          max={8}
          step={0.5}
          onChange={(v) => set('borderWidth', v)}
          format={(v) => (v === 0 ? 'aucun' : `${v}px`)}
        />
        {params.borderWidth > 0 && (
          <ColorRow
            label="Couleur du contour"
            value={params.borderColor}
            onChange={(v) => set('borderColor', v)}
          />
        )}

        {/* Ombre */}
        <Section title="Ombre" />
        <Slider
          label="Opacité"
          value={Math.round(params.shadowOpacity * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => set('shadowOpacity', v / 100)}
          format={(v) => `${v}%`}
        />
        {params.shadowOpacity > 0 && (
          <>
            <ShadowPad
              x={params.shadowX}
              y={params.shadowY}
              range={40}
              onChange={(x, y) => setActive((p) => ({ ...p, shadowX: x, shadowY: y }))}
            />
            <Slider
              label="Flou"
              value={params.shadowBlur}
              min={0}
              max={60}
              step={1}
              onChange={(v) => set('shadowBlur', v)}
              format={(v) => `${v}px`}
            />
            <ColorRow
              label="Couleur"
              value={params.shadowColor}
              onChange={(v) => set('shadowColor', v)}
            />
          </>
        )}

        {/* Verre (uniquement quand le glass est activé) */}
        {glassEnabled && (
          <>
            <Section title="Verre" />
            <Slider
              label="Réfraction"
              value={params.scale}
              min={-300}
              max={0}
              step={5}
              onChange={(v) => set('scale', v)}
            />
            <Slider
              label="Flou"
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
              label="Voile"
              value={Math.round(params.frost * 100)}
              min={0}
              max={60}
              step={1}
              onChange={(v) => set('frost', v / 100)}
              format={(v) => `${v}%`}
            />
            <Slider
              label="Aberration verte"
              value={params.aberration[1]}
              min={0}
              max={40}
              step={1}
              onChange={(v) =>
                set('aberration', [params.aberration[0], v, params.aberration[2]])
              }
            />
            <Slider
              label="Aberration bleue"
              value={params.aberration[2]}
              min={0}
              max={60}
              step={1}
              onChange={(v) =>
                set('aberration', [params.aberration[0], params.aberration[1], v])
              }
            />
            <Slider
              label="Rayon"
              value={params.borderRadius}
              min={4}
              max={999}
              step={1}
              onChange={(v) => set('borderRadius', v)}
              format={(v) => `${v}px`}
            />
            <Slider
              label="Opacité du bouton"
              value={Math.round(params.indicatorOpacity * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(v) => set('indicatorOpacity', v / 100)}
              format={(v) => `${v}%`}
            />
          </>
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
