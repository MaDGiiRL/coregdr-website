import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TV from "./TV";
import TvModal from "./TVModal";

export default function TVShell({
  idx,
  videoKey,
  act,
  actsLength,
  switching,
  reduce,
  open,
  setOpen,
  overlayAnim,
  modalAnim,
  brandLogo,
  goPrev,
  goNext,
}) {
  return (
    <div className="w-full max-w-[1040px] relative overflow-hidden rounded-[56px]">
      <TV
        key={`tv-${idx}-${videoKey}`}
        act={act}
        switching={switching}
        brandLogo={brandLogo}
        onRequestFullscreen={() => {
          if (act.unlocked) setOpen(true);
        }}
      />

      {/* MODALE: UNA SOLA, DENTRO LA TV */}
      <TvModal
        open={open}
        setOpen={setOpen}
        act={act}
        overlayAnim={overlayAnim}
        modalAnim={modalAnim}
      />

      {/* mobile arrows */}
      <div className="mt-6 flex md:hidden items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="flex-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Prev
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-black/25 hover:bg-white/5 transition inline-flex items-center justify-center gap-2"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
        <span className="opacity-75">
          Canale {idx + 1} / {actsLength}
        </span>
        <span className="opacity-75">← / → per cambiare</span>
      </div>
    </div>
  );
}
