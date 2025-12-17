import { motion } from "framer-motion";

export default function StaffHeader({ fadeUp }) {
  return (
    <motion.header
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <h1 className="text-2xl md:text-3xl font-semibold">Staff</h1>
      <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
        Qui trovi lo staff del progetto. I nomi sono{" "}
        <strong>placeholder</strong>: sostituiscili con quelli reali quando
        vuoi.
      </p>
    </motion.header>
  );
}
