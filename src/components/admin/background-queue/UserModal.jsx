import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X as CloseIcon } from "lucide-react";
import { STATUS_LABELS, statusPill } from "./ui";

export default function UserModal({
  userModalOpen,
  modalUser,
  modalUserBackgrounds,
  reduce,
  shellCard,
  closeUserModal,
  selectFromModal,
}) {
  return (
    <AnimatePresence>
      {userModalOpen && modalUser && (
        <motion.div
          key="userModal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeUserModal();
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              y: reduce ? 0 : 12,
              scale: reduce ? 1 : 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.18 },
            }}
            exit={{
              opacity: 0,
              y: reduce ? 0 : 10,
              scale: reduce ? 1 : 0.98,
              transition: { duration: 0.12 },
            }}
            className={`w-full max-w-3xl ${shellCard} p-4 md:p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-semibold truncate">
                  {modalUser.discordName}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  ID:{" "}
                  <span className="font-mono">
                    {modalUser.discordId || modalUser.userId}
                  </span>
                  <span className="mx-2 opacity-50">•</span>
                  Job:{" "}
                  <span className="text-white/80 font-semibold">
                    {modalUser.job || "—"}
                  </span>
                </p>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={closeUserModal}
                className="px-3 py-2 rounded-full border border-[var(--color-border)] bg-black/20 hover:bg-white/5 inline-flex items-center gap-2 text-xs"
              >
                <CloseIcon className="w-4 h-4" />
                Chiudi
              </motion.button>
            </div>

            <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {modalUserBackgrounds.map((bg) => (
                <div
                  key={bg.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {bg.nome} {bg.cognome}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Inviato:{" "}
                        {new Date(bg.submittedAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        {bg.job ? (
                          <>
                            <span className="mx-2 opacity-50">•</span>
                            Job:{" "}
                            <span className="text-white/80 font-semibold">
                              {bg.job}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                          bg.status
                        )}`}
                      >
                        {STATUS_LABELS[bg.status] ?? bg.status}
                      </span>

                      <motion.button
                        type="button"
                        whileTap={{ scale: reduce ? 1 : 0.97 }}
                        onClick={() => selectFromModal(bg.id)}
                        className="px-3 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 inline-flex items-center gap-2 text-xs"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Apri
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}

              {modalUserBackgrounds.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nessun background per questo utente.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
