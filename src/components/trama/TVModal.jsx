import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import ZoomScreen from "./ZoomScreen";

export default function TvModal({
  open,
  setOpen,
  act,
  overlayAnim,
  modalAnim,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay dentro il box */}
          <motion.button
            {...overlayAnim}
            className="absolute inset-0 z-[90] bg-black/80"
            onClick={() => setOpen(false)}
            aria-label="Chiudi"
            type="button"
          />

          {/* contenuto modale dentro il box */}
          <motion.div
            {...modalAnim}
            className="absolute inset-0 z-[91] p-3 md:p-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="h-full w-full flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                    Visione
                  </p>
                  <p className="mt-0.5 font-semibold truncate">{act.label}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 rounded-[34px] overflow-hidden border border-white/10 bg-black relative">
                <ZoomScreen act={act} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
