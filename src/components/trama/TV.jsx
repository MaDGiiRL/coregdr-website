import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Volume2, Power } from "lucide-react";

export default function TV({ act, switching, onRequestFullscreen, brandLogo }) {
  const reduce = useReducedMotion();
  const videoRef = useRef(null);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      if (v.paused) await v.play();
      else v.pause();
    } catch {
      // ignora
    }
  };

  return (
    <div className="relative">
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
