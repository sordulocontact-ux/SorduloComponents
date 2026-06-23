import type { ReactNode } from 'react';
import type { Platform } from '../showcase/registry';

type ComponentCardProps = {
  name: string;
  description: string;
  platforms?: Platform[];
  children: ReactNode;
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

/** Petite décoration « waveform » en haut de la zone d'aperçu */
function Waveform() {
  const bars = [10, 12, 9, 12, 16, 9];
  return (
    <div className="absolute left-1/2 top-[23px] flex -translate-x-1/2 items-center gap-px">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-pill bg-surface-strong"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export default function ComponentCard({
  name,
  description,
  platforms,
  children,
}: ComponentCardProps) {
  return (
    <div className="flex flex-col gap-[11px]">
      <div className="relative flex h-[281px] w-full items-center justify-center overflow-hidden rounded-card bg-surface">
        <Waveform />
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-label text-foreground">{name}</p>
        <p className="text-label text-subtle">{description}</p>
        {platforms && platforms.length > 0 && (
          <div className="mt-1">
            <PlatformBadges platforms={platforms} />
          </div>
        )}
      </div>
    </div>
  );
}
