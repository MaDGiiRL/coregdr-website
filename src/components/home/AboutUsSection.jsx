// src/pages/Home/AboutUsSection.jsx
export default function AboutUsSection() {
  return (
    <section className="grid md:grid-cols-2 gap-10 items-start">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">Chi siamo</h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] mb-4">
          Core Roleplay nasce dalla voglia di creare un server{" "}
          <span className="text-[var(--violet-light)]">stabile</span>,{" "}
          <span className="text-[var(--blue)]">performante</span> e{" "}
          <span className="text-[var(--color-accent-warm)]">immersivo</span>.
        </p>
        <p className="text-sm md:text-base text-[var(--color-text-muted)]">
          Ci concentriamo sul roleplay di qualità, evitando situazioni troll,
          gunplay gratuito e comportamenti tossici. Vogliamo una community
          matura, dove ogni personaggio ha una storia e ogni scelta ha
          conseguenze.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-[var(--color-text-muted)]">Focus</p>
          <p className="text-[var(--color-text)] font-semibold">
            Roleplay serio
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-[var(--color-text-muted)]">Script</p>
          <p className="text-[var(--color-text)] font-semibold">
            Custom e ottimizzati
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-[var(--color-text-muted)]">Staff</p>
          <p className="text-[var(--color-text)] font-semibold">
            Presente e disponibile
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-[var(--color-text-muted)]">Eventi</p>
          <p className="text-[var(--color-text)] font-semibold">
            Organizzati e bilanciati
          </p>
        </div>
      </div>
    </section>
  );
}
