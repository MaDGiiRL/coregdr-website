export default function LogsTab({
  shellCard,
  reduce,
  filteredLogs,
  paginatedLogs,
  logsPage,
  setLogsPage,
  logsTotalPages,
  logSearch,
  setLogSearch,
  logTypeFilter,
  setLogTypeFilter,
  logTypeOptions,
  buildRangeLabel,
  Badge,
  logVariant,
  icons,
  pageSize,
}) {
  const { Activity, Search } = icons;

  return (
    <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Log attività
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
            Eventi dalla tabella <code>logs</code>.
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {buildRangeLabel(filteredLogs.length, logsPage, pageSize)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Cerca nei log..."
            className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div className="relative">
          <Activity className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={logTypeFilter}
            onChange={(e) => setLogTypeFilter(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
          >
            {logTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "Tutti i type" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto">
        {paginatedLogs.map((l) => (
          <div
            key={l.id}
            className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant={logVariant(l.type)} icon={Activity}>
                {l.type}
              </Badge>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {new Date(l.createdAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <p className="mt-2 text-xs md:text-sm text-[var(--color-text)]">
              {l.message}
            </p>

            {l.meta?.author && (
              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                <span>Autore: </span>
                <span className="font-semibold">{l.meta.author}</span>
              </div>
            )}
          </div>
        ))}

        {paginatedLogs.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
            Nessun log corrisponde ai filtri.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
        <button
          type="button"
          onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
          disabled={logsPage === 1}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Prev
        </button>
        <span>
          Pagina {logsPage} / {logsTotalPages}
        </span>
        <button
          type="button"
          onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
          disabled={logsPage === logsTotalPages}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
