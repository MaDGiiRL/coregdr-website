import { motion } from "framer-motion";
import { Briefcase, Save, Trash2 } from "lucide-react";

export default function JobEditor({
  canEditJob,
  jobSaving,
  jobDraft,
  setJobDraft,
  saveJob,
  clearJob,
  reduce,
}) {
  return (
    <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
      <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-[var(--color-text-muted)]" />
        Job (Gruppo)
      </h3>

      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <input
          value={jobDraft}
          onChange={(e) => setJobDraft(e.target.value)}
          disabled={!canEditJob || jobSaving}
          placeholder="Inserisci job (es. Polizia, Meccanico...)"
          className="flex-1 px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-[#111326] text-sm outline-none focus:border-[var(--blue)] disabled:opacity-50"
        />

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.97 }}
            onClick={saveJob}
            disabled={!canEditJob || jobSaving}
            className="px-4 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {jobSaving ? "Salvataggio..." : "Salva job"}
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.97 }}
            onClick={clearJob}
            disabled={!canEditJob || jobSaving}
            className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-2"
            title="Rimuovi job"
          >
            <Trash2 className="w-4 h-4" />
            Togli job
          </motion.button>
        </div>
      </div>
    </section>
  );
}
