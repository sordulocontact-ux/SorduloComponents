import Logo from '../Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-6 backdrop-blur-sm sm:px-12">
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-[24px] w-[25px] items-center justify-center text-foreground">
          <Logo className="h-[23px] w-[23px] rotate-[4.49deg]" />
        </span>
        <p className="text-label text-foreground">Sordulo Components</p>
      </div>

      <div className="flex items-center gap-[13px]">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-pill bg-surface p-3 transition-colors hover:bg-surface-strong"
        >
          <span className="size-[13px] rounded-pill bg-success" />
          <span className="text-label text-muted">Sound on</span>
        </button>
      </div>
    </header>
  );
}
