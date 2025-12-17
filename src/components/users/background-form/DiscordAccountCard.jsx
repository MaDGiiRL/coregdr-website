export default function DiscordAccountCard({ profile }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/60 shadow-[0_14px_50px_rgba(0,0,0,0.35)] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Account Discord
        </p>
        <p className="text-sm font-medium truncate">
          {profile.discord_username || profile.id}
        </p>
      </div>
      <span className="text-[11px] px-3 py-1 rounded-full bg-[var(--blue)]/15 text-[var(--blue)] border border-[var(--blue)]/30">
        Connesso
      </span>
    </div>
  );
}
