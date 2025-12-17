import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useMotionValue } from "framer-motion";
import { ArrowLeftRight, Sparkles } from "lucide-react";

import CityRunnerBackground from "../../components/backgrounds/scroll_home/CityRunnerBackground";

import { steps } from "../../components/connect/steps";
import StepCard from "../../components/connect/StepCard";
import SocialContacts from "../../components/connect/SocialContacts";
import DesktopHint from "../../components/connect/DesktopHint";
import FinalHelpBox from "../../components/connect/FinalHelpBox";

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
  const desktopHint = useMemo(() => <DesktopHint />, []);

  return (
    <div className="relative overflow-x-hidden">
      {/* ✅ Sfondo City Runner sotto (z-0) */}
      <CityRunnerBackground
        navHeight={70}
        scrollYProgress={scrollYProgress}
        showStats
      />

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
          <FinalHelpBox />

          {/* SOCIAL */}
          <SocialContacts />
        </div>
      </section>
    </div>
  );
}
