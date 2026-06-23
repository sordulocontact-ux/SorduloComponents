import type { ReactNode } from 'react';
import Toggle from '../components/ui/Toggle/Toggle';
import tapSound from '../components/ui/Toggle/tap-sound.mp3';
import MemoryViewModePicker from '../components/ui/MemoryViewModePicker/MemoryViewModePicker';
import MemoryViewModePickerPlayground from '../components/ui/MemoryViewModePicker/MemoryViewModePickerPlayground';

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
  /**
   * Sound design du composant : URL du fichier audio (importé, colocalisé
   * dans le dossier du composant). Sa présence active l'icône son animée +
   * la lecture au clic.
   */
  sound?: string;
  /**
   * Vue interactive de la page de détail (bac à sable avec réglages live).
   * Si absent, la page de détail affiche simplement l'aperçu.
   */
  playground?: ReactNode;
};

/**
 * Registre des composants de la bibliothèque Sordulo.
 * Pour ajouter un composant : crée-le dans `src/components/ui/`,
 * puis ajoute une entrée ici.
 */
export const components: ShowcaseItem[] = [
  {
    id: 'toggle',
    name: 'Radio button',
    description: 'Lorem ipsum',
    preview: <Toggle />,
    sound: tapSound,
  },
  {
    id: 'segmented-control',
    name: 'Segmented control',
    description: 'Sélecteur segmenté à sélection coulissante (verre ou plein)',
    preview: <MemoryViewModePicker />,
    platforms: ['react', 'swift'],
    playground: <MemoryViewModePickerPlayground />,
  },
];
