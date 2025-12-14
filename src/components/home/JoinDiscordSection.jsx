// src/pages/Home/JoinDiscordSection.jsx
import logo from "../../assets/img/logo.gif";

export default function JoinDiscordSection() {
  return (
    <section
      id="join-discord"
      className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-r from-[#181a33]/90 via-[#15162c]/90 to-[#181a33]/90 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl overflow-hidden relative min-w-0"
    >
      {/* glow dietro */}
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,var(--blue)_0,transparent_55%)]" />

      <div className="relative z-10 max-w-xl space-y-3 min-w-0">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1">
          Entra nel nostro Discord
        </h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)]">
          Il Discord è il cuore della community: annunci, whitelist, supporto,
          segnalazioni, eventi e tutto ciò che riguarda il server.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
          <a
            href="https://discord.gg/AgQbbnzwMc"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full font-medium bg-[var(--blue)] text-[#050816] shadow-lg hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-transform transition-shadow text-sm md:text-base"
          >
            Unisciti al Discord
          </a>
        </div>
      </div>

      {/* GIF (al posto del 3D) */}
      <div className="relative z-10 w-full md:w-1/2 h-56 md:h-64 lg:h-72 rounded-3xl border border-white/10 bg-black/40 overflow-hidden min-w-0 flex items-center justify-center">
        <img
          src={logo}
          alt="Logo Discord"
          className="w-full h-full object-contain p-6 select-none"
          draggable={false}
          loading="lazy"
        />
      </div>
    </section>
  );
}
