import { motion, AnimatePresence } from "framer-motion";

export default function RulesSidebar({
  activeType,
  categories,
  derivedCategory,
  onPickCategory,
  getCount,
  variants,
}) {
  const { fadeIn, fadeUp, stagger } = variants;

  return (
    <aside className="lg:col-span-4 xl:col-span-3">
      <motion.div
        className="sticky top-[9.5rem] border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/70 backdrop-blur p-3"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <h2 className="text-xs md:text-sm font-semibold text-[var(--color-text)] mb-2">
          {activeType} · Categorie
        </h2>

        <AnimatePresence mode="wait">
          <motion.ul
            key={activeType}
            className="space-y-1"
            variants={stagger(0.02, 0.05)}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {categories.map((cat) => {
              const isActive = derivedCategory === cat;
              const count = getCount(cat);

              return (
                <motion.li key={cat} variants={fadeUp}>
                  <button
                    type="button"
                    onClick={() => onPickCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs md:text-sm transition ${
                      isActive
                        ? "bg-[var(--color-accent-cool)]/15 border-[var(--color-accent-cool)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border ${
                          isActive
                            ? "border-[var(--color-accent-cool)] text-[var(--color-accent-cool)]"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </motion.div>
    </aside>
  );
}
