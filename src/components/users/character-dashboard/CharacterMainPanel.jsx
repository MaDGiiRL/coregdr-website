import { Lock, FileText, Printer, Pencil } from "lucide-react";

export default function CharacterMainPanel({
  shellCard,
  activeCharacter,
  user,
  isApproved,

  editModeUser,
  editDraftUser,
  setEditDraftUser,
  savingEditUser,

  statusLabels,
  statusPill,

  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPrint,
}) {
  return (
    <main className="lg:col-span-8 xl:col-span-9">
      {activeCharacter ? (
        <div className={`${shellCard} p-4 md:p-5 space-y-5`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Scheda personaggio
              </p>
              <h2 className="text-lg md:text-xl font-semibold truncate">
                {activeCharacter.nome} {activeCharacter.cognome}
              </h2>
            </div>

            <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--color-text-muted)]">
              <span
                className={`px-3 py-1 rounded-full border text-[10px] ${statusPill(
                  activeCharacter.status
                )}`}
              >
                {statusLabels[activeCharacter.status]}
              </span>
              <span>
                Proprietario:{" "}
                <span className="font-medium">{user.discordName}</span>
              </span>
            </div>
          </div>

          {isApproved && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 text-emerald-300" />
                <div>
                  <p className="font-semibold text-emerald-200">
                    Background approvato – bloccato
                  </p>
                  <p className="text-xs text-emerald-200/80">
                    Questo background non può più essere modificato.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs md:text-sm">
            <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-3">
              <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                II. Storia del personaggio
              </h3>

              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                  Storia in breve
                </p>

                {editModeUser ? (
                  <textarea
                    disabled={savingEditUser || isApproved}
                    className="w-full min-h-[110px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
                    value={editDraftUser.storiaBreve}
                    onChange={(e) =>
                      setEditDraftUser((prev) => ({
                        ...prev,
                        storiaBreve: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <p className="text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                    {activeCharacter.storia_breve || "-"}
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2 text-xs md:text-sm">
            {!editModeUser ? (
              <button
                type="button"
                onClick={onStartEdit}
                disabled={isApproved}
                className="px-4 py-2 rounded-full font-semibold bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Modifica background
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  disabled={savingEditUser || isApproved}
                  className="px-4 py-2 rounded-full font-semibold bg-[var(--violet)] text-white shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {savingEditUser
                    ? "Salvataggio..."
                    : "Salva modifiche (torna in revisione)"}
                </button>

                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={savingEditUser}
                  className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50"
                >
                  Annulla
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onPrint}
              disabled={!activeCharacter || savingEditUser}
              className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Stampa
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          Nessun personaggio selezionato.
        </p>
      )}
    </main>
  );
}
