import { motion } from "framer-motion";

export default function OverviewTab({
  shellCard,
  reduce,
  stats,
  overviewUsers,
  overviewLogs,
  overviewUsersPage,
  setOverviewUsersPage,
  overviewUsersTotalPages,
  overviewLogsPage,
  setOverviewLogsPage,
  overviewLogsTotalPages,
  buildRangeLabel,
  usersTotal,
  logsTotal,
  roleLabel,
  Badge,
  variants,
  icons,
}) {
  const { roleVariant, bgVariant, logVariant } = variants;
  const { UsersIcon, FileText, BadgeCheck, Activity, Crown, UserCog } = icons;

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Utenti registrati",
            value: stats.totalUsers,
            icon: UsersIcon,
            hint: "Totale profili",
          },
          {
            label: "Background inviati",
            value: stats.totalBackgrounds,
            icon: FileText,
            hint: "Totale record",
          },
          {
            label: "In attesa revisione",
            value: stats.pendingBackgrounds,
            icon: BadgeCheck,
            hint: "Da processare",
            extra: "text-yellow-300",
          },
          {
            label: "Approvati / Rifiutati",
            value: `${stats.approvedBackgrounds} / ${stats.rejectedBackgrounds}`,
            icon: Activity,
            hint: "Storico",
          },
        ].map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: reduce ? 0 : -2 }}
              className={`${shellCard} p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {c.label}
                  </p>
                  <p className={`mt-1 text-2xl font-semibold ${c.extra ?? ""}`}>
                    {c.value}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {c.hint}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/20 grid place-items-center">
                  <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 xl:col-span-4">
          <div className={`${shellCard} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-semibold">
                Ultimi iscritti
              </h2>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {buildRangeLabel(usersTotal, overviewUsersPage, 10)}
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {overviewUsers.map((u) => {
                const currentRole = roleLabel(u);
                return (
                  <div
                    key={u.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-semibold truncate">
                        {u.discordName}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
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
                          variant={bgVariant(u.bgStatus)}
                          icon={FileText}
                          title="Stato background"
                        >
                          {u.bgStatus === "none"
                            ? "BG: —"
                            : `BG: ${u.bgStatus}`}
                        </Badge>

                        <Badge
                          variant="job"
                          icon={FileText}
                          title="Job (dal background)"
                        >
                          {u.job ? `Job: ${u.job}` : "Job: —"}
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
                );
              })}

              {overviewUsers.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nessun utente registrato.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
              <button
                type="button"
                onClick={() => setOverviewUsersPage((p) => Math.max(1, p - 1))}
                disabled={overviewUsersPage === 1}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
              >
                Prev
              </button>
              <span>
                Pagina {overviewUsersPage} / {overviewUsersTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setOverviewUsersPage((p) =>
                    Math.min(overviewUsersTotalPages, p + 1)
                  )
                }
                disabled={overviewUsersPage === overviewUsersTotalPages}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 xl:col-span-8">
          <div className={`${shellCard} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-semibold">
                Log attività
              </h2>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {buildRangeLabel(logsTotal, overviewLogsPage, 10)}
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {overviewLogs.map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={logVariant(l.type)} icon={Activity}>
                      {l.type}
                    </Badge>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(l.createdAt).toLocaleString("it-IT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs md:text-sm text-[var(--color-text)]">
                    {l.message}
                  </p>

                  {l.meta?.author && (
                    <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                      <span>Autore: </span>
                      <span className="font-semibold">{l.meta.author}</span>
                    </div>
                  )}

                  {l.meta?.discord_id && (
                    <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                      <span>Discord ID: </span>
                      <span className="font-semibold">{l.meta.discord_id}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
              <button
                type="button"
                onClick={() => setOverviewLogsPage((p) => Math.max(1, p - 1))}
                disabled={overviewLogsPage === 1}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
              >
                Prev
              </button>
              <span>
                Pagina {overviewLogsPage} / {overviewLogsTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setOverviewLogsPage((p) =>
                    Math.min(overviewLogsTotalPages, p + 1)
                  )
                }
                disabled={overviewLogsPage === overviewLogsTotalPages}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
