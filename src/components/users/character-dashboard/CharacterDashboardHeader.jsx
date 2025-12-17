export default function CharacterDashboardHeader({
  shellCard,
  user,
  charactersCount,
  totals,
}) {
  return (
    <header className={`${shellCard} p-5 md:p-6 space-y-4`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.discordName}
              className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-[var(--color-border)] object-cover shadow-[0_0_30px_rgba(0,0,0,0.6)]"
            />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#13142b]" />
          </div>

          <div className="space-y-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Profilo giocatore
            </p>
            <h1 className="text-xl md:text-2xl font-semibold truncate">
              {user.discordName}
            </h1>
            <p className="text-[11px] md:text-xs text-[var(--color-text-muted)] truncate">
              Discord ID: <span className="font-mono">{user.discordId}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
          <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2 text-right">
            <p className="text-[10px] text-[var(--color-text-muted)]">BG</p>
            <p className="text-lg font-semibold">{charactersCount}</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2 text-right">
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Approvati
            </p>
            <p className="text-lg font-semibold text-emerald-300">
              {totals.totalApproved}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2 text-right">
            <p className="text-[10px] text-[var(--color-text-muted)]">
              In revisione
            </p>
            <p className="text-lg font-semibold text-yellow-300">
              {totals.totalPending}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
        Registrato il{" "}
        {new Date(user.joinedAt).toLocaleString("it-IT", {
          dateStyle: "short",
          timeStyle: "short",
        })}{" "}
        • Ultimo accesso{" "}
        {user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleString("it-IT", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—"}
      </p>
    </header>
  );
}
