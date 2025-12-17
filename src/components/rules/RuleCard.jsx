import { motion } from "framer-motion";

export default function RuleCard({ text, index, variants }) {
  const { fadeUp } = variants;

  return (
    <motion.div
      variants={fadeUp}
      className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
    >
      <div className="flex gap-3">
        <span className="w-8 h-8 shrink-0 rounded-xl bg-white/5 border border-[var(--color-border)] grid place-items-center text-[var(--color-accent-warm)] font-semibold text-sm">
          {index + 1}
        </span>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
