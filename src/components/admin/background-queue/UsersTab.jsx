import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";

export default function UsersTab({
  shellCard,
  reduce,
  usersFiltered,
  userStats,
  openUserModal,
}) {
  return (
    <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
          <UsersRound className="w-4 h-4" />
          Utenti (clicca per vedere i background in modale)
        </h3>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          Job = gruppo
        </span>
      </div>

      <div className="space-y-2 max-h-[560px] overflow-y-auto">
        {usersFiltered.map((u) => {
          const st = userStats.get(u.userId);
          const last = st?.lastServerJoinAt
            ? new Date(st.lastServerJoinAt).toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—";
          const hrs = Number(st?.hoursPlayed ?? 0).toFixed(1);

          return (
            <motion.button
              key={u.userId}
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.985 }}
              onClick={() => openUserModal(u)}
              className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 px-4 py-3 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{u.discordName}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                    ID:{" "}
                    <span className="font-mono">{u.discordId || u.userId}</span>
                    <span className="mx-2 opacity-50">•</span>
                    Job:{" "}
                    <span className="text-white/80 font-semibold">
                      {u.job || "—"}
                    </span>
                    <span className="mx-2 opacity-50">•</span>
                    BG:{" "}
                    <span className="text-white/80 font-semibold">
                      {u.backgroundsCount}
                    </span>
                    <span className="mx-2 opacity-50">•</span>
                    Ultimo: <span className="text-white/80">{last}</span>
                    <span className="mx-2 opacity-50">•</span>
                    Ore:{" "}
                    <span className="text-white/80 font-semibold">{hrs}</span>
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}

        {usersFiltered.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Nessun utente trovato.
          </p>
        )}
      </div>
    </div>
  );
}
