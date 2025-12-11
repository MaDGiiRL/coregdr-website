// src/pages/admin/BackgroundQueue.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABELS = {
  pending: "In attesa",
  approved: "Approvato",
  rejected: "Rifiutato",
};

const STATUS_COLORS = {
  pending: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
  approved: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  rejected: "bg-red-400/15 text-red-300 border-red-400/40",
};

export default function BackgroundQueue() {
  const { profile, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionDraft, setRejectionDraft] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState({
    storiaBreve: "",
    condannePenali: "",
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });

  const canModerate = profile?.is_admin || profile?.is_moderator;
  const isAdmin = !!profile?.is_admin;

  const loadBackgrounds = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select(
          `
          id,
          user_id,
          status,
          nome,
          cognome,
          sesso,
          stato_nascita,
          etnia,
          data_nascita,
          storia_breve,
          condanne_penali,
          patologie,
          dipendenze,
          segni_distintivi,
          aspetti_caratteriali,
          rejection_reason,
          created_at,
          updated_at,
          profiles:profiles!characters_user_id_fkey (
            discord_username,
            discord_id
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching backgrounds", error);
        return;
      }

      const mapped =
        data?.map((row) => ({
          id: row.id,
          userId: row.user_id,
          discordName: row.profiles?.discord_username ?? "Senza nome",
          discordId: row.profiles?.discord_id ?? "",
          nome: row.nome ?? "",
          cognome: row.cognome ?? "",
          status: row.status ?? "pending",
          submittedAt: row.created_at,
          lastUpdatedAt: row.updated_at,
          rejectionReason: row.rejection_reason ?? "",
          data: {
            sesso: row.sesso ?? "",
            statoNascita: row.stato_nascita ?? "",
            etnia: row.etnia ?? "",
            dataNascita: row.data_nascita ?? "",
            storiaBreve: row.storia_breve ?? "",
            condannePenali: row.condanne_penali ?? "",
            patologie: Array.isArray(row.patologie) ? row.patologie : [],
            dipendenze: Array.isArray(row.dipendenze) ? row.dipendenze : [],
            segniDistintivi: row.segni_distintivi ?? "",
            aspettiCaratteriali: row.aspetti_caratteriali ?? "",
          },
        })) ?? [];

      setItems(mapped);
      if (!mapped.find((i) => i.id === selectedId)) {
        setSelectedId(mapped[0]?.id ?? null);
      }
      setEditMode(false);
    } catch (err) {
      console.error("Error loading backgrounds", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!profile || !canModerate) return;
    loadBackgrounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const filtered = items.filter((item) =>
    filter === "all" ? true : item.status === filter
  );
  const selected =
    items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const handleSelect = (id) => {
    setSelectedId(id);
    setRejectionDraft("");
    setEditMode(false);
  };

  const writeLog = async ({ type, message, meta }) => {
    try {
      await supabase.from("logs").insert({
        type,
        message,
        meta: meta ? JSON.stringify(meta) : null,
      });
    } catch (err) {
      console.error("Error writing log", err);
    }
  };

  const updateStatus = async (id, status, reason = "") => {
    if (!canModerate) return;
    setUpdating(true);
    try {
      const payload = {
        status,
        updated_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? reason : null,
      };

      const { data, error } = await supabase
        .from("characters")
        .update(payload)
        .eq("id", id)
        .select(
          `
          id,
          nome,
          cognome,
          status,
          user_id,
          profiles:profiles!characters_user_id_fkey (
            discord_username,
            discord_id
          )
        `
        )
        .single();

      if (error) {
        console.error("Error updating background status", error);
        alert("Errore durante l'aggiornamento dello status.");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                rejectionReason:
                  status === "rejected" ? reason : item.rejectionReason,
                lastUpdatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      await writeLog({
        type: status === "approved" ? "BG_APPROVED" : "BG_REJECTED",
        message:
          status === "approved"
            ? `Background approvato per ${data.nome} ${data.cognome} (${
                data.profiles?.discord_username ?? "?"
              }).`
            : `Background rifiutato per ${data.nome} ${data.cognome} (${
                data.profiles?.discord_username ?? "?"
              }). Motivo: ${reason}`,
        meta: {
          character_id: data.id,
          status,
          moderator_id: profile?.id ?? null,
          user_id: data.user_id,
          discord_id: data.profiles?.discord_id ?? null,
        },
      });
    } catch (err) {
      console.error("Error updating background status", err);
      alert("Errore generico durante l'aggiornamento dello status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = () => {
    if (!selected) return;
    updateStatus(selected.id, "approved");
  };

  const handleReject = () => {
    if (!selected) return;
    if (!rejectionDraft.trim()) {
      alert("Inserisci una motivazione per il rifiuto.");
      return;
    }
    updateStatus(selected.id, "rejected", rejectionDraft.trim());
    setRejectionDraft("");
  };

  // ---- EDIT MODE (solo admin) ----
  const startEdit = () => {
    if (!selected || !isAdmin) return;
    setEditDraft({
      storiaBreve: selected.data.storiaBreve || "",
      condannePenali: selected.data.condannePenali || "",
      segniDistintivi: selected.data.segniDistintivi || "",
      aspettiCaratteriali: selected.data.aspettiCaratteriali || "",
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const saveEdit = async () => {
    if (!selected || !isAdmin) return;
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .update({
          storia_breve: editDraft.storiaBreve,
          condanne_penali: editDraft.condannePenali,
          segni_distintivi: editDraft.segniDistintivi,
          aspetti_caratteriali: editDraft.aspettiCaratteriali,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error saving BG edit", error);
        alert("Errore durante il salvataggio delle modifiche.");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                lastUpdatedAt: data.updated_at,
                data: {
                  ...item.data,
                  storiaBreve: data.storia_breve ?? "",
                  condannePenali: data.condanne_penali ?? "",
                  segniDistintivi: data.segni_distintivi ?? "",
                  aspettiCaratteriali: data.aspetti_caratteriali ?? "",
                },
              }
            : item
        )
      );

      await writeLog({
        type: "BG_EDITED_ADMIN",
        message: `Background modificato da admin per ${data.nome} ${data.cognome}.`,
        meta: {
          character_id: data.id,
          admin_id: profile?.id ?? null,
        },
      });

      setEditMode(false);
    } catch (err) {
      console.error("Error saving BG edit", err);
      alert("Errore generico durante il salvataggio.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessione...
      </p>
    );
  }

  if (!profile || !canModerate) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Non hai i permessi per moderare i background.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2 mb-2">
        <h2 className="text-xl md:text-2xl font-semibold">
          Moderazione background
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-3xl">
          Coda dei background (tabella <code>characters</code>). Admin e
          moderatori possono approvare/rifiutare; solo gli admin possono
          modificare il testo del BG.
        </p>
      </header>

      {loadingData ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Caricamento background…
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista BG */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/80 backdrop-blur p-3 space-y-3">
              {/* Filtri */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: "all", label: "Tutti" },
                  { id: "pending", label: "In attesa" },
                  { id: "approved", label: "Approvati" },
                  { id: "rejected", label: "Rifiutati" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFilter(f.id);
                      setEditMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs transition ${
                      filter === f.id
                        ? "bg-[var(--violet)] text-white border-[var(--violet-soft)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                <span>{filtered.length} background trovati</span>
                <button
                  type="button"
                  onClick={loadBackgrounds}
                  className="px-2 py-1 rounded-full border border-[var(--color-border)] hover:bg-white/5"
                >
                  Aggiorna
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto space-y-2 pt-1">
                {filtered.map((item) => {
                  const isActive = selected?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full text-left rounded-xl border px-3 py-3 text-xs md:text-sm transition flex flex-col gap-1 ${
                        isActive
                          ? "border-[var(--blue)] bg-[var(--color-surface)]"
                          : "border-[var(--color-border)] bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {item.nome} {item.cognome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] ${
                            STATUS_COLORS[item.status]
                          }`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--color-text-muted)]">
                        <span className="truncate">{item.discordName}</span>
                        <span>
                          Inviato:{" "}
                          {new Date(item.submittedAt).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nessun background con questo filtro.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Dettaglio BG selezionato */}
          <main className="lg:col-span-7 xl:col-span-8">
            {selected ? (
              <div className="border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/90 backdrop-blur p-4 md:p-5 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Background
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold">
                      {selected.nome} {selected.cognome}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {selected.discordName} • ID: {selected.discordId}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--color-text-muted)]">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] ${
                        STATUS_COLORS[selected.status]
                      }`}
                    >
                      {STATUS_LABELS[selected.status]}
                    </span>
                    <span>
                      Inviato:{" "}
                      {new Date(selected.submittedAt).toLocaleString("it-IT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <span>
                      Ultimo aggiornamento:{" "}
                      {new Date(selected.lastUpdatedAt).toLocaleString(
                        "it-IT",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        }
                      )}
                    </span>
                  </div>
                </div>

                {/* Sezioni BG */}
                <div className="space-y-4 text-xs md:text-sm">
                  {/* Dati anagrafici */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-1">
                    <h3 className="font-semibold text-sm md:text-base">
                      I. Dati anagrafici
                    </h3>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Nome:
                      </span>{" "}
                      {selected.nome} {selected.cognome}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Sesso:
                      </span>{" "}
                      {selected.data.sesso || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Stato di nascita:
                      </span>{" "}
                      {selected.data.statoNascita || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Etnia:
                      </span>{" "}
                      {selected.data.etnia || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Data di nascita:
                      </span>{" "}
                      {selected.data.dataNascita || "-"}
                    </p>
                  </section>

                  {/* Storia */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
                    <h3 className="font-semibold text-sm md:text-base">
                      II. Storia del personaggio
                    </h3>
                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Storia in breve
                      </p>
                      {editMode ? (
                        <textarea
                          className="w-full min-h-[90px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraft.storiaBreve}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              storiaBreve: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {selected.data.storiaBreve || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Condanne penali
                      </p>
                      {editMode ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraft.condannePenali}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              condannePenali: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {selected.data.condannePenali || "-"}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          Patologie
                        </p>
                        {selected.data.patologie?.length ? (
                          <ul className="list-disc list-inside text-[var(--color-text)]">
                            {selected.data.patologie.map((p, i) => (
                              <li key={i}>
                                {p.nome}{" "}
                                {p.inCura && (
                                  <span className="text-[10px] text-[var(--blue)]">
                                    (in cura)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[var(--color-text-muted)]">
                            Nessuna.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          Dipendenze
                        </p>
                        {selected.data.dipendenze?.length ? (
                          <ul className="list-disc list-inside text-[var(--color-text)]">
                            {selected.data.dipendenze.map((d, i) => (
                              <li key={i}>
                                {d.nome}{" "}
                                {d.inCura && (
                                  <span className="text-[10px] text-[var(--blue)]">
                                    (in cura)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[var(--color-text-muted)]">
                            Nessuna.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Caratteristiche */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
                    <h3 className="font-semibold text-sm md:text-base">
                      III. Caratteristiche del personaggio
                    </h3>
                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Segni distintivi
                      </p>
                      {editMode ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraft.segniDistintivi}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              segniDistintivi: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {selected.data.segniDistintivi || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Aspetti caratteriali
                      </p>
                      {editMode ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraft.aspettiCaratteriali}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              aspettiCaratteriali: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {selected.data.aspettiCaratteriali || "-"}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Zona esito / motivazione */}
                <div className="mt-4 border-t border-[var(--color-border)] pt-4 space-y-3">
                  <h3 className="text-sm font-semibold">
                    Esito e motivazioni (solo staff)
                  </h3>

                  {selected.status === "rejected" &&
                    selected.rejectionReason &&
                    !editMode && (
                      <div className="text-xs text-red-300 border border-red-500/40 bg-red-500/10 rounded-xl p-3">
                        <p className="font-semibold mb-1">
                          Motivazione rifiuto salvata:
                        </p>
                        <p className="whitespace-pre-line">
                          {selected.rejectionReason}
                        </p>
                      </div>
                    )}

                  {!editMode && (
                    <>
                      <textarea
                        className="w-full min-h-[90px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                        placeholder="Motivazione del rifiuto (visibile al player su Discord e nello storico esiti staff)..."
                        value={rejectionDraft}
                        onChange={(e) => setRejectionDraft(e.target.value)}
                      />

                      <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={updating}
                          className="px-4 py-2 rounded-full font-semibold bg-emerald-500/90 text-[#050816] shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          Approva
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={updating}
                          className="px-4 py-2 rounded-full font-semibold bg-red-500/90 text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          Rifiuta
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={startEdit}
                            disabled={updating}
                            className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                          >
                            Modifica BG
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {editMode && (
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={updating}
                        className="px-4 py-2 rounded-full font-semibold bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                      >
                        Salva modifiche
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={updating}
                        className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                      >
                        Annulla
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    I moderatori possono solo approvare o rifiutare i BG. La
                    modifica dei testi è riservata agli admin.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nessun background selezionato.
              </p>
            )}
          </main>
        </div>
      )}
    </section>
  );
}
