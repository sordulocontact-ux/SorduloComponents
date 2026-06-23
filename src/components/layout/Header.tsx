import { useEffect, useRef } from 'react';
import Logo from '../Logo';
import { useGlassEnabled, toggleGlass } from '../../lib/settings';
import { createLiquidGlass } from '../../lib/liquid-glass';

export default function Header() {
  const glassEnabled = useGlassEnabled();
  const headerRef = useRef<HTMLElement>(null);

  // Vrai liquid-glass sur la barre de nav : elle réfracte le contenu qui défile dessous.
  // Désactivé via le toggle global → repli sur fond translucide + flou Tailwind.
  useEffect(() => {
    if (!glassEnabled) return;
    const el = headerRef.current;
    if (!el) return;
    const inst = createLiquidGlass(el, {
      borderRadius: 0,
      scale: -180, // réfraction (effet concentré sur les bords)
      cssBlur: 8, // flou du fond plus marqué
      saturation: 1,
      frost: 0,
    });
    return () => inst.destroy();
  }, [glassEnabled]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-10 flex items-center justify-between border-b border-border px-6 py-6 sm:px-12 ${
        glassEnabled ? 'bg-transparent' : 'bg-background/80 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-[24px] w-[25px] items-center justify-center text-foreground">
          <Logo className="h-[32px] w-[32px] rotate-[4.49deg]" />
        </span>
        <p className="font-display text-label text-foreground">Sordulo Components</p>
      </div>

      <div className="flex items-center gap-[13px]">
        <button
          type="button"
          onClick={toggleGlass}
          aria-pressed={glassEnabled}
          className="flex items-center justify-center gap-2 rounded-pill bg-surface p-3 transition-colors hover:bg-surface-strong"
        >
          <span
            className={`size-[13px] rounded-pill ${glassEnabled ? 'bg-success' : 'bg-subtle'}`}
          />
          <span className="text-label text-muted">
            Glass {glassEnabled ? 'on' : 'off'}
          </span>
        </button>
      </div>
    </header>
  );
}
