import { useRef, useState } from 'react';
import ComponentCard from '../components/ComponentCard';
import SplitText from '../components/SplitText';
import ExitSlide from '../components/ExitSlide';
import { components } from '../showcase/registry';
import { navigate } from '../router';
import { TEXT_DELAY_MS, exitDurationMs, prefersReducedMotion } from '../lib/motion';

const PAGE_TITLE = 'Sordulo components';

export default function Home() {
  // Carte cliquée en cours de sortie (`null` = état normal). Pilote toute l'animation.
  const [exit, setExit] = useState<{ id: string; href: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Au clic sur une carte : on joue la sortie (aperçus qui tombent, puis titres qui
  // disparaissent lettre par lettre), puis on bascule sur la page de détail.
  const onActivate = (id: string, href: string) => {
    if (prefersReducedMotion() || exit) {
      navigate(href);
      return;
    }
    setExit({ id, href });

    const activeName = components.find((c) => c.id === id)?.name ?? '';
    const total = exitDurationMs(Math.max(PAGE_TITLE.length, activeName.length));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(href), total);
  };

  const exiting = exit !== null;

  return (
    <main
      style={exiting ? { pointerEvents: 'none' } : undefined}
      className="mx-auto w-full max-w-[var(--layout-max-width)] px-6 pb-24 pt-16 sm:px-12 sm:pt-[90px]"
    >
      <div className="flex flex-col gap-10">
        <div className="flex max-w-[410px] flex-col gap-2">
          <SplitText
            as="h1"
            text={PAGE_TITLE}
            show={!exiting}
            delay={TEXT_DELAY_MS}
            className="font-display text-display text-foreground"
          />
          <ExitSlide exiting={exiting} className="text-label text-subtle">
            A collection of interface moments, sounds, and principles.
          </ExitSlide>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {components.map((item, index) => (
            <ComponentCard
              key={item.id}
              id={item.id}
              index={index}
              exiting={exiting}
              active={exit?.id === item.id}
              onActivate={onActivate}
              href={`/c/${item.id}`}
              name={item.name}
              description={item.description}
              platforms={item.platforms}
              sound={item.sound}
            >
              {item.preview}
            </ComponentCard>
          ))}
        </div>
      </div>
    </main>
  );
}
