import type { CSSProperties, ReactNode } from 'react';
import { EASE_IN, LETTER_DURATION_MS, TEXT_DELAY_MS } from '../lib/motion';

type ExitSlideProps = {
  /** Quand `true`, le contenu glisse vers le bas et se fait rogner. */
  exiting: boolean;
  /** Délai avant le départ du glissement (ms). */
  delay?: number;
  className?: string;
  children: ReactNode;
};

/**
 * Bloc qui, à la sortie, glisse vers le bas et disparaît par rognage (overflow
 * hidden) — sans opacité. Utilisé pour les textes secondaires (description, badges,
 * sous-titre, titres non cliqués) qui ne s'animent pas lettre par lettre.
 *
 * Au repos l'overflow est libre (aucun rognage) ; il ne se ferme qu'à la sortie.
 */
export default function ExitSlide({
  exiting,
  delay = TEXT_DELAY_MS,
  className,
  children,
}: ExitSlideProps) {
  const outer: CSSProperties | undefined = exiting ? { overflow: 'hidden' } : undefined;
  const inner: CSSProperties = {
    transition: `transform ${LETTER_DURATION_MS}ms ${EASE_IN} ${delay}ms`,
    transform: exiting ? 'translateY(110%)' : undefined,
  };
  return (
    <div className={className} style={outer}>
      <div style={inner}>{children}</div>
    </div>
  );
}
