import { motion, AnimatePresence } from "framer-motion";
import RuleCard from "./RuleCard";

export default function RulesContent({
  activeType,
  derivedCategory,
  rules,
  variants,
}) {
  const { stagger } = variants;

  return (
    <main className="lg:col-span-8 xl:col-span-9">
      <header className="mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text)]">
          {activeType} · {derivedCategory}
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
          Sostituisci questi placeholder con le regole ufficiali del tuo server.
        </p>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeType}-${derivedCategory}`}
          className="grid md:grid-cols-2 gap-4"
          variants={stagger(0.03, 0.06)}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {rules.map((rule, i) => (
            <RuleCard key={i} text={rule} index={i} variants={variants} />
          ))}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
