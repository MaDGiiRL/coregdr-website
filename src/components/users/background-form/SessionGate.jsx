export default function SessionGate({ loading, session, profile, children }) {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Caricamento sessione…
          </p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Devi effettuare il login con Discord.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
