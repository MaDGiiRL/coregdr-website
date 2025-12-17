import { motion } from "framer-motion";

export default function RulesHeader({ variants }) {
  const { fadeUp } = variants;

  return (
    <motion.header
      className="space-y-3"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <h1 className="text-2xl md:text-3xl font-semibold">Regolamento</h1>
      <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
        Il regolamento definisce le regole di comportamento, roleplay e uso del
        server. I testi che vedi qui sono <strong>placeholder</strong>:
        sostituiscili con le linee guida reali del tuo progetto.
      </p>
    </motion.header>
  );
}
