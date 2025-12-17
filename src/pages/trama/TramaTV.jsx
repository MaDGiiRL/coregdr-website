import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { ACTS, logo } from "../../components/trama/assets";
import { clampIndex } from "../../components/trama/utils";
import TramaHeader from "../../components/trama/TramaHeader";
import ChannelNavArrows from "../../components/trama/ChannelNavArrows";
import TVShell from "../../components/trama/TVShell";

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
        <TramaHeader act={act} />

        <div className="relative flex items-center justify-center">
          <ChannelNavArrows
            reduce={reduce}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
          />

          <TVShell
            idx={idx}
            videoKey={videoKey}
            act={act}
            actsLength={acts.length}
            switching={switching}
            reduce={reduce}
            open={open}
            setOpen={setOpen}
            overlayAnim={overlayAnim}
            modalAnim={modalAnim}
            brandLogo={logo}
            goPrev={() => go(-1)}
            goNext={() => go(1)}
          />
        </div>
      </div>
    </section>
  );
}
