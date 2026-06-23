import { useSyncExternalStore } from 'react';

/**
 * Réglage global de la vitrine : activer/désactiver le glassmorphism. Partagé entre
 * l'accueil et les pages de détail (toggle dans le Header). Persisté en localStorage.
 */

const KEY = 'sordulo:glass-enabled';

function readInitial(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const v = localStorage.getItem(KEY);
  return v == null ? true : v === '1';
}

let glassEnabled = readInitial();
const listeners = new Set<() => void>();

export function setGlassEnabled(v: boolean) {
  glassEnabled = v;
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, v ? '1' : '0');
  listeners.forEach((l) => l());
}

export function toggleGlass() {
  setGlassEnabled(!glassEnabled);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Hook réactif : `true` si le glassmorphism est activé. */
export function useGlassEnabled() {
  return useSyncExternalStore(
    subscribe,
    () => glassEnabled,
    () => true,
  );
}
