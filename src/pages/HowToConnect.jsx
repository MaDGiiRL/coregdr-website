// src/pages/HowToConnect.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useMotionValue } from "framer-motion";
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
  Instagram,
  Twitter,
  Youtube,
  Globe,
  MessageCircle,
  Music2,
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
// SOCIAL (clean + professional)
// -------------------------
const socialLinks = [
  {
    id: "discord",
    name: "Discord",
    href: "https://discord.gg/tuo-invite",
    Icon: MessageCircle,
  },
  {
    id: "website",
    name: "Sito",
    href: "https://tuo-sito.it",
    Icon: Globe,
  },
  {
    id: "instagram",
    name: "Instagram",
    href: "https://instagram.com/tuo-profilo",
    Icon: Instagram,
  },
  {
    id: "tiktok",
    name: "TikTok",
    href: "https://www.tiktok.com/@tuo-profilo",
    Icon: Music2,
  },
  ,
  {
    id: "youtube",
    name: "YouTube",
    href: "https://youtube.com/@tuo-canale",
    Icon: Youtube,
  },
];

const SocialContacts = () => {
  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            contatti
          </p>
          <h3 className="text-lg md:text-xl font-semibold">
            Seguici e contattaci
          </h3>
        </div>

        <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-xl">
          Per supporto veloce usa Discord. Per novità e contenuti, seguici sui
          social.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {socialLinks.map(({ id, name, href, Icon }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="
              group relative overflow-hidden
              rounded-2xl border border-[var(--color-border)]
              bg-white/5
              px-4 py-3
              transition-colors duration-300
              hover:border-[rgba(53,210,255,0.45)]
              hover:bg-white/[0.07]
            "
          >
            {/* ring gradient animato (subtle, no zoom) */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(120deg, rgba(111,47,217,0.0), rgba(53,210,255,0.35), rgba(111,47,217,0.0))",
                filter: "blur(10px)",
              }}
              animate={{ x: ["-30%", "30%", "-30%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex items-center gap-3">
              <div
                className="
                  h-10 w-10 rounded-xl
                  border border-white/10
                  bg-[linear-gradient(135deg,rgba(111,47,217,0.22),rgba(53,210,255,0.18))]
                  flex items-center justify-center
                  text-white
                "
              >
                <Icon className="h-5 w-5 text-[var(--color-accent-cool)]" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {name}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                  Apri link esterno
                </p>
              </div>

              <ArrowRight className="ml-auto h-4 w-4 text-[var(--color-text-muted)] group-hover:text-white/80 transition-colors" />
            </div>

            {/* underline soft */}
            <div className="relative z-10 mt-3 h-px w-full bg-white/10">
              <div className="h-px w-0 bg-[var(--color-accent-cool)]/60 group-hover:w-full transition-all duration-500" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

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
  const [isPaused, setIsPaused] = useState(false);

  // ✅ come Home: scroll progress per CityRunner
  const scrollAreaRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollAreaRef,
    offset: ["start start", "end start"],
  });

  // -------------------------
  // DRAGGABLE CAROUSEL (NO LOOP)
  // -------------------------
  const trackRef = useRef(null);
  const contentRef = useRef(null);

  const x = useMotionValue(0);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });

  // Calcola bounds reali: puoi trascinare solo finché c'è contenuto
  useEffect(() => {
    const calc = () => {
      const track = trackRef.current;
      const content = contentRef.current;
      if (!track || !content) return;

      const trackW = track.getBoundingClientRect().width;
      const contentW = content.scrollWidth;

      // se contenuto <= track, niente drag utile
      if (contentW <= trackW) {
        setDragBounds({ left: 0, right: 0 });
        x.set(0);
        return;
      }

      // x va da 0 (inizio) a -(contentW - trackW) (fine)
      const left = -(contentW - trackW);
      const right = 0;
      setDragBounds({ left, right });

      // clamp posizione corrente se stai ridimensionando
      const cur = x.get();
      if (cur < left) x.set(left);
      if (cur > right) x.set(right);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [x]);

  // (opzionale) se vuoi “pausa” anche in mobile scroll, tienilo
  const desktopHint = useMemo(
    () => (
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4" />
        Trascina il carosello con il mouse (o trackpad) per scorrere.
      </p>
    ),
    []
  );

  return (
    <div className="relative overflow-x-hidden">
      {/* ✅ Sfondo City Runner sotto (z-0) */}
      <CityRunnerBackground navHeight={70} scrollYProgress={scrollYProgress} />

      {/* ✅ Contenuto sopra (z-10) */}
      <section
        ref={scrollAreaRef}
        className="relative z-10 space-y-6"
        style={{ zIndex: 10 }}
      >
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

          {/* MOBILE: scroll nativo */}
          <div className="md:hidden relative">
            <div className="relative mt-6 overflow-hidden">
              <div
                className="flex items-stretch gap-4 overflow-x-auto pb-4 snap-x snap-mandatory pr-6"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="snap-center shrink-0 w-[88%] max-w-[88%]"
                  >
                    <StepCard step={step} />
                  </div>
                ))}
              </div>

              <p className="mt-1 text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Scorri a destra/sinistra per vedere i passaggi.
              </p>
            </div>
          </div>

          {/* DESKTOP: draggable */}
          <div className="relative mt-8 hidden md:block">
            <div
              ref={trackRef}
              className="
                overflow-hidden
                rounded-3xl
                border border-[var(--color-border)]
                bg-white/0
              "
            >
              <motion.div
                ref={contentRef}
                className="flex items-stretch gap-6 p-4"
                style={{ x, cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
                drag="x"
                dragConstraints={dragBounds}
                dragElastic={0.06}
                dragMomentum={true}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {steps.map((step) => (
                  <div key={step.id} className="min-w-[340px] lg:min-w-[380px]">
                    <StepCard step={step} />
                  </div>
                ))}
              </motion.div>
            </div>

            {desktopHint}
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

          {/* SOCIAL */}
          <SocialContacts />
        </div>
      </section>
    </div>
  );
}
