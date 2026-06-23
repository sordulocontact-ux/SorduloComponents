import { useState } from 'react';

type ToggleProps = {
  defaultOn?: boolean;
};

/** Interrupteur on/off — composant de la bibliothèque Sordulo */
export default function Toggle({ defaultOn = false }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="flex items-center gap-1 rounded-pill bg-foreground p-1"
    >
      <span
        className={`size-6 rounded-pill bg-background transition-opacity ${on ? 'opacity-0' : 'opacity-100'}`}
      />
      <span
        className={`size-6 rounded-pill bg-background transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`}
      />
    </button>
  );
}
