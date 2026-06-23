import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { components, type Platform } from '../showcase/registry';
import { Link } from '../router';
import SplitText from '../components/SplitText';
import {
  EASE_OUT,
  ENTRY_DELAY_MS,
  FADE_MS,
  HERO_FLIP_MS,
  prefersReducedMotion,
} from '../lib/motion';
import { takeOrigin } from '../lib/sharedTransition';
import { DetailTransitionProvider } from '../lib/detailTransition';

const PLATFORM_LABEL: Record<Platform, string> = { react: 'React', swift: 'Swift' };

/**
 * Page de détail d'un composant (même gabarit pour tous) : titre, plateformes,
 * et vue interactive (le `playground` du composant si défini, sinon l'aperçu).
 *
 * Transition d'entrée :
 *  - le composant (boîte d'aperçu) vole/zoome depuis la carte cliquée (FLIP) ;
 *  - les réglages éditables du playground apparaissent en simple opacité ;
 *  - le titre (h1) réapparaît lettre par lettre ;
 *  - le reste (description, badges, Retour) apparaît en opacité.
 */
export default function ComponentDetail({ id }: { id: string }) {
  const item = components.find((c) => c.id === id);

  const reduce = prefersReducedMotion();
  // `entered` pilote les fondus (réglages + reste) ; déclenché juste après le montage.
  const [entered, setEntered] = useState(reduce);
  // Boîte « composant » : cible du FLIP (posée ici en l'absence de playground, ou par
  // le playground via le contexte).
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [id, reduce]);

  // FLIP du composant : il part de la position/taille de la carte et rejoint sa boîte.
  useLayoutEffect(() => {
    if (reduce) return;
    window.scrollTo({ top: 0 });

    const hero = heroRef.current;
    if (!hero) return;
    const origin = takeOrigin(id);
    // Pas d'origine (ouverture directe, ou 2e passage du StrictMode qui a déjà
    // consommé l'origine) : on ne touche pas au composant — aucune opacité.
    if (!origin) return;

    const dest = hero.getBoundingClientRect();
    const dx = origin.left - dest.left;
    const dy = origin.top - dest.top;
    const sx = origin.width / dest.width;
    const sy = origin.height / dest.height;
    hero.style.transformOrigin = 'top left';
    hero.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: 'none' },
      ],
      { duration: HERO_FLIP_MS, easing: EASE_OUT, fill: 'backwards' },
    );
  }, [id, reduce]);

  // Fondu simple, décalé, pour tout ce qui n'est pas le composant ni le titre.
  // Base ENTRY_DELAY_MS : on attend la quasi-fin du vol/zoom du composant.
  const fade = (delay = 0): CSSProperties | undefined =>
    reduce
      ? undefined
      : {
          opacity: entered ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ${EASE_OUT} ${ENTRY_DELAY_MS + delay}ms`,
        };

  return (
    <main className="mx-auto w-full max-w-[1116px] px-6 pb-24 pt-16 sm:px-12 sm:pt-[90px]">
      <Link
        to="/"
        style={fade(0)}
        className="mb-8 inline-flex items-center gap-1.5 text-label text-subtle transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">←</span> Retour
      </Link>

      {!item ? (
        <p className="text-label text-subtle">Composant introuvable.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <SplitText
              as="h1"
              text={item.name}
              show={entered}
              delay={ENTRY_DELAY_MS}
              className="font-display text-display text-foreground"
            />
            <p style={fade(40)} className="text-label text-subtle">
              {item.description}
            </p>
            {item.platforms && item.platforms.length > 0 && (
              <div
                style={fade(70)}
                className="mt-1 flex flex-wrap items-center gap-1.5"
              >
                {item.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-pill bg-surface px-2 py-0.5 text-caption text-subtle"
                  >
                    {PLATFORM_LABEL[p]}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Le playground désigne lui-même sa boîte « composant » (heroRef) et reçoit
              le style d'opacité pour ses réglages. Sans playground, on pose heroRef
              sur la boîte de l'aperçu. */}
          {item.playground ? (
            <DetailTransitionProvider value={{ heroRef, controlsStyle: fade(90) }}>
              {item.playground}
            </DetailTransitionProvider>
          ) : (
            <div
              ref={heroRef}
              className="flex min-h-[320px] items-center justify-center rounded-card bg-surface p-6"
            >
              {item.preview}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
