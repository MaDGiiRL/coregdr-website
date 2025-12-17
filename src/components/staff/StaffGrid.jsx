import { motion, AnimatePresence } from "framer-motion";
import StaffCard from "./StaffCard";

export default function StaffGrid({
  active,
  q,
  members,
  filtered,
  fadeUp,
  container,
}) {
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${active}-${q}`}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((m) => (
            <StaffCard key={m.id} member={m} fadeUp={fadeUp} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Nessun risultato con i filtri attuali.
        </p>
      )}
    </>
  );
}
