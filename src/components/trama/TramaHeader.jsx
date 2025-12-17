import { Tv2 } from "lucide-react";

export default function TramaHeader({ act }) {
  return (
    <header className="mb-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-white/5 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        <Tv2 className="w-4 h-4 text-[var(--color-accent-cool)]" />
        Trama — Canali
      </div>

      <h1 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight">
        {act.label}
      </h1>

      <p className="mt-2 text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
        Frecce per cambiare canale. Click sullo schermo = play/pausa (audio
        incluso).
      </p>
    </header>
  );
}
