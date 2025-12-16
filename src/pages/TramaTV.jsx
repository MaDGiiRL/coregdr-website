import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
  Tv2,
  Expand,
  Volume2,
  Power,
} from "lucide-react";

import logo from "../assets/img/logo.png"; // ✅ brand CORE

const ACTS = [
  {
    id: 1,
    label: "CORE — PRIMO ATTO",
    unlocked: true,
    src: "/videos/atto1.mp4",
    poster: "/videos/poster-atto1.jpg",
  },
  {
    id: 2,
    label: "CORE — SECONDO ATTO",
    unlocked: false,
    src: "/videos/atto2.mp4",
    poster: "/videos/poster-atto2.jpg",
  },
  {
    id: 3,
    label: "CORE — TERZO ATTO",
    unlocked: false,
    src: "/videos/atto3.mp4",
    poster: "/videos/poster-atto3.jpg",
  },
];

function clampIndex(i, len) {
  const m = ((i % len) + len) % len;
  return m;
}

export default function TramaTV() {
  const reduce = useReducedMotion();
  const acts = useMemo(() => ACTS, []);
  const [idx, setIdx] = useState(0);
  const act = acts[idx];

  const [open, setOpen] = useState(false);

  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef(null);

  const [videoKey, setVideoKey] = useState(0);

  const go = (dir) => {
    const next = clampIndex(idx + dir, acts.length);
    if (next === idx) return;

    setSwitching(true);
    setIdx(next);
    setVideoKey((k) => k + 1);

    if (switchTimer.current) clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(
      () => setSwitching(false),
      reduce ? 120 : 220
    );
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, reduce]);

  useEffect(() => {
    return () => {
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, []);

  const overlayAnim = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.14 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  };

  const modalAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
    exit: {
      opacity: 0,
      y: reduce ? 0 : 10,
      scale: reduce ? 1 : 0.98,
      transition: { duration: 0.14 },
    },
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* HEADER */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] bg-white/5 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            <Tv2 className="w-4 h-4 text-[var(--color-accent-cool)]" />
            Trama — Canali
          </div>
          <h1 className="mt-4 text-2xl md:text-4xl font-semibold tracking-tight">
            {act.label}
          </h1>
          <p className="mt-2 text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
            Frecce per cambiare canale. Click sullo schermo = play/pausa (audio
            incluso). Per ingrandire usa il bottone.
          </p>
        </header>

        {/* TV WRAP */}
        <div className="relative flex items-center justify-center">
          {/* left arrow */}
          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.95 }}
            onClick={() => go(-1)}
            className="hidden md:inline-flex absolute left-0 -translate-x-1/2 h-14 w-14 rounded-3xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition shadow-[0_18px_60px_rgba(0,0,0,0.55)] items-center justify-center"
            aria-label="Canale precedente"
          >
            <ChevronLeft className="w-7 h-7" />
          </motion.button>

          {/* TV + MODALE (CONFINATA NEL BOX) */}
          <div className="w-full max-w-[1040px] relative overflow-hidden rounded-[56px]">
            <TV
              key={`tv-${idx}-${videoKey}`}
              act={act}
              switching={switching}
              brandLogo={logo}
              onRequestFullscreen={() => {
                if (act.unlocked) setOpen(true);
              }}
            />

            {/* MODALE: UNA SOLA, DENTRO LA TV */}
            <AnimatePresence>
              {open && (
                <>
                  {/* overlay dentro il box */}
                  <motion.button
                    {...overlayAnim}
                    className="absolute inset-0 z-[90] bg-black/80"
                    onClick={() => setOpen(false)}
                    aria-label="Chiudi"
                    type="button"
                  />

                  {/* contenuto modale dentro il box */}
                  <motion.div
                    {...modalAnim}
                    className="absolute inset-0 z-[91] p-3 md:p-5"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="h-full w-full flex flex-col">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                            Visione
                          </p>
                          <p className="mt-0.5 font-semibold truncate">
                            {act.label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center"
                          aria-label="Chiudi"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* “schermo ingrandito” (solo video) */}
                      <div className="flex-1 min-h-0 rounded-[34px] overflow-hidden border border-white/10 bg-black relative">
                        <ZoomScreen act={act} />
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* mobile arrows */}
            <div className="mt-6 flex md:hidden items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
              <span className="opacity-75">
                Canale {idx + 1} / {acts.length}
              </span>
              <span className="opacity-75">← / → per cambiare</span>
            </div>
          </div>

          {/* right arrow */}
          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.95 }}
            onClick={() => go(1)}
            className="hidden md:inline-flex absolute right-0 translate-x-1/2 h-14 w-14 rounded-3xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition shadow-[0_18px_60px_rgba(0,0,0,0.55)] items-center justify-center"
            aria-label="Canale successivo"
          >
            <ChevronRight className="w-7 h-7" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}

/* =========================
   ZOOM SCREEN (solo video, controlli ON)
========================= */
function ZoomScreen({ act }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // prova autoplay (può fallire su alcuni browser se non c'è gesto utente)
    v.play().catch(() => {});
  }, [act?.src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover bg-black"
      src={act.src}
      poster={act.poster}
      controls
      autoPlay
      muted={false}
      playsInline
      preload="metadata"
    />
  );
}

/* =========================
   TV COMPONENT
   - Click sullo schermo = play/pause (audio ON)
========================= */
function TV({ act, switching, onRequestFullscreen, brandLogo }) {
  const reduce = useReducedMotion();
  const videoRef = useRef(null);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      if (v.paused) await v.play(); // gesto utente -> audio ok
      else v.pause();
    } catch {
      // ignora
    }
  };

  return (
    <div className="relative">
      {/* “TV shell” */}
      <div
        className={[
          "relative rounded-[56px] border border-white/10 overflow-hidden",
          "bg-[linear-gradient(180deg,#1b1d3f,#0b0c1a)]",
        ].join(" ")}
      >
        {/* bevel / frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_bottom,rgba(0,0,0,0.8),transparent_55%)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_20px_40px_rgba(0,0,0,0.35),inset_0_-20px_40px_rgba(0,0,0,0.55)]" />
        </div>

        {/* TOP BAR */}
        <div className="relative px-6 md:px-8 pt-6 md:pt-7">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl border border-white/10 bg-black/25 grid place-items-center overflow-hidden">
                <img
                  src={brandLogo}
                  alt="CORE"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  CORE TELEVISION
                </p>
                <p className="text-sm md:text-base font-semibold truncate">
                  {act.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => act.unlocked && onRequestFullscreen?.()}
                disabled={!act.unlocked}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition text-xs font-semibold disabled:opacity-40"
                aria-label="Clicca per ingrandire"
                title="Clicca per ingrandire"
              >
                <Expand className="w-4 h-4" />
                Clicca per ingrandire
              </button>

              <div className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-[11px] text-[var(--color-text-muted)]">
                <Volume2 className="w-4 h-4" />
                Audio ON
              </div>
            </div>
          </div>

          {/* SCREEN (click = play/pause) */}
          <button
            type="button"
            onClick={() => {
              if (!act.unlocked) return;
              togglePlay();
            }}
            className={[
              "relative w-full rounded-[34px] overflow-hidden border border-white/10 bg-black",
              act.unlocked ? "cursor-pointer" : "cursor-not-allowed",
            ].join(" ")}
            aria-label={act.unlocked ? "Play/Pausa" : "Bloccato"}
          >
            {/* “glass” */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_top,rgba(53,210,255,0.14),transparent_55%)]" />
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_bottom,rgba(124,92,255,0.18),transparent_60%)]" />
              <div className="absolute -left-1/3 top-[-40%] h-[180%] w-[55%] rotate-12 opacity-22 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.26),transparent)]" />
              <div className="absolute inset-0 opacity-[0.10] bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.02)_1px,rgba(0,0,0,0)_3px)]" />
            </div>

            <motion.div
              animate={{
                filter: switching ? "blur(2px)" : "blur(0px)",
                opacity: switching ? 0.65 : 1,
              }}
              transition={{ duration: reduce ? 0.08 : 0.14 }}
              className="relative aspect-video"
            >
              <video
                ref={videoRef}
                className={[
                  "absolute inset-0 w-full h-full object-cover bg-black",
                  act.unlocked ? "" : "brightness-75 saturate-75 blur-[1px]",
                ].join(" ")}
                src={act.src}
                poster={act.poster}
                controls={false}
                autoPlay={false}
                muted={false}
                playsInline
                preload="metadata"
              />
            </motion.div>

            {!act.unlocked && (
              <div className="absolute inset-0 z-20 grid place-items-center">
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative z-10 text-center px-6">
                  <div className="mx-auto h-16 w-16 rounded-2xl border border-white/10 bg-white/5 grid place-items-center shadow-[0_0_30px_rgba(0,0,0,0.55)]">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                    Questo atto è bloccato
                  </p>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* LOWER PANEL */}
        <div className="relative px-6 md:px-8 pb-6 md:pb-7 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <div className="h-14 md:h-16 rounded-3xl border border-white/10 bg-black/25 overflow-hidden relative">
                <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:10px_10px]" />
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                <span>CORE AUDIO SYSTEM</span>
                <span className="opacity-70">STEREO</span>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-3">
              <div className="flex items-center gap-3">
                <div className="h-14 md:h-16 w-14 md:w-16 rounded-3xl border border-white/10 bg-black/25 grid place-items-center relative">
                  <div className="h-9 w-9 rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(0,0,0,0.25))]" />
                  <div className="absolute h-3 w-[2px] bg-white/30 rounded-full" />
                </div>

                <div className="h-14 md:h-16 w-24 md:w-28 rounded-3xl border border-white/10 bg-black/25 px-3 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    CH
                  </span>
                  <span className="text-base font-semibold">
                    {String(act.id).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="h-14 md:h-16 w-14 md:w-16 rounded-3xl border border-white/10 bg-black/25 grid place-items-center relative">
                <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.55)]" />
                <Power className="w-5 h-5 text-white/70" />
              </div>
            </div>
          </div>
        </div>

        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.55))]" />
      </div>

      {/* glow under TV */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-16 w-[70%] blur-3xl opacity-30 bg-[radial-gradient(circle_at_center,rgba(53,210,255,0.35),transparent_60%)]" />
    </div>
  );
}
