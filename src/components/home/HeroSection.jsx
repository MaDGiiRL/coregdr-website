
import logo from "../../assets/img/logo.png";
import { useServerStatus } from "../../hooks/useServerStatus";

export default function HeroSection() {
  const { online, players, maxPlayers, loading } = useServerStatus();

  return (
    <section className="grid md:grid-cols-2 gap-10 items-center min-w-0">
      <div className="space-y-5 min-w-0">
        <p className="uppercase tracking-[0.2em] text-xs text-[var(--color-text-muted)]">
          FiveM Roleplay Server
        </p>

        <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
          Benvenuto in{" "}
          <span className="text-[var(--violet-light)]">Core Roleplay</span>
        </h1>

        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-xl">
          Un server <span className="text-[var(--blue)]">serio</span>,{" "}
          <span className="text-[var(--color-accent-warm)]">curato</span> e
          pensato per chi vuole vivere una vera esperienza roleplay su FiveM.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://discord.gg/AgQbbnzwMc"
            className="px-5 py-2.5 rounded-full text-sm md:text-base font-medium bg-[var(--violet)] text-white shadow-lg hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-transform transition-shadow"
          >
            Entra su Discord
          </a>
        </div>

        <div className="flex flex-wrap gap-4 text-xs md:text-sm text-[var(--color-text-muted)]">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Whitelist
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Staff attivo
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Economia bilanciata
          </span>
        </div>
      </div>

      <div className="relative min-w-0 overflow-hidden">

        {/* LOGO ANIMATO 2D */}
        <img
          src={logo}
          alt="Core Roleplay Logo"
          className="w-32 mx-auto mb-5 logo-float"
        />

        <div className="relative rounded-3xl border border-[var(--color-border)] bg-[#14152b]/80 shadow-2xl p-5 space-y-4 min-w-0">
          <h2 className="text-lg font-semibold">Stato server</h2>

          <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
            Stato:{" "}
            {loading ? (
              <span className="text-xs opacity-70">Verifica…</span>
            ) : online ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {/* Online ({players}/{maxPlayers}) */}
                Online ({players} attuali)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Offline
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)] min-w-0">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
              <p className="font-semibold text-[var(--color-text)]">Economy</p>
              <p>Realistica e progressiva</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
              <p className="font-semibold text-[var(--color-text)]">RP</p>
              <p>Serio, character-focused</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
