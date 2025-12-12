// src/pages/Staff.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shield, Crown, Wrench, Users, Search } from "lucide-react";

const STAFF = [
  {
    id: "s1",
    name: "Nome Cognome",
    role: "Founder",
    icon: Crown,
    badge: "Direzione",
    description: "Placeholder: descrizione breve dello staff member.",
  },
  {
    id: "s2",
    name: "Nome Cognome",
    role: "Co-Founder",
    icon: Crown,
    badge: "Direzione",
    description: "Placeholder: descrizione breve dello staff member.",
  },
  {
    id: "s3",
    name: "Nome Cognome",
    role: "Admin",
    icon: Shield,
    badge: "Staff",
    description: "Placeholder: gestione server, regole, moderazione.",
  },
  {
    id: "s4",
    name: "Nome Cognome",
    role: "Moderator",
    icon: Users,
    badge: "Staff",
    description: "Placeholder: supporto community e gestione ticket.",
  },
  {
    id: "s5",
    name: "Nome Cognome",
    role: "Developer",
    icon: Wrench,
    badge: "Tech",
    description: "Placeholder: sviluppo script, fix e ottimizzazioni.",
  },
];

const FILTERS = ["Tutti", "Direzione", "Staff", "Tech"];

export default function Staff() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState("Tutti");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const base =
      active === "Tutti" ? STAFF : STAFF.filter((m) => m.badge === active);

    const query = q.trim().toLowerCase();
    if (!query) return base;

    return base.filter((m) => {
      return (
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        (m.badge || "").toLowerCase().includes(query)
      );
    });
  }, [active, q]);

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: reduce ? 0 : -10, transition: { duration: 0.18 } },
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-10 space-y-6">
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

      {/* Filtri + ricerca */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isActive = active === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`px-3 py-2 rounded-xl border text-xs md:text-sm transition ${
                  isActive
                    ? "bg-[var(--color-surface)] border-[var(--color-accent-cool)] text-[var(--color-accent-cool)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-[320px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome o ruolo…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111326] border border-[var(--color-border)] text-sm"
          />
        </div>
      </div>

      {/* Grid staff */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${active}-${q}`}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((m) => {
            const Icon = m.icon || Shield;
            return (
              <motion.article
                key={m.id}
                variants={fadeUp}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/5 border border-[var(--color-border)] grid place-items-center">
                      <Icon className="w-5 h-5 text-[var(--color-accent-cool)]" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{m.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {m.role}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    {m.badge}
                  </span>
                </div>

                <p className="mt-3 text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {m.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Nessun risultato con i filtri attuali.
        </p>
      )}
    </section>
  );
}
