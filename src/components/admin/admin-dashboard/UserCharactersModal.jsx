import { motion, AnimatePresence } from "framer-motion";

export default function UserCharactersModal({
  userModalOpen,
  reduce,
  selectedUser,
  userCharacters,
  userCharsLoading,
  userCharsError,
  closeUserModal,
  canAdminEditPG,
  addLocalCharacter,
  removeLocalCharacter,
  Badge,
  bgVariant,
  icons,
}) {
  const { UsersIcon, Plus, Trash2, FileText, Briefcase } = icons;

  return (
    <AnimatePresence>
      {userModalOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Chiudi"
            onClick={closeUserModal}
            className="absolute inset-0 bg-black/70"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: reduce ? 0 : 12,
              scale: reduce ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduce ? 0 : 10,
              scale: reduce ? 1 : 0.98,
            }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="p-5 md:p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Personaggi utente
                  </p>
                  <h3 className="mt-1 text-lg md:text-xl font-semibold truncate">
                    {selectedUser?.discordName ?? "Utente"}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Discord ID:{" "}
                    <span className="font-mono">
                      {selectedUser?.discord_id}
                    </span>
                  </p>

                  {selectedUser && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant="pg"
                        icon={UsersIcon}
                        title="Personaggi / slot (pg_num)"
                      >
                        PG: {userCharacters.length} / {selectedUser.pgMax ?? 1}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canAdminEditPG && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: reduce ? 1 : 0.97 }}
                      onClick={addLocalCharacter}
                      disabled={
                        userCharacters.length >= (selectedUser?.pgMax ?? 1)
                      }
                      className="px-3 py-2 rounded-2xl bg-[var(--violet)] text-white text-xs font-semibold shadow-md hover:brightness-110 inline-flex items-center gap-2 disabled:opacity-40"
                      title="Aggiungi PG (solo frontend)"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi PG
                    </motion.button>
                  )}

                  <button
                    type="button"
                    onClick={closeUserModal}
                    className="px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 text-xs font-semibold"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {userCharsLoading && (
                <div className="text-xs text-[var(--color-text-muted)]">
                  Caricamento personaggi…
                </div>
              )}

              {!userCharsLoading && userCharsError && (
                <div className="text-xs text-rose-300">{userCharsError}</div>
              )}

              {!userCharsLoading && !userCharsError && (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {userCharacters.map((ch) => (
                    <div
                      key={ch.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{ch.name}</p>

                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                            Creato il{" "}
                            {new Date(ch.createdAt).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                            {ch.__local ? (
                              <span className="ml-2 opacity-70">(solo UI)</span>
                            ) : null}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge
                              variant={bgVariant(ch.status)}
                              icon={FileText}
                            >
                              {ch.status === "none"
                                ? "BG: —"
                                : `BG: ${ch.status}`}
                            </Badge>

                            <Badge variant="job" icon={Briefcase}>
                              {ch.job ? `Job: ${ch.job}` : "Job: —"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-[11px] text-[var(--color-text-muted)] space-y-1 md:text-right">
                            <div>
                              Ultimo accesso:{" "}
                              <span className="text-white/80">
                                {ch.lastServerJoinAt
                                  ? new Date(
                                      ch.lastServerJoinAt
                                    ).toLocaleString("it-IT", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </span>
                            </div>
                            <div>
                              Ore in gioco:{" "}
                              <span className="text-white/80 font-semibold">
                                {Number(ch.hoursPlayed || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {canAdminEditPG && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: reduce ? 1 : 0.97 }}
                              onClick={() => removeLocalCharacter(ch.id)}
                              className="ml-2 px-3 py-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 hover:bg-rose-400/15 text-rose-200 text-xs font-semibold inline-flex items-center gap-2"
                              title="Rimuovi PG (solo frontend)"
                            >
                              <Trash2 className="w-4 h-4" />
                              Rimuovi
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {userCharacters.length === 0 && (
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Nessun personaggio trovato per questo utente.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
