export default function StickySubmitBar({ submitStatus, isSubmitting }) {
  return (
    <div className="sticky bottom-3 z-10">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/85 backdrop-blur px-4 py-3 shadow-[0_16px_70px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-xs text-[var(--color-text-muted)]">
          {submitStatus === "ok" ? (
            <span className="text-green-400 font-semibold">
              ✅ Inviato correttamente
            </span>
          ) : submitStatus === "error" ? (
            <span className="text-rose-400 font-semibold">
              ❌ Errore durante l’invio
            </span>
          ) : (
            <span>Controlla i dati prima di inviare.</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-[var(--violet)] text-white font-semibold disabled:opacity-50 hover:brightness-110 transition"
        >
          {isSubmitting ? "Invio in corso..." : "Invia background"}
        </button>
      </div>
    </div>
  );
}
