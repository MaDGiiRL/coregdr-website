import { motion } from "framer-motion";

export default function UsersTab({
  shellCard,
  reduce,
  userSearch,
  setUserSearch,
  jobFilter,
  setJobFilter,
  jobOptions,
  roleFilter,
  setRoleFilter,
  bgFilter,
  setBgFilter,
  buildRangeLabel,
  total,
  page,
  pageSize,
  paginatedUsers,
  roleLabel,
  openUserModal,
  usersPage,
  setUsersPage,
  usersTotalPages,
  Badge,
  roleVariant,
  icons,
}) {
  const { UsersIcon, Search, Briefcase, UserCog, FileText, Crown, BadgeCheck } =
    icons;

  return (
    <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Utenti registrati
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Cerca testo.."
              className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
            />
          </div>


          <span className="text-xs text-[var(--color-text-muted)]">
            {buildRangeLabel(total, page, pageSize)}
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto">
        {paginatedUsers.map((u) => {
          const currentRole = roleLabel(u);

          return (
            <motion.button
              key={u.id}
              type="button"
              onClick={() => openUserModal(u)}
              whileTap={{ scale: reduce ? 1 : 0.99 }}
              className="
                w-full text-left
                rounded-2xl border border-[var(--color-border)]
                bg-black/20 px-4 py-3
                hover:bg-white/5 transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]
              "
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{u.discordName}</p>

                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Ultimo accesso:{" "}
                    <span className="text-white/80">
                      {u.lastServerJoinAt
                        ? new Date(u.lastServerJoinAt).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                    <span className="mx-2 opacity-50">•</span>
                    Ore:{" "}
                    <span className="text-white/80 font-semibold">
                      {Number(u.hoursPlayed || 0).toFixed(1)}
                    </span>
                  </p>

                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    <span className="font-mono opacity-80">{u.discord_id}</span>
                    <span className="mx-2 opacity-50">•</span>
                    Iscritto il{" "}
                    {new Date(u.joinedAt).toLocaleString("it-IT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={roleVariant(currentRole)}
                      icon={
                        currentRole === "Admin"
                          ? Crown
                          : currentRole === "Whitelister"
                          ? BadgeCheck
                          : UserCog
                      }
                    >
                      {currentRole}
                    </Badge>

                    <Badge
                      variant="pg"
                      icon={UsersIcon}
                      title="Personaggi / slot (pg_num)"
                    >
                      PG: {u.pgCount ?? 0} / {u.pgMax ?? 1}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}

        {paginatedUsers.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
            Nessun utente corrisponde ai filtri.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
        <button
          type="button"
          onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
          disabled={usersPage === 1}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Prev
        </button>
        <span>
          Pagina {usersPage} / {usersTotalPages}
        </span>
        <button
          type="button"
          onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
          disabled={usersPage === usersTotalPages}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
