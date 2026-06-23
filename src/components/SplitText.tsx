import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from 'react';
import {
  EASE_IN,
  EASE_OUT,
  LETTER_DURATION_MS,
  LETTER_STAGGER_MS,
  prefersReducedMotion,
} from '../lib/motion';

type SplitTextProps = {
  text: string;
  /** État cible : `true` = lettres visibles. Le passage à cet état joue l'animation. */
  show: boolean;
  className?: string;
  /** Style appliqué au conteneur. */
  style?: CSSProperties;
  /** Élément du conteneur (ex. `'h1'` pour préserver la sémantique de titre). */
  as?: ElementType;
  /** Délai avant la 1re lettre (ms) — ex. attendre la chute des aperçus. */
  delay?: number;
  /** Décalage entre deux lettres (ms). */
  stagger?: number;
  /** Durée de transition d'une lettre (ms). */
  duration?: number;
};

/**
 * Affiche un texte lettre par lettre, sans opacité : chaque lettre glisse
 * verticalement et se fait rogner par un masque (overflow hidden) — on la « voit »
 * apparaître/disparaître plutôt que fondre.
 *
 * Le masque est posé par mot (chaque mot reste insécable, sur une seule ligne) :
 * cela préserve le retour à la ligne naturel et garde le rognage correct sur les
 * titres multi-lignes. Le masque n'est actif que pendant l'animation (ou tant que le
 * texte est caché) ; au repos visible, l'overflow est libéré pour ne pas rogner les
 * jambages des lettres (j, g, p…), d'autant que les interlignes sont serrés.
 *
 * Accessibilité : le texte complet via `aria-label`, les lettres sont `aria-hidden`.
 */
export default function SplitText({
  text,
  show,
  className,
  style,
  as: Tag = 'span',
  delay = 0,
  stagger = LETTER_STAGGER_MS,
  duration = LETTER_DURATION_MS,
}: SplitTextProps) {
  const reduce = prefersReducedMotion();
  const words = text.split(' ');
  const letterCount = Array.from(text).filter((c) => c !== ' ').length;
  const total = delay + letterCount * stagger + duration;

  // Fenêtre d'animation : on rogne pendant la transition, puis on libère l'overflow
  // une fois les lettres en place (repos visible) pour ne pas couper les jambages.
  // On ne déclenche que sur un vrai changement de `show` (pas au montage initial,
  // sinon le titre déjà visible serait rogné pour rien au chargement).
  const [animating, setAnimating] = useState(false);
  const prevShow = useRef(show);
  useEffect(() => {
    if (reduce || prevShow.current === show) return;
    prevShow.current = show;
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), total);
    return () => clearTimeout(t);
  }, [show, reduce, total]);

  const clip = !reduce && (!show || animating);

  let i = 0; // index continu des lettres (les espaces ne comptent pas)
  const letterStyle = (index: number): CSSProperties => ({
    display: 'inline-block',
    // 150% pour dégager complètement la boîte rognée (élargie par la marge interne).
    transform: show ? 'translateY(0)' : 'translateY(150%)',
    // Apparition (montée) en sortie douce ; disparition (descente) en accélération.
    transition: reduce ? undefined : `transform ${duration}ms ${show ? EASE_OUT : EASE_IN}`,
    transitionDelay: reduce ? undefined : `${delay + index * stagger}ms`,
    willChange: 'transform',
  });

  return (
    <Tag className={className} style={style} aria-label={text}>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: clip ? 'hidden' : undefined,
              verticalAlign: 'top',
              // Marge interne verticale (compensée par une marge négative → aucun
              // décalage de mise en page) : la boîte rognée garde de la place pour les
              // hampes/jambages (g, j, p…), sinon coupés à cause des interlignes serrés.
              paddingTop: '0.22em',
              paddingBottom: '0.22em',
              marginTop: '-0.22em',
              marginBottom: '-0.22em',
            }}
          >
            {Array.from(word).map((ch) => {
              const index = i++;
              return (
                <span key={index} aria-hidden="true" style={letterStyle(index)}>
                  {ch}
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
