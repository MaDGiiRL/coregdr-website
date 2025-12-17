export default function ServerLogsTab({
  shellCard,
  reduce,
  filteredServerLogs,
  paginatedServerLogs,
  serverLogsPage,
  setServerLogsPage,
  serverLogsTotalPages,
  srvSearch,
  setSrvSearch,
  srvPluginFilter,
  setSrvPluginFilter,
  srvPluginOptions,
  srvTypeFilter,
  setSrvTypeFilter,
  srvTypeOptions,
  buildRangeLabel,
  Badge,
  srvVariant,
  icons,
  pageSize,
}) {
  const { Server, Search, Plug } = icons;

  return (
    <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Server className="w-5 h-5" />
            Log server
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
            Eventi dai plugin/risorse FiveM.
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {buildRangeLabel(filteredServerLogs.length, serverLogsPage, pageSize)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={srvSearch}
            onChange={(e) => setSrvSearch(e.target.value)}
            placeholder="Cerca testo (plugin/type/descrizione)..."
            className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div className="relative">
          <Plug className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={srvPluginFilter}
            onChange={(e) => setSrvPluginFilter(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
          >
            {srvPluginOptions.map((p) => (
              <option key={p} value={p}>
                {p === "ALL" ? "Tutti i plugin" : p}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Server className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={srvTypeFilter}
            onChange={(e) => setSrvTypeFilter(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
          >
            {srvTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "Tutti i type" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto">
        {paginatedServerLogs.map((l) => (
          <div
            key={l.id}
            className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Badge variant="srv_plugin" icon={Plug}>
                  {l.plugin}
                </Badge>
                <Badge variant={srvVariant(l.plugin_type)} icon={Server}>
                  {l.plugin_type}
                </Badge>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {new Date(l.createdAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <p className="mt-2 text-xs md:text-sm text-[var(--color-text)]">
              {l.description}
            </p>
          </div>
        ))}

        {paginatedServerLogs.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
            Nessun server log corrisponde ai filtri.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
        <button
          type="button"
          onClick={() => setServerLogsPage((p) => Math.max(1, p - 1))}
          disabled={serverLogsPage === 1}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Prev
        </button>
        <span>
          Pagina {serverLogsPage} / {serverLogsTotalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setServerLogsPage((p) => Math.min(serverLogsTotalPages, p + 1))
          }
          disabled={serverLogsPage === serverLogsTotalPages}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
