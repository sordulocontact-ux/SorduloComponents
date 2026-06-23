import { useSyncExternalStore } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/**
 * Mini-routeur basé sur le hash (`#/...`) — zéro dépendance, compatible hébergement
 * statique. Suffisant pour la vitrine : `#/` (accueil) et `#/c/:id` (détail composant).
 */

function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

/** Chemin courant (réactif). */
export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute, () => '/');
}

/** Navigue vers un chemin (`/`, `/c/mon-id`, …). */
export function navigate(to: string) {
  window.location.hash = to;
}

/** Lien interne (ancre `#`). Le scroll en haut est géré au changement de route. */
export function Link({
  to,
  className,
  style,
  children,
  onClick,
}: {
  to: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a href={`#${to}`} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
}
