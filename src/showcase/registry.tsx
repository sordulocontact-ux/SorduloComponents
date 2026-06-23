import type { ReactNode } from 'react';
import Toggle from '../components/ui/Toggle/Toggle';
import MemoryViewModePicker from '../components/ui/MemoryViewModePicker/MemoryViewModePicker';

/** Plateformes sur lesquelles le composant est disponible. */
export type Platform = 'react' | 'swift';

export type ShowcaseItem = {
  id: string;
  name: string;
  description: string;
  /** Rendu affiché au centre de la carte d'aperçu */
  preview: ReactNode;
  /** Plateformes disponibles (badges affichés sur la carte) */
  platforms?: Platform[];
};

/**
 * Registre des composants de la bibliothèque Sordulo.
 * Pour ajouter un composant : crée-le dans `src/components/ui/`,
 * puis ajoute une entrée ici.
 */
export const components: ShowcaseItem[] = [
  {
    id: 'toggle-1',
    name: 'Radio button',
    description: 'Lorem ipsum',
    preview: <Toggle />,
  },
  {
    id: 'toggle-2',
    name: 'Radio button',
    description: 'Lorem ipsum',
    preview: <Toggle />,
  },
  {
    id: 'memory-view-mode-picker',
    name: 'Memory view mode picker',
    description: 'Segmented control Liquid Glass « Liste / Carte »',
    preview: <MemoryViewModePicker />,
    platforms: ['react', 'swift'],
  },
];
