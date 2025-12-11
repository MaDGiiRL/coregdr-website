// src/pages/HowToConnect.jsx
import { useState } from "react";
import { motion } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "SCARICA GTA V LEGACY EDITION",
    description:
      "Ti servirà una copia di GTA V Legacy Edition da qualsiasi launcher (Steam, Rockstar, Epic, ecc.).",
    buttonLabel: "COMPRA",
    buttonHref: "https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/",
  },
  {
    id: 2,
    title: "SCARICA IL LAUNCHER DI FIVEM",
    description:
      "Installa il launcher ufficiale di FiveM e assicurati che GTA V sia aggiornato prima di avviarlo.",
    buttonLabel: "SCARICA",
    buttonHref: "https://fivem.net",
  },
  {
    id: 3,
    title: "CONNETTITI AL SERVER CORE ROLEPLAY",
    description:
      "Avvia FiveM, premi F8 per aprire la console e incolla il comando di connessione al nostro server.",
    buttonLabel: "CONNETTITI",
    buttonHref: "fivem://connect/tuo-ip-o-endpoint-qui", // metti il tuo
    code: "fivem://connect/tuo-ip-o-endpoint-qui",
  },
  {
    id: 4,
    title: "ENTRA NEL DISCORD",
    description:
      "Una volta in game e/o prima di entrare, unisciti al nostro Discord per regolamento, annunci, ticket e whitelist.",
    buttonLabel: "DISCORD",
    buttonHref: "https://discord.gg/tuo-invite", // metti il tuo
  },
  {
    id: 5,
    title: "LEGGI IL REGOLAMENTO E FAI LA WHITELIST",
    description:
      "Dentro al Discord troverai il regolamento e la sezione whitelist. Compilala per ottenere il passaporto alla città.",
    buttonLabel: "WHITELIST",
    buttonHref: "https://discord.gg/tuo-invite",
  },
  {
    id: 6,
    title: "REGISTRATI SUL SITO E INVIA IL BACKGROUND",
    description:
      "Registrati sul sito tramite Discord, accedi alla tua area e invia il background RP del tuo personaggio per completare l’accesso alla città.",
    buttonLabel: "REGISTRATI",
    buttonHref: "/dashboard",
  },
];

export default function HowToConnect() {
  // duplico per il loop infinito
  const loopedSteps = [...steps, ...steps];
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Come connettersi al server
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
          Segui questi passaggi per entrare su <strong>Core Roleplay</strong> e
          ottenere passaporto, whitelist e background approvato.
        </p>
      </header>

      {/* Carosello auto-scroll in loop */}
      <div className="relative mt-8 overflow-hidden">
        {/* fade sinistra */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#181a33] to-transparent z-10" />
        {/* fade destra */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#181a33] to-transparent z-10" />

        <motion.div
          className="flex gap-4 md:gap-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: isPaused ? 120 : 30, // in hover rallenta quasi a zero
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {loopedSteps.map((step, index) => (
            <article
              key={`${step.id}-${index}`}
              className="
                min-w-[280px] md:min-w-[340px] lg:min-w-[380px]
                rounded-3xl border border-[var(--color-border)]
                bg-[var(--color-surface)]/90 
                px-6 py-5 md:px-7 md:py-6
                flex flex-col gap-4
                transition-colors duration-300
                hover:border-[var(--color-accent-cool)]
                hover:bg-[rgba(31,33,64,0.98)]
                hover:shadow-[0_0_10px_rgba(53,210,255,0.35)]
              "
            >
              {/* Top: numero + titolo + pulsante */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div
                    className="
                      h-9 w-9 md:h-10 md:w-10
                      rounded-full flex items-center justify-center
                      bg-[radial-gradient(circle_at_top,var(--violet-light),var(--violet))]
                      text-white font-bold text-sm md:text-base
                      shadow-[0_0_18px_rgba(111,47,217,0.6)]
                    "
                  >
                    {step.id}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Step {step.id}
                    </p>
                    <h2 className="text-sm md:text-base lg:text-lg font-semibold">
                      {step.title}
                    </h2>
                  </div>
                </div>

                <a
                  href={step.buttonHref}
                  target={
                    step.buttonHref.startsWith("http") ? "_blank" : undefined
                  }
                  rel="noreferrer"
                  className="
                    hidden sm:inline-flex
                    px-5 py-2 rounded-full text-xs md:text-sm font-semibold
                    bg-[linear-gradient(135deg,var(--violet),var(--blue))]
                    text-white shadow-md hover:brightness-110 active:scale-95
                    whitespace-nowrap
                  "
                >
                  {step.buttonLabel}
                </a>
              </div>

              {/* Descrizione + eventuale codice */}
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {step.description}
                </p>

                {step.code && (
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                      Comando console:
                    </p>
                    <pre className="mt-0 p-2 rounded-2xl bg-black/40 text-[11px] md:text-xs text-[var(--color-accent-cool)] overflow-x-auto border border-white/10">
                      {step.code}
                    </pre>
                  </div>
                )}
              </div>

              {/* Bottone mobile (sotto) */}
              <a
                href={step.buttonHref}
                target={
                  step.buttonHref.startsWith("http") ? "_blank" : undefined
                }
                rel="noreferrer"
                className="
                  sm:hidden inline-flex
                  px-5 py-2 rounded-full text-xs font-semibold
                  bg-[linear-gradient(135deg,var(--violet),var(--blue))]
                  text-white shadow-md hover:brightness-110 active:scale-95
                  self-start
                "
              >
                {step.buttonLabel}
              </a>
            </article>
          ))}
        </motion.div>
      </div>

      {/* Box finale di supporto */}
      <div className="mt-2 text-xs md:text-sm text-[var(--color-text-muted)] p-4 rounded-2xl border border-[var(--color-border)] bg-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          Se riscontri problemi di connessione o con la whitelist, apri un
          ticket sul <strong>Discord</strong> e specifica screenshot e orario
          del problema.
        </div>
        <a
          href="https://discord.gg/tuo-invite" // sostituisci con il tuo
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 transition"
        >
          Apri Discord
        </a>
      </div>
    </section>
  );
}
