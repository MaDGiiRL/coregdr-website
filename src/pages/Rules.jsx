// src/pages/Rules.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const DATA = {
  Generale: {
    "Regole di base": [
      "Regola placeholder #1: testo descrittivo della regola generale.",
      "Regola placeholder #2: un'altra regola generale da sostituire.",
      "Regola placeholder #3: aggiungi qui una norma importante.",
    ],
    "Comportamento in community": [
      "Placeholder: indicazioni sul comportamento in chat e in voice.",
      "Placeholder: linee guida su rispetto, linguaggio e gestione dei conflitti.",
    ],
    "Account & sicurezza": [
      "Placeholder: regole su account condivisi, multi-account e sicurezza.",
      "Placeholder: cosa fare in caso di furto o compromissione account.",
    ],
  },

  Roleplay: {
    "Regole RP generali": [
      "Placeholder: spiegazione su cosa si intende per roleplay serio.",
      "Placeholder: definizione sintetica di concetti come RDM/VDM/metagaming.",
    ],
    "Creazione personaggio": [
      "Placeholder: regole sulla coerenza del personaggio con il setting.",
      "Placeholder: limiti su nomi, background e storie non adatte.",
    ],
    "Scene e azioni": [
      "Placeholder: regole su come gestire scene complesse o sensibili.",
      "Placeholder: indicazioni su come coinvolgere altri player in modo corretto.",
      "Placeholder: cosa fare in caso di problemi durante l'azione (ticket, clip, ecc.).",
    ],
  },

  Server: {
    "Uso di script e mod": [
      "Placeholder: cosa è consentito e cosa è vietato in termini di mod client.",
      "Placeholder: indicazioni su modifiche grafiche e performance.",
    ],
    "Assistenza & ticket": [
      "Placeholder: come e quando aprire un ticket di supporto.",
      "Placeholder: tempi di risposta, cosa allegare e cosa aspettarsi.",
    ],
    Sanzioni: [
      "Placeholder: esempi di provvedimenti (warn, jail, ban).",
      "Placeholder: criteri generali usati dallo staff per valutare le infrazioni.",
    ],
  },
};

export default function Rules() {
  const types = Object.keys(DATA);
  const [activeType, setActiveType] = useState(types[0]);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(DATA[types[0]])[0]
  );

  const categories = useMemo(() => Object.keys(DATA[activeType]), [activeType]);
  const derivedCategory = categories.includes(activeCategory)
    ? activeCategory
    : categories[0];

  const rules = DATA[activeType][derivedCategory] ?? [];

  const reduce = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: {
      opacity: 0,
      y: reduce ? 0 : -12,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.98 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: reduce ? 1 : 0.98,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  const stagger = (delay = 0.05, step = 0.06) => ({
    hidden: {},
    show: { transition: { delayChildren: delay, staggerChildren: step } },
  });

  const RuleCard = ({ text, index }) => (
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

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-10 space-y-6">
      {/* Header */}
      <motion.header
        className="space-y-3"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <h1 className="text-2xl md:text-3xl font-semibold">Regolamento</h1>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
          Il regolamento definisce le regole di comportamento, roleplay e uso
          del server. I testi che vedi qui sono <strong>placeholder</strong>:
          sostituiscili con le linee guida reali del tuo progetto.
        </p>
      </motion.header>

      {/* TOP NAV – tipologie */}
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
                onClick={() => {
                  setActiveType(t);
                  setActiveCategory(Object.keys(DATA[t])[0]);
                }}
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

      {/* Layout a 2 colonne: sidebar categorie + contenuto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar categorie */}
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
                  const count = DATA[activeType][cat].length;
                  return (
                    <motion.li key={cat} variants={fadeUp}>
                      <button
                        type="button"
                        onClick={() => setActiveCategory(cat)}
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

        {/* Contenuto regole */}
        <main className="lg:col-span-8 xl:col-span-9">
          <header className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text)]">
              {activeType} · {derivedCategory}
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
              Sostituisci questi placeholder con le regole ufficiali del tuo
              server.
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
                <RuleCard key={i} text={rule} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

         
        </main>
      </div>
    </section>
  );
}
