export default function CharacterDashboardGate({
  loading,
  session,
  profile,
  children,
}) {
  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessione...
      </p>
    );
  }

  if (!session || !profile) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Devi effettuare il login con Discord per vedere i tuoi personaggi.
      </p>
    );
  }

  return children;
}
