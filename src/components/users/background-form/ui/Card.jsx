export default function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/60 shadow-[0_14px_50px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]/70">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}
