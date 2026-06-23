import {
  createContext,
  useContext,
  type CSSProperties,
  type RefObject,
} from 'react';

/**
 * Contexte de la transition d'entrée de la page de détail. Permet à un playground
 * de désigner les deux rôles que la page anime différemment :
 *  - `heroRef` : la boîte « composant » → cible du FLIP (vol/zoom depuis la carte) ;
 *  - `controlsStyle` : les réglages éditables → simple apparition en opacité.
 *
 * Les composants sans playground n'en ont pas besoin : la page pose elle-même
 * `heroRef` sur la boîte de l'aperçu.
 */
type DetailTransition = {
  heroRef?: RefObject<HTMLDivElement | null>;
  controlsStyle?: CSSProperties;
};

const Ctx = createContext<DetailTransition>({});

export const DetailTransitionProvider = Ctx.Provider;

export function useDetailTransition() {
  return useContext(Ctx);
}
