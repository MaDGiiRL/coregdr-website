export default function BackgroundFormHeader() {
  return (
    <header className="space-y-2">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        Character creation
      </p>
      <h1 className="text-2xl md:text-3xl font-semibold">
        Background del personaggio
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
        Compila il background in modo chiaro. Lo staff lo valuterà e aggiornerà
        il passaporto in città.
      </p>
    </header>
  );
}
