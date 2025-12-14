// src/pages/HowToConnect.jsx
import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import {
  ShoppingCart,
  Download,
  PlugZap,
  TerminalSquare,
  Users,
  ClipboardCheck,
  UserPlus,
  ArrowLeftRight,
  Info,
  ArrowRight,
  Sparkles,
  LifeBuoy,
  Github,
  Twitter,
  Instagram,
  Facebook,
} from "lucide-react";

import CityRunnerBackground from "../components/backgrounds/scroll_home/CityRunnerBackground";

// -------------------------
// DATA
// -------------------------
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
    buttonHref: "fivem://connect/tuo-ip-o-endpoint-qui",
    code: "fivem://connect/tuo-ip-o-endpoint-qui",
  },
  {
    id: 4,
    title: "ENTRA NEL DISCORD",
    description:
      "Una volta in game e/o prima di entrare, unisciti al nostro Discord per regolamento, annunci, ticket e whitelist.",
    buttonLabel: "DISCORD",
    buttonHref: "https://discord.gg/tuo-invite",
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

const stepIcon = (id) => {
  switch (id) {
    case 1:
      return ShoppingCart;
    case 2:
      return Download;
    case 3:
      return PlugZap;
    case 4:
      return Users;
    case 5:
      return ClipboardCheck;
    case 6:
      return UserPlus;
    default:
      return Sparkles;
  }
};

// -------------------------
// Social Contacts Section
// -------------------------
const socialLinks = [
  {
    id: 1,
    name: "GitHub",
    href: "https://github.com/tuo-profilo",
    icon: <Github />,
  },
  {
    id: 2,
    name: "Twitter",
    href: "https://twitter.com/tuo-profilo",
    icon: <Twitter />,
  },
  {
    id: 3,
    name: "Instagram",
    href: "https://instagram.com/tuo-profilo",
    icon: <Instagram />,
  },
  {
    id: 4,
    name: "Facebook",
    href: "https://facebook.com/tuo-profilo",
    icon: <Facebook />,
  },
];

const SocialContacts = () => (
  <div className="mt-8 text-center">
    <h3 className="text-xl font-semibold text-[var(--color-text-muted)]">
      Contattaci sui Social
    </h3>
    <div className="flex justify-center gap-6 mt-4">
      {socialLinks.map((social) => (
        <a
          key={social.id}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg transition-transform transform hover:scale-110"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50 rounded-full animate-pulse"></div>
          <div className="z-10">{social.icon}</div>
        </a>
      ))}
    </div>
  </div>
);

// -------------------------
// UI
// -------------------------
const StepCard = ({ step }) => {
  const Icon = stepIcon(step.id);

  return (
    <article
      className="
        h-[380px] md:h-[400px] lg:h-[420px]
        rounded-3xl border border-[var(--color-border)]
        bg-[var(--color-surface)]/90
        px-6 py-6 md:px-7 md:py-7
        flex flex-col
        transition-colors duration-300
        hover:border-[var(--color-accent-cool)]
        hover:bg-[rgba(31,33,64,0.98)]
        hover:shadow-[0_0_10px_rgba(53,210,255,0.35)]
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="
              h-10 w-10 md:h-11 md:w-11
              rounded-full flex items-center justify-center shrink-0
              bg-[radial-gradient(circle_at_top,var(--violet-light),var(--violet))]
              text-white shadow-[0_0_18px_rgba(111,47,217,0.6)]
            "
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 mt-4">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              <Sparkles className="h-3.5 w-3.5 opacity-80" />
              Step {step.id}
            </p>
          </div>
        </div>

        <a
          href={step.buttonHref}
          target={step.buttonHref.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="
            hidden sm:inline-flex items-center gap-2
            px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold
            bg-[linear-gradient(135deg,var(--violet),var(--blue))]
            text-white shadow-md hover:brightness-110 active:scale-95
            whitespace-nowrap
          "
        >
          <ArrowRight className="h-4 w-4" />
          {step.buttonLabel}
        </a>
      </div>

      <h2 className="mt-4 pl-1 text-base md:text-lg font-semibold leading-snug flex items-start gap-2">
        <Info className="h-5 w-5 mt-[2px] text-[var(--color-text-muted)]" />
        <span className="min-w-0">{step.title}</span>
      </h2>

      <div className="mt-5 h-px w-full bg-white/10" />

      <div className="mt-5 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1 space-y-4">
          <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
            {step.description}
          </p>

          {step.code && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                <TerminalSquare className="h-4 w-4" />
                Comando console
              </p>
              <pre className="p-3 rounded-2xl bg-black/40 text-[11px] md:text-xs text-[var(--color-accent-cool)] overflow-x-auto border border-white/10">
                {step.code}
              </pre>
              <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                <PlugZap className="h-4 w-4 opacity-80" />
                Suggerimento: apri FiveM → premi{" "}
                <span className="font-semibold">F8</span> → incolla → invio.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-5">
        <a
          href={step.buttonHref}
          target={step.buttonHref.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="
            sm:hidden inline-flex items-center gap-2
            px-5 py-2.5 rounded-full text-sm font-semibold
            bg-[linear-gradient(135deg,var(--violet),var(--blue))]
            text-white shadow-md hover:brightness-110 active:scale-95
          "
        >
          <ArrowRight className="h-4 w-4" />
          {step.buttonLabel}
        </a>
      </div>
    </article>
  );
};

export default function HowToConnect() {
  const loopedSteps = [...steps, ...steps];
  const [isPaused, setIsPaused] = useState(false);

  // ✅ come Home: scroll progress per CityRunner
  const scrollAreaRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollAreaRef,
    offset: ["start start", "end start"],
  });

  return (
    <div className="relative overflow-x-hidden">
      {/* ✅ Sfondo City Runner sotto (z-0) */}
      <CityRunnerBackground navHeight={70} scrollYProgress={scrollYProgress} />

      {/* ✅ Contenuto sopra (z-10) */}
      <section ref={scrollAreaRef} className="relative z-10 space-y-6">
        <div className="pt-6 space-y-6">
          <header className="space-y-3 relative">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl border border-[var(--color-border)] bg-white/5 p-2">
                <Sparkles className="h-5 w-5 text-[var(--color-accent-cool)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">
                  Come connettersi al server
                </h1>
                <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
                  Segui questi passaggi per entrare su{" "}
                  <strong>Core Roleplay</strong> e ottenere passaporto,
                  whitelist e background approvato.
                </p>
              </div>
            </div>
          </header>

          {/* CAROSSELLO COME INIZIATO PRIMA... */}
          <div className="relative mt-8 overflow-hidden hidden md:block">
            <motion.div
              className="flex items-stretch gap-4 md:gap-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: isPaused ? 120 : 30,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
            >
              {loopedSteps.map((step, index) => (
                <div
                  key={`${step.id}-${index}`}
                  className="min-w-[280px] md:min-w-[340px] lg:min-w-[380px]"
                >
                  <StepCard step={step} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* BOX FINALE */}
          <div className="mt-2 text-xs md:text-sm text-[var(--color-text-muted)] p-4 rounded-2xl border border-[var(--color-border)] bg-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative">
            <div className="flex items-start gap-2">
              <LifeBuoy className="h-4 w-4 mt-0.5 text-[var(--color-accent-cool)]" />
              <div>
                Se riscontri problemi di connessione o con la whitelist, apri un
                ticket sul <strong>Discord</strong> e specifica screenshot e
                orario del problema.
              </div>
            </div>

            <a
              href="https://discord.gg/tuo-invite"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 transition"
            >
              <Users className="h-4 w-4" />
              Apri Discord
            </a>
          </div>

          {/* Sezione Social */}
          <SocialContacts />
        </div>
      </section>
    </div>
  );
}
