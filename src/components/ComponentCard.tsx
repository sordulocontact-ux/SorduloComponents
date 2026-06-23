import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Platform } from '../showcase/registry';
import SoundWave, { SOUND_WAVE_MIN_DURATION } from './SoundWave';
import SplitText from './SplitText';
import ExitSlide from './ExitSlide';
import { Link } from '../router';
import { playSound, preloadSound } from '../lib/sound';
import { setOrigin } from '../lib/sharedTransition';
import { EASE_IN, PREVIEW_FALL_MS, PREVIEW_STAGGER_MS, TEXT_DELAY_MS } from '../lib/motion';

type ComponentCardProps = {
  /** Identifiant du composant (passé à l'orchestration de sortie). */
  id: string;
  name: string;
  description: string;
  platforms?: Platform[];
  /** Sound design : URL du fichier audio. Présent → interaction = son + icône animée. */
  sound?: string;
  /** Lien vers la page de détail (toute la carte est cliquable). */
  href: string;
  children: ReactNode;
  /** Rang de la carte dans la grille (décalage de la chute à la sortie). */
  index: number;
  /** L'accueil joue son animation de sortie. */
  exiting: boolean;
  /** Cette carte est celle qui a été cliquée (son titre disparaît lettre par lettre). */
  active: boolean;
  /** Déclenche la sortie orchestrée puis la navigation (gérée par l'accueil). */
  onActivate: (id: string, href: string) => void;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  react: 'React',
  swift: 'Swift',
};

/** Petites pastilles indiquant les plateformes disponibles (React / Swift). */
function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((p) => (
        <span
          key={p}
          className="rounded-pill bg-surface px-2 py-0.5 text-caption text-subtle"
        >
          {PLATFORM_LABEL[p]}
        </span>
      ))}
    </div>
  );
}

export default function ComponentCard({
  id,
  name,
  description,
  platforms,
  sound,
  href,
  children,
  index,
  exiting,
  active,
  onActivate,
}: ComponentCardProps) {
  // `wave` pilote l'onde : `key` la rejoue à chaque interaction, `duration` la cale sur le son.
  const [wave, setWave] = useState<{ key: number; duration: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Boîte de l'aperçu : son rectangle est l'origine du FLIP vers la page de détail.
  const previewRef = useRef<HTMLDivElement>(null);

  // Précharge le son dès que la carte est montée.
  useEffect(() => {
    if (sound) preloadSound(sound);
  }, [sound]);

  // Clic sur le contrôle lui-même : on l'actionne (et on joue le son + l'onde),
  // sans naviguer. preventDefault stoppe le lien ; tout le reste de la carte navigue.
  const onInteract = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sound) return;

    // Au moins SOUND_WAVE_MIN_DURATION pour une montée/descente douce.
    const duration = Math.max(playSound(sound), SOUND_WAVE_MIN_DURATION);
    setWave((w) => ({ key: (w?.key ?? 0) + 1, duration }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setWave(null), duration);
  };

  // Clic ailleurs que sur le contrôle → on mémorise l'origine du FLIP, puis on diffère
  // la navigation pour jouer la sortie.
  const onCardClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return; // interaction avec le contrôle → pas de navigation
    e.preventDefault();
    if (previewRef.current) setOrigin(id, previewRef.current.getBoundingClientRect());
    onActivate(id, href);
  };

  // La carte cliquée reste en place (origine du vol) ; seules les autres tombent.
  const falling = exiting && !active;

  // Chute de l'aperçu à la sortie : il glisse vers le bas (translateY) + rotation
  // alternée et se fait rogner par le masque parent — aucune opacité. Décalée par
  // rang de carte. Rotation légère et variée pour un effet organique.
  const rot = (index % 2 === 0 ? -1 : 1) * (5 + (index % 3) * 2);
  const previewExitStyle: CSSProperties | undefined = falling
    ? {
        transform: `translateY(110%) rotate(${rot}deg)`,
        transition: `transform ${PREVIEW_FALL_MS}ms ${EASE_IN}`,
        transitionDelay: `${index * PREVIEW_STAGGER_MS}ms`,
      }
    : undefined;

  return (
    <Link to={href} onClick={onCardClick} className="group flex flex-col gap-[11px]">
      {/* Masque : seules les cartes non cliquées glissent dessous et se font rogner. */}
      <div
        className="rounded-card"
        style={falling ? { overflow: 'hidden' } : undefined}
      >
        <div
          ref={previewRef}
          style={previewExitStyle}
          className="relative flex h-[281px] w-full items-center justify-center overflow-hidden rounded-card bg-surface ring-0 ring-border transition-all group-hover:ring-1"
        >
          {wave && <SoundWave key={wave.key} durationMs={wave.duration} />}
          {/* Seul le contrôle capte le clic (interaction + son) ; la carte navigue. */}
          <div onClick={onInteract} className="inline-flex">
            {children}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {/* Titre toujours découpé en lettres (monté visible) pour pouvoir transitionner.
            Carte cliquée → disparition lettre par lettre ; sinon → glissement en bloc
            (via ExitSlide). La structure reste identique pour éviter tout remontage. */}
        <ExitSlide exiting={exiting && !active} delay={TEXT_DELAY_MS}>
          <SplitText
            text={name}
            show={!(exiting && active)}
            delay={TEXT_DELAY_MS}
            className="text-label text-foreground"
          />
        </ExitSlide>
        <ExitSlide exiting={exiting} className="text-label text-subtle">
          {description}
        </ExitSlide>
        {platforms && platforms.length > 0 && (
          <ExitSlide exiting={exiting} className="mt-1">
            <PlatformBadges platforms={platforms} />
          </ExitSlide>
        )}
      </div>
    </Link>
  );
}
