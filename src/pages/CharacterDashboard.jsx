// src/pages/CharacterDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  alertError,
  alertSuccess,
  alertWarning,
  confirmAction,
  toast,
} from "../lib/alerts";

const STATUS_LABELS = {
  pending: "In attesa",
  approved: "Approvato",
  rejected: "Rifiutato",
};

const STATUS_COLORS = {
  pending: "bg-yellow-400/15 text-yellow-200 border-yellow-400/40",
  approved: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  rejected: "bg-red-400/15 text-red-300 border-red-400/40",
};

export default function CharacterDashboard() {
  const { profile, loading, session } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [loadingChars, setLoadingChars] = useState(true);

  const [editModeUser, setEditModeUser] = useState(false);
  const [editDraftUser, setEditDraftUser] = useState({
    storiaBreve: "",
    condannePenali: "",
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });
  const [savingEditUser, setSavingEditUser] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCharacters = async () => {
      if (!profile) return;
      setLoadingChars(true);
      try {
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching user characters", error);
          await alertError("Errore", "Impossibile caricare i tuoi personaggi.");
          return;
        }

        setCharacters(data || []);
        if (!activeCharacterId && data && data.length > 0) {
          setActiveCharacterId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading characters", err);
        await alertError("Errore", "Errore imprevisto nel caricamento dati.");
      } finally {
        setLoadingChars(false);
      }
    };

    if (profile) {
      loadCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessione...
      </p>
    );
  }

  if (!session || !profile) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Devi effettuare il login con Discord per vedere i tuoi personaggi.
      </p>
    );
  }

  const user = {
    discordName: profile.discord_username ?? "Senza nome",
    discordId: profile.discord_id ?? profile.id,
    avatarUrl:
      profile.avatar_url || "https://cdn.discordapp.com/embed/avatars/1.png",
    joinedAt: profile.created_at,
    lastLoginAt: profile.last_login_at,
  };

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? characters[0] ?? null;

  const totalApproved = characters.filter(
    (c) => c.status === "approved"
  ).length;
  const totalPending = characters.filter((c) => c.status === "pending").length;
  const totalRejected = characters.filter(
    (c) => c.status === "rejected"
  ).length;

  const startEditUser = async () => {
    if (!activeCharacter) return;

    // conferma opzionale prima di entrare in edit
    const ok = await confirmAction({
      title: "Modificare il background?",
      text: "Se salvi, il background tornerà in revisione.",
      confirmText: "Ok, modifica",
      cancelText: "Annulla",
      icon: "info",
    });

    if (!ok) return;

    setEditDraftUser({
      storiaBreve: activeCharacter.storia_breve || "",
      condannePenali: activeCharacter.condanne_penali || "",
      segniDistintivi: activeCharacter.segni_distintivi || "",
      aspettiCaratteriali: activeCharacter.aspetti_caratteriali || "",
    });
    setEditModeUser(true);
  };

  const cancelEditUser = async () => {
    const ok = await confirmAction({
      title: "Annullare le modifiche?",
      text: "Le modifiche non salvate andranno perse.",
      confirmText: "Sì, annulla",
      cancelText: "Torna indietro",
    });

    if (!ok) return;

    setEditModeUser(false);
  };

  const saveEditUser = async () => {
    if (!activeCharacter) return;

    const ok = await confirmAction({
      title: "Salvare le modifiche?",
      text: "Il background verrà aggiornato e tornerà in revisione.",
      confirmText: "Sì, salva",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

    setSavingEditUser(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .update({
          storia_breve: editDraftUser.storiaBreve,
          condanne_penali: editDraftUser.condannePenali,
          segni_distintivi: editDraftUser.segniDistintivi,
          aspetti_caratteriali: editDraftUser.aspettiCaratteriali,
          status: "pending",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeCharacter.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating character by user", error);
        await alertError(
          "Errore",
          "Errore durante il salvataggio del background."
        );
        return;
      }

      setCharacters((prev) =>
        prev.map((ch) =>
          ch.id === activeCharacter.id ? { ...ch, ...data } : ch
        )
      );
      setEditModeUser(false);

      // log non blocca la UX
      await supabase.from("logs").insert({
        type: "BG_EDITED_USER",
        message: `Background modificato dall'utente per ${data.nome} ${data.cognome}.`,
        meta: JSON.stringify({
          character_id: data.id,
          user_id: profile.id,
        }),
      });

      toast("success", "Background aggiornato (in revisione)");
      await alertSuccess(
        "Background aggiornato",
        "Il background è stato modificato ed è tornato in revisione."
      );
    } catch (err) {
      console.error("Error updating character by user", err);
      await alertError("Errore", "Errore generico durante il salvataggio.");
    } finally {
      setSavingEditUser(false);
    }
  };

  const handlePrint = async () => {
    if (!activeCharacter) return;

    const ok = await confirmAction({
      title: "Stampare / salvare come PDF?",
      text: "Si aprirà una nuova finestra pronta per la stampa.",
      confirmText: "Ok",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      await alertWarning(
        "Popup bloccato",
        "Il browser ha bloccato la finestra di stampa. Abilita i popup per questo sito."
      );
      return;
    }

    const content = `
      <html>
        <head>
          <title>Background - ${activeCharacter.nome ?? ""} ${
      activeCharacter.cognome ?? ""
    }</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; background: #0b0b12; color: #f4f4f9; }
            h1, h2, h3 { margin-bottom: 4px; }
            h1 { font-size: 22px; }
            h2 { font-size: 18px; margin-top: 20px; }
            h3 { font-size: 15px; margin-top: 14px; }
            p { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
            .section { border: 1px solid #33374f; border-radius: 12px; padding: 12px 16px; margin-top: 12px; background: #111325; }
            .muted { color: #a3a7d1; font-size: 12px; }
            .header-row { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:12px; }
            .tag { border-radius:999px; border:1px solid #444a7a; padding:2px 10px; font-size:11px; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <div>
              <h1>${activeCharacter.nome ?? ""} ${
      activeCharacter.cognome ?? ""
    }</h1>
              <p class="muted">Proprietario: ${
                user.discordName
              } • Discord ID: ${user.discordId}</p>
              <p class="muted">Creato il ${new Date(
                activeCharacter.created_at
              ).toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })} • Ultimo aggiornamento ${new Date(
      activeCharacter.updated_at
    ).toLocaleString("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    })}</p>
            </div>
            <div class="tag">Stato BG: ${
              STATUS_LABELS[activeCharacter.status] ?? ""
            }</div>
          </div>

          <div class="section">
            <h2>I. Dati anagrafici</h2>
            <p><strong>Nome:</strong> ${activeCharacter.nome ?? ""} ${
      activeCharacter.cognome ?? ""
    }</p>
            <p><strong>Sesso:</strong> ${activeCharacter.sesso || "-"}</p>
            <p><strong>Stato di nascita:</strong> ${
              activeCharacter.stato_nascita || "-"
            }</p>
            <p><strong>Etnia:</strong> ${activeCharacter.etnia || "-"}</p>
            <p><strong>Data di nascita:</strong> ${
              activeCharacter.data_nascita || "-"
            }</p>
          </div>

          <div class="section">
            <h2>II. Storia del personaggio</h2>
            <h3>Storia in breve</h3>
            <p>${activeCharacter.storia_breve || "-"}</p>
            <h3>Condanne penali</h3>
            <p>${activeCharacter.condanne_penali || "Nessuna indicata."}</p>
            <h3>Patologie</h3>
            <p>${
              activeCharacter.patologie?.length
                ? activeCharacter.patologie
                    .map((p) => "• " + p.nome + (p.inCura ? " (in cura)" : ""))
                    .join("\\n")
                : "Nessuna patologia dichiarata."
            }</p>
            <h3>Dipendenze</h3>
            <p>${
              activeCharacter.dipendenze?.length
                ? activeCharacter.dipendenze
                    .map((d) => "• " + d.nome + (d.inCura ? " (in cura)" : ""))
                    .join("\\n")
                : "Nessuna dipendenza dichiarata."
            }</p>
          </div>

          <div class="section">
            <h2>III. Caratteristiche del personaggio</h2>
            <h3>Segni distintivi e particolari</h3>
            <p>${activeCharacter.segni_distintivi || "-"}</p>
            <h3>Aspetti caratteriali</h3>
            <p>${activeCharacter.aspetti_caratteriali || "-"}</p>
          </div>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(content);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <section className="space-y-6">
      {/* HEADER UTENTE */}
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.discordName}
                className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-[var(--color-border)] object-cover shadow-[0_0_30px_rgba(0,0,0,0.6)]"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#13142b]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Profilo giocatore
              </p>
              <h1 className="text-xl md:text-2xl font-semibold">
                {user.discordName}
              </h1>
              <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                Discord ID: <span className="font-mono">{user.discordId}</span>
              </p>
            </div>
          </div>

          {/* piccole stats a destra */}
          <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-right">
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Personaggi
              </p>
              <p className="text-lg font-semibold">{characters.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-right">
              <p className="text-[10px] text-[var(--color-text-muted)]">
                BG approvati
              </p>
              <p className="text-lg font-semibold text-emerald-300">
                {totalApproved}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-right">
              <p className="text-[10px] text-[var(--color-text-muted)]">
                In revisione
              </p>
              <p className="text-lg font-semibold text-yellow-300">
                {totalPending}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
          Registrato il{" "}
          {new Date(user.joinedAt).toLocaleString("it-IT", {
            dateStyle: "short",
            timeStyle: "short",
          })}{" "}
          • Ultimo accesso{" "}
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—"}
        </p>
      </header>

      {/* LAYOUT: lista PG + dettaglio BG */}
      {loadingChars ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Caricamento personaggi...
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIDEBAR PERSONAGGI */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">I tuoi personaggi</h2>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {characters.length} BG
                </span>
              </div>

              <p className="text-[11px] text-[var(--color-text-muted)]">
                Seleziona un personaggio per vedere o modificare il background.
              </p>

              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {characters.map((pg) => {
                  const isActive = activeCharacter?.id === pg.id;
                  return (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => {
                        setActiveCharacterId(pg.id);
                        setEditModeUser(false);
                      }}
                      className={`w-full text-left rounded-xl border px-3 py-3 text-xs md:text-sm transition flex flex-col gap-1 ${
                        isActive
                          ? "border-[var(--blue)] bg-[var(--color-surface)]"
                          : "border-[var(--color-border)] bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {pg.nome} {pg.cognome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] ${
                            STATUS_COLORS[pg.status]
                          }`}
                        >
                          {STATUS_LABELS[pg.status]}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Creato il{" "}
                        {new Date(pg.created_at).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </button>
                  );
                })}

                {characters.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nessun personaggio creato. Invia un background dal form
                    dedicato per iniziare.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate("/background");
                }}
                className="w-full mt-1 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold bg-[var(--violet)] text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                + Nuovo background
              </button>
            </div>
          </aside>

          {/* DETTAGLIO PG */}
          <main className="lg:col-span-8 xl:col-span-9">
            {activeCharacter ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 md:p-5 space-y-5 shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
                {/* header PG */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Scheda personaggio
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold">
                      {activeCharacter.nome} {activeCharacter.cognome}
                    </h2>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      BG creato il{" "}
                      {new Date(activeCharacter.created_at).toLocaleString(
                        "it-IT",
                        { dateStyle: "short", timeStyle: "short" }
                      )}
                      , ultimo aggiornamento{" "}
                      {new Date(activeCharacter.updated_at).toLocaleString(
                        "it-IT",
                        { dateStyle: "short", timeStyle: "short" }
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--color-text-muted)]">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] ${
                        STATUS_COLORS[activeCharacter.status]
                      }`}
                    >
                      {STATUS_LABELS[activeCharacter.status]}
                    </span>
                    <span>
                      Proprietario:{" "}
                      <span className="font-medium">{user.discordName}</span>
                    </span>
                  </div>
                </div>

                {/* sezioni BG */}
                <div className="space-y-4 text-xs md:text-sm">
                  {/* Anagrafica */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-1.5">
                    <h3 className="font-semibold text-sm md:text-base mb-1">
                      I. Dati anagrafici
                    </h3>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Nome:
                      </span>{" "}
                      {activeCharacter.nome} {activeCharacter.cognome}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Sesso:
                      </span>{" "}
                      {activeCharacter.sesso || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Stato di nascita:
                      </span>{" "}
                      {activeCharacter.stato_nascita || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Etnia:
                      </span>{" "}
                      {activeCharacter.etnia || "-"}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        Data di nascita:
                      </span>{" "}
                      {activeCharacter.data_nascita || "-"}
                    </p>
                  </section>

                  {/* Storia + condanne + patologie/dipendenze */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-3">
                    <h3 className="font-semibold text-sm md:text-base">
                      II. Storia del personaggio
                    </h3>

                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Storia in breve
                      </p>
                      {editModeUser ? (
                        <textarea
                          className="w-full min-h-[90px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
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

                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Condanne penali (facoltativo)
                      </p>
                      {editModeUser ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraftUser.condannePenali}
                          onChange={(e) =>
                            setEditDraftUser((prev) => ({
                              ...prev,
                              condannePenali: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {activeCharacter.condanne_penali ||
                            "Nessuna indicata."}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mt-1">
                      <div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          Patologie
                        </p>
                        {activeCharacter.patologie?.length ? (
                          <ul className="list-disc list-inside text-[var(--color-text)]">
                            {activeCharacter.patologie.map((p, i) => (
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
                            Nessuna patologia dichiarata.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          Dipendenze
                        </p>
                        {activeCharacter.dipendenze?.length ? (
                          <ul className="list-disc list-inside text-[var(--color-text)]">
                            {activeCharacter.dipendenze.map((d, i) => (
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
                            Nessuna dipendenza dichiarata.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Caratteristiche */}
                  <section className="rounded-xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-3">
                    <h3 className="font-semibold text-sm md:text-base">
                      III. Caratteristiche del personaggio
                    </h3>

                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Segni distintivi e particolari
                      </p>
                      {editModeUser ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraftUser.segniDistintivi}
                          onChange={(e) =>
                            setEditDraftUser((prev) => ({
                              ...prev,
                              segniDistintivi: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {activeCharacter.segni_distintivi || "-"}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                        Aspetti caratteriali
                      </p>
                      {editModeUser ? (
                        <textarea
                          className="w-full min-h-[70px] rounded-xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y"
                          value={editDraftUser.aspettiCaratteriali}
                          onChange={(e) =>
                            setEditDraftUser((prev) => ({
                              ...prev,
                              aspettiCaratteriali: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-[var(--color-text)] whitespace-pre-line">
                          {activeCharacter.aspetti_caratteriali || "-"}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                {/* footer azioni utente */}
                <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2 text-xs md:text-sm">
                  {!editModeUser ? (
                    <>
                      <button
                        type="button"
                        onClick={startEditUser}
                        className="px-4 py-2 rounded-full font-semibold bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 active:scale-95 transition"
                      >
                        Modifica background
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                      >
                        Scarica PDF / stampa
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={saveEditUser}
                        disabled={savingEditUser}
                        className="px-4 py-2 rounded-full font-semibold bg-[var(--violet)] text-white shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                      >
                        {savingEditUser
                          ? "Salvataggio..."
                          : "Salva modifiche (torna in revisione)"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditUser}
                        disabled={savingEditUser}
                        className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50"
                      >
                        Annulla
                      </button>
                    </>
                  )}
                </div>
              </div> 
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nessun personaggio selezionato.
              </p>
            )}
          </main>
        </div>
      )}
    </section>
  );
}
