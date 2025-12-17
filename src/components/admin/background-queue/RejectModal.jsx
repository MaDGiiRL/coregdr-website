import { motion, AnimatePresence } from "framer-motion";
import { XCircle, X as CloseIcon } from "lucide-react";

export default function RejectModal({
  rejectOpen,
  selected,
  reduce,
  shellCard,
  rejectReasonDraft,
  setRejectReasonDraft,
  rejectSending,
  closeRejectModal,
  submitReject,
}) {
  return (
    <AnimatePresence>
      {rejectOpen && selected && (
        <motion.div
          key="rejectModal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeRejectModal();
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
            className={`w-full max-w-lg ${shellCard} p-4 md:p-5 space-y-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Rifiuto background
                </p>
                <h3 className="text-lg font-semibold truncate">
                  {selected.nome} {selected.cognome}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Inserisci il motivo del rifiuto (verrà salvato anche nei
                  commenti).
                </p>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={closeRejectModal}
                disabled={rejectSending}
                className="px-3 py-2 rounded-full border border-[var(--color-border)] bg-black/20 hover:bg-white/5 inline-flex items-center gap-2 text-xs disabled:opacity-50"
              >
                <CloseIcon className="w-4 h-4" />
                Chiudi
              </motion.button>
            </div>

            <textarea
              value={rejectReasonDraft}
              onChange={(e) => setRejectReasonDraft(e.target.value)}
              disabled={rejectSending}
              placeholder="Scrivi qui la motivazione del rifiuto…"
              className="w-full min-h-[120px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
              maxLength={500}
            />

            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>
                {rejectReasonDraft.trim() ? "Ok" : "Motivo obbligatorio"}
              </span>
              <span>{rejectReasonDraft.length}/500</span>
            </div>

            <div className="flex justify-end gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={closeRejectModal}
                disabled={rejectSending}
                className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-2 text-xs"
              >
                Annulla
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={submitReject}
                disabled={rejectSending || !rejectReasonDraft.trim()}
                className="px-4 py-2 rounded-full font-semibold bg-red-500/90 text-white shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2 text-xs"
              >
                <XCircle className="w-4 h-4" />
                {rejectSending ? "Invio..." : "Invia rifiuto"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
