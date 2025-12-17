// pages/users/CharacterDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  alertError,
  alertSuccess,
  alertWarning,
  confirmAction,
  toast,
} from "../../lib/alerts";

import CharacterDashboardGate from "../../components/users/character-dashboard/CharacterDashboardGate";
import CharacterDashboardHeader from "../../components/users/character-dashboard/CharacterDashboardHeader";
import CharacterDashboardLayout from "../../components/users/character-dashboard/CharacterDashboardLayout";
import CharacterSidebar from "../../components/users/character-dashboard/CharacterSidebar";
import CharacterMainPanel from "../../components/users/character-dashboard/CharacterMainPanel";

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

const statusPill = (status) =>
  STATUS_COLORS[status] ??
  "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]";

// ✅ Sidebar card “colorata” per stato (senza badge)
const statusCardClass = (status, isActive) => {
  const base =
    "w-full text-left rounded-2xl border px-4 py-3 text-xs md:text-sm transition";
  const ring = isActive ? " ring-2 ring-[var(--blue)]" : "";
  const hover = isActive ? "" : " hover:brightness-110";

  if (status === "approved") {
    return `${base} border-emerald-400/30 bg-emerald-400/10 text-emerald-100${hover}${ring}`;
  }
  if (status === "pending") {
    return `${base} border-yellow-400/30 bg-yellow-400/10 text-yellow-100${hover}${ring}`;
  }
  if (status === "rejected") {
    return `${base} border-red-400/30 bg-red-400/10 text-red-100${hover}${ring}`;
  }

  return `${base} border-[var(--color-border)] bg-black/20 text-[var(--color-text)]${
    isActive ? " bg-[var(--color-surface)]" : " hover:bg-white/5"
  }${ring}`;
};

/* ---------------------------------------------
   ✅ LOG HELPER
---------------------------------------------- */
const safeMeta = (obj) => {
  try {
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
};

const writeLog = async (type, message, meta = {}) => {
  try {
    await supabase.from("logs").insert({
      type,
      message,
      meta: safeMeta(meta),
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.debug("[LOG]", e?.message || e);
  }
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

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

  // ✅ useMemo prima dei return
  const totals = useMemo(() => {
    const totalApproved = characters.filter(
      (c) => c.status === "approved"
    ).length;
    const totalPending = characters.filter(
      (c) => c.status === "pending"
    ).length;
    const totalRejected = characters.filter(
      (c) => c.status === "rejected"
    ).length;
    return { totalApproved, totalPending, totalRejected };
  }, [characters]);

  // ✅ SOLO FRONTEND: limite BG = profiles.pg_num (default 1)
  const pgMax = Math.max(1, Number(profile?.pg_num ?? 1));
  const canCreateNewBg = characters.length < pgMax;

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
        setActiveCharacterId((prev) => prev ?? data?.[0]?.id ?? null);

        // ✅ LOG: apertura dashboard + caricamento riuscito
        await writeLog("BG_DASH_OPEN", "Apertura dashboard personaggi", {
          user_id: profile.id,
          count: (data || []).length,
        });
      } catch (err) {
        console.error("Error loading characters", err);
        await alertError("Errore", "Errore imprevisto nel caricamento dati.");

        // ✅ LOG: errore caricamento
        await writeLog("BG_DASH_LOAD_ERROR", "Errore caricamento personaggi", {
          user_id: profile.id,
          error: err?.message || String(err),
        });
      } finally {
        setLoadingChars(false);
      }
    };

    if (profile) loadCharacters();
  }, [profile]);

  const user = profile
    ? {
        discordName: profile.discord_username ?? "Senza nome",
        discordId: profile.discord_id ?? profile.id,
        avatarUrl:
          profile.avatar_url ||
          "https://cdn.discordapp.com/embed/avatars/1.png",
        joinedAt: profile.created_at,
        lastLoginAt: profile.last_login_at,
      }
    : null;

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? characters[0] ?? null;

  const isApproved = activeCharacter?.status === "approved";

  const startEditUser = async () => {
    if (!activeCharacter) return;

    if (activeCharacter.status === "approved") {
      await alertWarning(
        "Non modificabile",
        "Questo background è stato approvato e non può più essere modificato."
      );
      return;
    }

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

    // ✅ LOG: inizio modifica
    await writeLog("BG_EDIT_START", "Inizio modifica background", {
      user_id: profile.id,
      character_id: activeCharacter.id,
      status_before: activeCharacter.status,
    });
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

    // ✅ LOG: annullo modifica
    await writeLog("BG_EDIT_CANCEL", "Modifica background annullata", {
      user_id: profile.id,
      character_id: activeCharacter?.id,
    });
  };

  const saveEditUser = async () => {
    if (!activeCharacter) return;

    if (activeCharacter.status === "approved") {
      await alertWarning(
        "Non modificabile",
        "Questo background è stato approvato e non può più essere modificato."
      );
      setEditModeUser(false);
      return;
    }

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

        // ✅ LOG: errore salvataggio
        await writeLog("BG_EDIT_SAVE_ERROR", "Errore salvataggio modifica BG", {
          user_id: profile.id,
          character_id: activeCharacter.id,
          error: error?.message || String(error),
        });
        return;
      }

      setCharacters((prev) =>
        prev.map((ch) =>
          ch.id === activeCharacter.id ? { ...ch, ...data } : ch
        )
      );
      setEditModeUser(false);

      // ✅ LOG: salvataggio riuscito
      await writeLog("BG_EDIT_SAVE", "Background modificato dall'utente", {
        user_id: profile.id,
        character_id: data.id,
        nome: `${data.nome} ${data.cognome}`,
        status_after: data.status,
      });

      toast("success", "Background aggiornato (in revisione)");
      await alertSuccess(
        "Background aggiornato",
        "Il background è stato modificato ed è tornato in revisione."
      );
    } catch (err) {
      console.error("Error updating character by user", err);
      await alertError("Errore", "Errore generico durante il salvataggio.");

      // ✅ LOG: catch generico
      await writeLog("BG_EDIT_SAVE_ERROR", "Errore generico salvataggio BG", {
        user_id: profile.id,
        character_id: activeCharacter.id,
        error: err?.message || String(err),
      });
    } finally {
      setSavingEditUser(false);
    }
  };

  // =========================
  // EXPORT (SOLO STAMPA)
  // =========================
  const buildPrintHtml = () => `
    <html>
      <head>
        <title>Background - ${activeCharacter?.nome ?? ""} ${
    activeCharacter?.cognome ?? ""
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
            <h1>${activeCharacter?.nome ?? ""} ${
    activeCharacter?.cognome ?? ""
  }</h1>
            <p class="muted">Proprietario: ${user.discordName} • Discord ID: ${
    user.discordId
  }</p>
            <p class="muted">Creato il ${new Date(
              activeCharacter?.created_at
            ).toLocaleString("it-IT", {
              dateStyle: "short",
              timeStyle: "short",
            })} • Ultimo aggiornamento ${new Date(
    activeCharacter?.updated_at
  ).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  })}</p>
          </div>
          <div class="tag">Stato BG: ${
            STATUS_LABELS[activeCharacter?.status] ?? ""
          }</div>
        </div>

        <div class="section">
          <h2>II. Storia del personaggio</h2>
          <h3>Storia in breve</h3>
          <p>${activeCharacter?.storia_breve || "-"}</p>
          <h3>Condanne penali</h3>
          <p>${activeCharacter?.condanne_penali || "Nessuna indicata."}</p>
        </div>

        <div class="section">
          <h2>III. Caratteristiche del personaggio</h2>
          <h3>Segni distintivi e particolari</h3>
          <p>${activeCharacter?.segni_distintivi || "-"}</p>
          <h3>Aspetti caratteriali</h3>
          <p>${activeCharacter?.aspetti_caratteriali || "-"}</p>
        </div>
      </body>
    </html>
  `;

  const handlePrint = async () => {
    if (!activeCharacter) return;

    const ok = await confirmAction({
      title: "Stampare il background?",
      text: "Si aprirà una nuova finestra pronta per la stampa.",
      confirmText: "Stampa",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

    // ✅ LOG: stampa
    await writeLog("BG_PRINT", "Stampa background", {
      user_id: profile.id,
      character_id: activeCharacter.id,
    });

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      await alertWarning(
        "Popup bloccato",
        "Il browser ha bloccato la finestra di stampa. Abilita i popup per questo sito."
      );
      return;
    }

    win.document.open();
    win.document.write(buildPrintHtml());
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <CharacterDashboardGate
      loading={loading}
      session={session}
      profile={profile}
    >
      <section className="w-full max-w-screen-2xl mx-auto px-3 md:px-6 space-y-4">
        <CharacterDashboardHeader
          shellCard={shellCard}
          user={user}
          charactersCount={characters.length}
          totals={totals}
        />

        {loadingChars ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Caricamento personaggi...
          </p>
        ) : (
          <CharacterDashboardLayout
            sidebar={
              <CharacterSidebar
                shellCard={shellCard}
                characters={characters}
                activeCharacter={activeCharacter}
                statusCardClass={statusCardClass}
                statusLabels={STATUS_LABELS}
                canCreateNewBg={canCreateNewBg}
                pgMax={pgMax}
                onSelect={async (pg) => {
                  setActiveCharacterId(pg.id);
                  setEditModeUser(false);

                  await writeLog("BG_SELECT", "Selezione background", {
                    user_id: profile.id,
                    character_id: pg.id,
                    status: pg.status,
                  });
                }}
                onNewBackground={async () => {
                  if (!canCreateNewBg) {
                    await alertWarning(
                      "Slot esauriti",
                      `Hai già ${characters.length}/${pgMax} background. Non hai altri slot PG disponibili.`
                    );
                    return;
                  }

                  await writeLog("BG_GOTO_NEW_FORM", "Vai al form nuovo BG", {
                    user_id: profile.id,
                  });
                  navigate("/background");
                }}
              />
            }
            main={
              <CharacterMainPanel
                shellCard={shellCard}
                activeCharacter={activeCharacter}
                user={user}
                isApproved={isApproved}
                editModeUser={editModeUser}
                editDraftUser={editDraftUser}
                setEditDraftUser={setEditDraftUser}
                savingEditUser={savingEditUser}
                statusLabels={STATUS_LABELS}
                statusPill={statusPill}
                onStartEdit={startEditUser}
                onSaveEdit={saveEditUser}
                onCancelEdit={cancelEditUser}
                onPrint={handlePrint}
              />
            }
          />
        )}
      </section>
    </CharacterDashboardGate>
  );
}
