import { motion, AnimatePresence } from "framer-motion";
import { STATUS_LABELS, statusPill } from "./ui";

export default function BackgroundsList({
  shellCard,
  filtered,
  selected,
  handleSelect,
  cardAnim,
  reduce,
}) {
  return (
    <aside className="lg:col-span-5 xl:col-span-4">
      <div className={`${shellCard} p-3 space-y-3`}>
        <div className="max-h-[540px] overflow-y-auto space-y-2 pt-1">
          <AnimatePresence initial={false}>
            {filtered.map((item) => {
              const isActive = selected?.id === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  {...cardAnim}
                  whileHover={{ y: reduce ? 0 : -1 }}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 text-xs md:text-sm transition ${
                    isActive
                      ? "border-[var(--blue)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">
                      {item.nome} {item.cognome}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                        item.status
                      )}`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--color-text-muted)]">
                    <span className="truncate">
                      {item.discordName}
                      {item.job ? (
                        <span className="ml-2 opacity-70">• {item.job}</span>
                      ) : null}
                    </span>
                    <span>
                      {new Date(item.submittedAt).toLocaleString("it-IT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
              Nessun background con questo filtro.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
