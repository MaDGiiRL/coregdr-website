import { motion } from "framer-motion";

export default function RulesTopNav({
  types,
  activeType,
  onPickType,
  variants,
  reduce,
}) {
  const { fadeIn } = variants;

  return (
    <motion.nav
      aria-label="Tipi di regolamento"
      className="sticky top-[4.5rem] z-30 bg-[var(--color-bg)]/85 backdrop-blur border border-[var(--color-border)] rounded-2xl p-3"
      variants={fadeIn}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => {
          const isActive = activeType === t;

          return (
            <motion.button
              key={t}
              type="button"
              onClick={() => onPickType(t)}
              aria-pressed={isActive}
              whileTap={{ scale: reduce ? 1 : 0.97 }}
              whileHover={{ y: reduce ? 0 : -1 }}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm border transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cool)]/60 ${
                isActive
                  ? "bg-[var(--color-surface)] border-[var(--color-accent-cool)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              {t}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
