import { motion } from "framer-motion";
import { Search, Briefcase, Info, UsersRound } from "lucide-react";

export default function BackgroundQueueFilters({
  view,
  setView,
  filteredCount,
  usersFilteredCount,
  statsLoading,
  isAdmin,
  jobOptions,
  shellCard,
  reduce,
  q,
  setQ,
  filter,
  setFilter,
  jobFilter,
  setJobFilter,
  setEditMode,
}) {
  return (
    <div className={`${shellCard} p-5 md:p-6 -mt-6`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "backgrounds", label: "Background", icon: Info },
              { id: "users", label: "Utenti", icon: UsersRound },
            ].map((t) => {
              const Icon = t.icon;
              const active = view === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.985 }}
                  onClick={() => setView(t.id)}
                  className={`px-3.5 py-2 rounded-2xl border transition inline-flex items-center gap-2 text-xs md:text-sm ${
                    active
                      ? "bg-white/5 border-[var(--violet-soft)] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.25)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">{t.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="md:ml-auto text-[11px] text-[var(--color-text-muted)]">
            {view === "backgrounds"
              ? `${filteredCount} background`
              : `${usersFilteredCount} utenti`}
            {statsLoading ? " • stats..." : ""}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                view === "users"
                  ? "Cerca (Discord, Discord ID, job...)"
                  : "Cerca (nome, cognome, Discord ID, job...)"
              }
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs md:text-sm outline-none focus:border-[var(--blue)]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="whitespace-nowrap text-[11px] text-[var(--color-text-muted)]">
              Stato
            </span>

            <div className="inline-flex rounded-2xl border border-[var(--color-border)] bg-black/20 p-1 overflow-x-auto whitespace-nowrap">
              {[
                { id: "all", label: "Tutti", cls: "text-white/90" },
                { id: "pending", label: "In attesa", cls: "text-yellow-200" },
                { id: "approved", label: "Approvati", cls: "text-emerald-200" },
                { id: "rejected", label: "Rifiutati", cls: "text-rose-200" },
              ].map((s) => {
                const active = filter === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFilter(s.id);
                      setEditMode(false);
                    }}
                    className={`whitespace-nowrap px-4 mx-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-white/5 border border-white/10"
                        : "hover:bg-white/5"
                    } ${s.cls}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isAdmin && (
            <div className="relative w-full lg:w-[320px] shrink-0">
              <Briefcase className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs md:text-sm outline-none focus:border-[var(--blue)]"
              >
                {jobOptions.map((j) => (
                  <option key={j.norm} value={j.norm}>
                    {j.display}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            <span className="px-2 py-1 rounded-full border border-[var(--color-border)] bg-black/20">
              Tip: usa Discord ID
            </span>
            <span className="px-2 py-1 rounded-full border border-[var(--color-border)] bg-black/20">
              Tip: cerca “pending / approved / rejected”
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Filtri compatti • scroll orizzontale su mobile
          </div>
        </div>
      </div>
    </div>
  );
}
