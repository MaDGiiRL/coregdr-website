import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function BackgroundQueueHeader({
  shellCard,
  reduce,
  resetFilters,
  onRefresh,
}) {
  return (
    <header className={`${shellCard} p-5 md:p-6`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Staff
            </p>
            <h2 className="mt-1 text-xl md:text-2xl font-semibold">
              Moderazione background
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[var(--color-text-muted)]">
              Filtra rapidamente per stato e cerca. Suggerimento: usa il Discord
              ID o il job.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
            <motion.button
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.98 }}
              onClick={resetFilters}
              className="px-4 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 inline-flex items-center gap-2 text-xs md:text-sm font-semibold"
              title="Reset filtri"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.98 }}
              onClick={onRefresh}
              className="px-4 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 inline-flex items-center gap-2 text-xs md:text-sm font-semibold"
              title="Aggiorna lista"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </motion.button>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />
      </div>
    </header>
  );
}
