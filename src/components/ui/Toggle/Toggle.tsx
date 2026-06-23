import { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';

type ToggleProps = {
  defaultOn?: boolean;
};

/**
 * Interrupteur on/off de la bibliothèque Sordulo.
 * Enveloppe `ToggleSwitch` (contrôlé) avec un état local pour l'aperçu.
 * Le son est joué par la carte au clic (cf. `sound` dans le registre).
 */
export default function Toggle({ defaultOn = false }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  return <ToggleSwitch isActive={on} onChange={setOn} />;
}
