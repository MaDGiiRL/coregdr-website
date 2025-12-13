import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  Ban,
  Lock,
  Info,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  alertError,
  alertInfo,
  alertWarning,
  confirmAction,
  toast,
} from "../../lib/alerts";

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

const statusPill = (status) =>
  STATUS_COLORS[status] ??
  "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]";

export default function BackgroundQueue() {
  const { profile, loading } = useAuth();
  const reduce = useReducedMotion();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
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

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

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
        await alertError("Errore", "Impossibile caricare la coda background.");
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
      if (!mapped.find((i) => i.id === selectedId))
        setSelectedId(mapped[0]?.id ?? null);
      setEditMode(false);
    } catch (err) {
      console.error("Error loading backgrounds", err);
      await alertError("Errore", "Errore imprevisto nel caricamento dati.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!profile || !canModerate) return;
    loadBackgrounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        filter === "all" ? true : item.status === filter
      ),
    [items, filter]
  );

  const selected =
    items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const isLocked = selected?.status === "approved";

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
      toast("error", "Impossibile scrivere nei log");
    }
  };

  const updateStatus = async (id, status, reason = "") => {
    if (!canModerate) return;

    // ✅ BLOCCO TOTALE: se approved non si tocca più
    const current = items.find((x) => x.id === id);
    if (current?.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più essere modificato."
      );
      return;
    }

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
        console.error(error);
        await alertError(
          "Errore",
          "Errore durante l'aggiornamento dello stato."
        );
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

      toast(
        "success",
        status === "approved" ? "Background approvato" : "Background rifiutato"
      );
    } catch (err) {
      console.error(err);
      await alertError(
        "Errore",
        "Errore generico durante l'aggiornamento dello status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;

    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è già approvato e non può più essere modificato."
      );
      return;
    }

    const ok = await confirmAction({
      title: "Approvare il background?",
      text: `Stai per approvare il background di ${selected.nome} ${selected.cognome}.`,
      confirmText: "Sì, approva",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

    await updateStatus(selected.id, "approved");
  };

  const handleReject = async () => {
    if (!selected) return;

    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più essere rifiutato."
      );
      return;
    }

    if (!rejectionDraft.trim()) {
      await alertWarning(
        "Motivazione mancante",
        "Inserisci una motivazione per il rifiuto."
      );
      return;
    }

    const ok = await confirmAction({
      title: "Rifiutare il background?",
      text: `Stai per rifiutare il background di ${selected.nome} ${selected.cognome}.`,
      confirmText: "Sì, rifiuta",
      cancelText: "Annulla",
    });

    if (!ok) return;

    await updateStatus(selected.id, "rejected", rejectionDraft.trim());
    setRejectionDraft("");
  };

  const startEdit = async () => {
    if (!selected || !isAdmin) return;

    // ✅ BLOCCO TOTALE: se approved, niente edit admin
    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più essere modificato."
      );
      return;
    }

    const ok = await confirmAction({
      title: "Modificare il background?",
      text: "Entrerai in modalità modifica. Ricordati di salvare le modifiche.",
      confirmText: "Ok, modifica",
      cancelText: "Annulla",
      icon: "info",
    });

    if (!ok) return;

    setEditDraft({
      storiaBreve: selected.data.storiaBreve || "",
      condannePenali: selected.data.condannePenali || "",
      segniDistintivi: selected.data.segniDistintivi || "",
      aspettiCaratteriali: selected.data.aspettiCaratteriali || "",
    });
    setEditMode(true);
  };

  const cancelEdit = async () => {
    const ok = await confirmAction({
      title: "Annullare le modifiche?",
      text: "Le modifiche non salvate andranno perse.",
      confirmText: "Sì, annulla",
      cancelText: "Torna indietro",
    });

    if (!ok) return;

    setEditMode(false);
  };

  const saveEdit = async () => {
    if (!selected || !isAdmin) return;

    // ✅ BLOCCO TOTALE: se approved, niente save edit
    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più essere modificato."
      );
      setEditMode(false);
      return;
    }

    const ok = await confirmAction({
      title: "Salvare le modifiche?",
      text: "Le modifiche verranno salvate nel background.",
      confirmText: "Sì, salva",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

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
        console.error(error);
        await alertError("Errore", "Errore durante il salvataggio.");
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
        meta: { character_id: data.id, admin_id: profile?.id ?? null },
      });

      setEditMode(false);
      toast("success", "Modifiche salvate");
    } catch (err) {
      console.error(err);
      await alertError("Errore", "Errore generico durante il salvataggio.");
    } finally {
      setUpdating(false);
    }
  };

  const cardAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.15 } },
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
      {/* Header più “pro” */}
      <header className={`${shellCard} p-5 md:p-6 space-y-2`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Staff
            </p>
            <h2 className="text-xl md:text-2xl font-semibold">
              Moderazione background
            </h2>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.98 }}
            onClick={loadBackgrounds}
            className="px-3 py-2 rounded-full border border-[var(--color-border)] hover:bg-white/5 inline-flex items-center gap-2 text-xs"
            title="Aggiorna lista"
          >
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </motion.button>
        </div>

        {/* Filtri */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: "all", label: "Tutti" },
            { id: "pending", label: "In attesa" },
            { id: "approved", label: "Approvati" },
            { id: "rejected", label: "Rifiutati" },
          ].map((f) => (
            <motion.button
              key={f.id}
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.98 }}
              onClick={() => {
                setFilter(f.id);
                setEditMode(false);
              }}
              className={`px-3.5 py-2 rounded-full border text-xs transition ${
                filter === f.id
                  ? "bg-[var(--violet)] text-white border-[var(--violet-soft)] shadow-md"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              {f.label}
            </motion.button>
          ))}
          <span className="ml-auto text-[11px] text-[var(--color-text-muted)] self-center">
            {filtered.length} elementi
          </span>
        </div>
      </header>

      {loadingData ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Caricamento background…
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className={`${shellCard} p-3 space-y-3`}>
              <div className="max-h-[540px] overflow-y-auto space-y-2 pt-1">
                <AnimatePresence initial={false}>
                  {filtered.map((item) => {
                    const isActive = selected?.id === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        layout
                        {...cardAnim}
                        whileHover={{ y: reduce ? 0 : -1 }}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full text-left rounded-2xl border px-4 py-3 text-xs md:text-sm transition ${
                          isActive
                            ? "border-[var(--blue)] bg-[var(--color-surface)]"
                            : "border-[var(--color-border)] bg-black/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">
                            {item.nome} {item.cognome}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                              item.status
                            )}`}
                          >
                            {STATUS_LABELS[item.status]}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--color-text-muted)]">
                          <span className="truncate">{item.discordName}</span>
                          <span>
                            {new Date(item.submittedAt).toLocaleString(
                              "it-IT",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
                    Nessun background con questo filtro.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Dettaglio */}
          <main className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{
                    opacity: 0,
                    y: reduce ? 0 : -8,
                    transition: { duration: 0.15 },
                  }}
                  className={`${shellCard} p-4 md:p-5 space-y-4`}
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        Background
                      </p>
                      <h2 className="text-lg md:text-xl font-semibold truncate">
                        {selected.nome} {selected.cognome}
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {selected.discordName} • ID:{" "}
                        <span className="font-mono">{selected.discordId}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--color-text-muted)]">
                      <span
                        className={`px-3 py-1 rounded-full border text-[10px] ${statusPill(
                          selected.status
                        )}`}
                      >
                        {STATUS_LABELS[selected.status]}
                      </span>
                      <span>
                        Inviato:{" "}
                        {new Date(selected.submittedAt).toLocaleString(
                          "it-IT",
                          {
                            dateStyle: "short",
                            timeStyle: "short",
                          }
                        )}
                      </span>
                      <span>
                        Ultimo agg.:{" "}
                        {new Date(selected.lastUpdatedAt).toLocaleString(
                          "it-IT",
                          { dateStyle: "short", timeStyle: "short" }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Banner lock */}
                  {isLocked && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 text-emerald-300" />
                        <div>
                          <p className="font-semibold text-emerald-200">
                            Background approvato – bloccato
                          </p>
                          <p className="text-xs text-emerald-200/80">
                            Questo background è stato approvato e non può più
                            essere modificato o riportato in revisione.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sezioni */}
                  <div className="space-y-4 text-xs md:text-sm">
                    <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
                      <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                        <Info className="w-4 h-4 text-[var(--color-text-muted)]" />
                        II. Storia del personaggio
                      </h3>

                      <div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          Storia in breve
                        </p>

                        {editMode ? (
                          <textarea
                            disabled={updating || isLocked}
                            className="w-full min-h-[110px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
                            value={editDraft.storiaBreve}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                storiaBreve: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                            {selected.data.storiaBreve || "-"}
                          </p>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Azioni */}
                  <div className="mt-2 border-t border-[var(--color-border)] pt-4 space-y-3">
                    {!editMode && (
                      <>
                        <textarea
                          disabled={updating || isLocked}
                          className="w-full min-h-[90px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
                          placeholder={
                            isLocked
                              ? "Background bloccato (approvato)."
                              : "Motivazione del rifiuto..."
                          }
                          value={rejectionDraft}
                          onChange={(e) => setRejectionDraft(e.target.value)}
                        />

                        <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                          <motion.button
                            type="button"
                            whileTap={{ scale: reduce ? 1 : 0.97 }}
                            onClick={handleApprove}
                            disabled={updating || isLocked}
                            className="px-4 py-2 rounded-full font-semibold bg-emerald-500/90 text-[#050816] shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approva
                          </motion.button>

                          <motion.button
                            type="button"
                            whileTap={{ scale: reduce ? 1 : 0.97 }}
                            onClick={handleReject}
                            disabled={updating || isLocked}
                            className="px-4 py-2 rounded-full font-semibold bg-red-500/90 text-white shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rifiuta
                          </motion.button>

                          {isAdmin && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: reduce ? 1 : 0.97 }}
                              onClick={startEdit}
                              disabled={updating || isLocked}
                              className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 inline-flex items-center gap-2 disabled:opacity-50"
                            >
                              <Pencil className="w-4 h-4" />
                              Modifica BG
                            </motion.button>
                          )}
                        </div>
                      </>
                    )}

                    {editMode && (
                      <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                        <motion.button
                          type="button"
                          whileTap={{ scale: reduce ? 1 : 0.97 }}
                          onClick={saveEdit}
                          disabled={updating || isLocked}
                          className="px-4 py-2 rounded-full font-semibold bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Salva modifiche
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: reduce ? 1 : 0.97 }}
                          onClick={cancelEdit}
                          disabled={updating}
                          className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Ban className="w-4 h-4" />
                          Annulla
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Nessun background selezionato.
                </motion.p>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </section>
  );
}
