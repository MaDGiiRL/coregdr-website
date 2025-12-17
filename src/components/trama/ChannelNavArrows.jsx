import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChannelNavArrows({ reduce, onPrev, onNext }) {
  return (
    <>
      {/* left arrow */}
      <motion.button
        type="button"
        whileTap={{ scale: reduce ? 1 : 0.95 }}
        onClick={onPrev}
        className="hidden md:inline-flex absolute left-0 -translate-x-1/2 h-14 w-14 rounded-3xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition shadow-[0_18px_60px_rgba(0,0,0,0.55)] items-center justify-center"
        aria-label="Canale precedente"
      >
        <ChevronLeft className="w-7 h-7" />
      </motion.button>

      {/* right arrow */}
      <motion.button
        type="button"
        whileTap={{ scale: reduce ? 1 : 0.95 }}
        onClick={onNext}
        className="hidden md:inline-flex absolute right-0 translate-x-1/2 h-14 w-14 rounded-3xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition shadow-[0_18px_60px_rgba(0,0,0,0.55)] items-center justify-center"
        aria-label="Canale successivo"
      >
        <ChevronRight className="w-7 h-7" />
      </motion.button>
    </>
  );
}
