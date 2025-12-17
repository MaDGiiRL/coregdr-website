export default function CharacterSidebar({
  shellCard,
  characters,
  activeCharacter,
  statusCardClass,
  statusLabels,
  canCreateNewBg,
  pgMax,
  onSelect,
  onNewBackground,
}) {
  return (
    <aside className="lg:col-span-4 xl:col-span-3">
      <div className={`${shellCard} p-3 space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">I tuoi personaggi</h2>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {characters.length} BG
          </span>
        </div>

        <p className="text-[11px] text-[var(--color-text-muted)]">
          Seleziona un personaggio per vedere il background.
        </p>

        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {characters.map((pg) => {
            const isActive = activeCharacter?.id === pg.id;

            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => onSelect(pg)}
                className={statusCardClass(pg.status, isActive)}
                title={`Stato: ${statusLabels[pg.status] ?? "—"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">
                    {pg.nome} {pg.cognome}
                  </span>
                </div>

                <p className="mt-1 text-[10px] opacity-80">
                  Creato il{" "}
                  {new Date(pg.created_at).toLocaleString("it-IT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>

                <p className="mt-1 text-[10px] opacity-80">
                  Stato: {statusLabels[pg.status] ?? "—"}
                </p>
              </button>
            );
          })}

          {characters.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)] px-2 py-2">
              Nessun personaggio creato. Invia un background dal form dedicato
              per iniziare.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!canCreateNewBg}
          onClick={onNewBackground}
          className={`w-full mt-1 px-3 py-2.5 rounded-2xl text-xs md:text-sm font-semibold shadow-md active:scale-95 transition ${
            canCreateNewBg
              ? "bg-[var(--violet)] text-white hover:brightness-110"
              : "bg-black/20 text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed opacity-70"
          }`}
        >
          + Nuovo background
        </button>

        {!canCreateNewBg && (
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Slot: {characters.length}/{pgMax}
          </p>
        )}
      </div>
    </aside>
  );
}
