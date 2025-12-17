import { Search } from "lucide-react";

export default function StaffFilters({ filters, active, setActive, q, setQ }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = active === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={`px-3 py-2 rounded-xl border text-xs md:text-sm transition ${
                isActive
                  ? "bg-[var(--color-surface)] border-[var(--color-accent-cool)] text-[var(--color-accent-cool)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="relative w-full md:w-[320px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome o ruolo…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111326] border border-[var(--color-border)] text-sm"
        />
      </div>
    </div>
  );
}
