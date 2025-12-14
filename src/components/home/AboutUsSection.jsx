// src/pages/Home/AboutUsSection.jsx
export default function AboutUsSection() {
  return (
    <section className="grid md:grid-cols-2 gap-10 items-start min-w-0">
      <div className="min-w-0">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">Chi siamo</h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] mb-4">
          Core Roleplay nasce dalla voglia di portare una{" "}
          <span className="text-[var(--violet-light)]">trama</span> in
          un'ambientazione ormai scarna di storie.
          {/* <span className="text-[var(--violet-light)]">stabile</span>,{" "}
          <span className="text-[var(--blue)]">performante</span> e{" "}
          <span className="text-[var(--color-accent-warm)]">immersivo</span>. */}
        </p>
        <p className="text-sm md:text-base text-[var(--color-text-muted)]">
          Dall'accurata selezione dei giocatori si ha intenzione di valorizzare
          ogni background al massimo, anche grazie al nostro speciale sistema di
          Skill che consentirà ai più meritevoli un posto in prima fila.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs md:text-sm min-w-0">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4 min-w-0">
          <p className="text-[var(--color-text-muted)]">Focus</p>
          <p className="text-[var(--color-text)] font-semibold">
            Vero gioco di ruolo
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4 min-w-0">
          <p className="text-[var(--color-text-muted)]">Script</p>
          <p className="text-[var(--color-text)] font-semibold">
            Custom e ottimizzati
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4 min-w-0">
          <p className="text-[var(--color-text-muted)]">Staff</p>
          <p className="text-[var(--color-text)] font-semibold">
            Maturo e con esperienza
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4 min-w-0">
          <p className="text-[var(--color-text-muted)]">Eventi</p>
          <p className="text-[var(--color-text)] font-semibold">
            Legati alla trama
          </p>
        </div>
      </div>
    </section>
  );
}
