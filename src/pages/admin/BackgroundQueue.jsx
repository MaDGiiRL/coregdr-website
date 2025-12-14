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
  Search,
  Briefcase,
  MessageSquarePlus,
  Trash2,
  UsersRound,
  X as CloseIcon,
  ExternalLink,
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

// Badge ruolo autore commento
const rolePill = (role) => {
  switch (role) {
    case "Admin":
      return "bg-gradient-to-r from-[var(--violet)]/25 to-fuchsia-400/10 text-white border-[var(--violet-soft)]";
    case "Whitelister":
      return "bg-gradient-to-r from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-400/40";
    default:
      return "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

const RoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] ${rolePill(
      role
    )}`}
  >
    <span className="font-semibold">{role}</span>
  </span>
);

// Normalizzazione Job (debug filtro)
const normalizeJob = (job) => (job || "").toString().trim().toLowerCase();

export default function BackgroundQueue() {
  const { profile, loading } = useAuth();
  const reduce = useReducedMotion();

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator && !isAdmin;
  const canModerate = isAdmin || isMod;

  // ✅ mod può editare BG e job (sempre, anche approved) — come richiesto
  const canEditBgText = canModerate;
  const canEditJob = canModerate;

  // ✅ approva/rifiuta: lasciamo lock dopo approved (status non modificabile)
  // Se vuoi approvare/rifiutare sempre anche su approved dimmelo, ma di solito no.
  const canChangeStatus = canModerate;

  const [view, setView] = useState("backgrounds"); // "backgrounds" | "users"
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  // ✅ SOLO ADMIN: search & job filter
  const [q, setQ] = useState("");
  const [jobFilter, setJobFilter] = useState("ALL");

  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ✅ BOX UNICO commenti/motivo rifiuto — SEMPRE abilitato (anche approved)
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);

  // ✅ job edit UI — SEMPRE abilitato (anche approved)
  const [jobDraft, setJobDraft] = useState("");
  const [jobSaving, setJobSaving] = useState(false);

  // edit BG text (qui lascio lock su approved per testo BG come prima, ma se vuoi “sempre” anche per testo BG dimmelo)
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState({
    storiaBreve: "",
    condannePenali: "",
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });

  // ---------- USER STATS (admin-only table) ----------
  // Li mostro nel dettaglio BG e nel tab Utenti dentro Moderazione BG
  const [userStats, setUserStats] = useState(new Map()); // profileId -> { hoursPlayed, lastServerJoinAt }
  const [statsLoading, setStatsLoading] = useState(false);

  // ---------- MODAL (Users->backgrounds) ----------
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null); // { userId, discordName, discordId, hoursPlayed, lastServerJoinAt, job }
  const [modalUserBackgrounds, setModalUserBackgrounds] = useState([]);

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

  const softPanel =
    "rounded-2xl border border-[var(--color-border)] bg-black/20";

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
          job,
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
        data?.map((row) => {
          const jobRaw = row.job ?? "";
          const jobNorm = normalizeJob(jobRaw);
          return {
            id: row.id,
            userId: row.user_id,
            discordName: row.profiles?.discord_username ?? "Senza nome",
            discordId: row.profiles?.discord_id ?? "",
            nome: row.nome ?? "",
            cognome: row.cognome ?? "",
            status: row.status ?? "pending",
            job: jobRaw,
            jobNorm,
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
          };
        }) ?? [];

      setItems(mapped);

      const nextSelected = mapped.find((i) => i.id === selectedId)
        ? selectedId
        : mapped[0]?.id ?? null;

      setSelectedId(nextSelected);
      setEditMode(false);
    } catch (err) {
      console.error("Error loading backgrounds", err);
      await alertError("Errore", "Errore imprevisto nel caricamento dati.");
    } finally {
      setLoadingData(false);
    }
  };

  const loadUserStats = async () => {
    // tabella admin-only: profile_admin_stats
    // se un whitelister non ha accesso RLS, semplicemente non mostriamo stats (zero/—)
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_admin_stats")
        .select("profile_id, last_server_join_at, hours_played");

      if (error) {
        // Non bloccare UI (probabilmente RLS su whitelister)
        console.debug(
          "[STATS] profile_admin_stats non leggibile:",
          error?.message
        );
        setUserStats(new Map());
        return;
      }

      const m = new Map();
      (data || []).forEach((r) => {
        m.set(r.profile_id, {
          lastServerJoinAt: r.last_server_join_at ?? null,
          hoursPlayed: Number(r.hours_played ?? 0),
        });
      });
      setUserStats(m);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!profile || !canModerate) return;
    loadBackgrounds();
    loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const isLocked = selected?.status === "approved"; // per status (non per job/commenti)

  // reset drafts quando cambia selection
  useEffect(() => {
    if (!selected) return;
    setCommentDraft("");
    setJobDraft(selected.job || "");
    setEditMode(false);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (id) => {
    setSelectedId(id);
    setEditMode(false);
  };

  // ✅ Job options normalizzati + display coerente
  const jobOptions = useMemo(() => {
    const map = new Map(); // norm -> display
    items.forEach((x) => {
      const raw = (x.job || "").trim();
      const norm = normalizeJob(raw);
      if (!raw) return;
      if (!map.has(norm)) map.set(norm, raw);
    });

    const list = Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([norm, display]) => ({ norm, display }));

    return [{ norm: "ALL", display: "Tutti i job" }, ...list];
  }, [items]);

  // ✅ DEBUG (solo admin): stampa job e filtro
  useEffect(() => {
    if (!isAdmin) return;
    const allJobs = items.map((x) => x.job).filter(Boolean);
    console.debug(
      "[JOB DEBUG] jobFilter:",
      jobFilter,
      "distinct:",
      Array.from(new Set(allJobs.map((j) => normalizeJob(j)))).slice(0, 50),
      "sample:",
      allJobs.slice(0, 10)
    );
  }, [jobFilter, items, isAdmin]);

  const filtered = useMemo(() => {
    const byStatus = items.filter((item) =>
      filter === "all" ? true : item.status === filter
    );

    // ✅ search/job SOLO ADMIN
    if (!isAdmin) return byStatus;

    const qNorm = q.trim().toLowerCase();
    const bySearch = !qNorm
      ? byStatus
      : byStatus.filter((item) => {
          const hay = [
            item.nome,
            item.cognome,
            item.discordName,
            item.discordId,
            item.job,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(qNorm);
        });

    const byJob =
      jobFilter === "ALL"
        ? bySearch
        : bySearch.filter((item) => item.jobNorm === jobFilter);

    return byJob;
  }, [items, filter, isAdmin, q, jobFilter]);

  // ---------------- COMMENTS (character_comments) ----------------
  const loadComments = async (characterId) => {
    if (!characterId) return;
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("character_comments")
        .select(
          `
          id,
          comment,
          created_at,
          author_id,
          profiles:profiles!character_comments_author_id_fkey (
            discord_username,
            is_admin,
            is_moderator
          )
        `
        )
        .eq("character_id", characterId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        await alertError("Errore", "Impossibile caricare i commenti.");
        return;
      }

      const mapped = (data || []).map((c) => {
        const p = c.profiles;
        const role = p?.is_admin
          ? "Admin"
          : p?.is_moderator
          ? "Whitelister"
          : "User";
        return {
          id: c.id,
          message: c.comment ?? "",
          createdAt: c.created_at,
          authorId: c.author_id,
          authorName: p?.discord_username ?? "Sconosciuto",
          authorRole: role,
        };
      });

      setComments(mapped);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (!selected?.id) {
      setComments([]);
      return;
    }
    loadComments(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const sendComment = async () => {
    if (!selected) return;
    if (!commentDraft.trim()) {
      await alertWarning(
        "Commento vuoto",
        "Scrivi un commento prima di inviare."
      );
      return;
    }

    // ✅ COMMENTI SEMPRE (anche approved) — come richiesto

    setCommentSending(true);
    try {
      const payload = {
        character_id: selected.id,
        author_id: profile.id,
        comment: commentDraft.trim(),
        author_role: isAdmin ? "ADMIN" : "WHITELISTER",
      };

      const { data, error } = await supabase
        .from("character_comments")
        .insert(payload)
        .select("id, comment, created_at")
        .single();

      if (error) {
        console.error(error);
        await alertError("Errore", "Impossibile inviare il commento.");
        return;
      }

      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          message: data.comment,
          createdAt: data.created_at,
          authorId: profile.id,
          authorName: profile.discord_username ?? "Tu",
          authorRole: isAdmin ? "Admin" : "Whitelister",
        },
      ]);

      setCommentDraft("");
      toast("success", "Commento inviato");
    } finally {
      setCommentSending(false);
    }
  };

  // ---------------- UPDATE STATUS ----------------
  const updateStatus = async (id, status, rejectionReason = "") => {
    if (!canChangeStatus) return;

    const current = items.find((x) => x.id === id);
    if (current?.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più cambiare stato."
      );
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        status,
        updated_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? rejectionReason : null,
      };

      const { error } = await supabase
        .from("characters")
        .update(payload)
        .eq("id", id);

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
                  status === "rejected"
                    ? rejectionReason
                    : item.rejectionReason,
                lastUpdatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      toast(
        "success",
        status === "approved" ? "Background approvato" : "Background rifiutato"
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
        "Questo background è già approvato e non può più cambiare stato."
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
        "Questo background è approvato e non può più cambiare stato."
      );
      return;
    }

    // ✅ motivo rifiuto = BOX UNICO
    if (!commentDraft.trim()) {
      await alertWarning(
        "Motivazione mancante",
        "Scrivi nel box commenti la motivazione del rifiuto."
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

    const reason = commentDraft.trim();

    // 1) rifiuta
    await updateStatus(selected.id, "rejected", reason);

    // 2) salva anche come commento (storico) — commenti SEMPRE consentiti
    await sendComment();
  };

  // ---------------- EDIT BG TEXT ----------------
  const startEdit = async () => {
    if (!selected || !canEditBgText) return;

    // testo BG: lasciamo lock su approved (come avevi prima)
    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e il testo BG non può più essere modificato."
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
    if (!selected || !canEditBgText) return;

    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e il testo BG non può più essere modificato."
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

      setEditMode(false);
      toast("success", "Modifiche salvate");
    } finally {
      setUpdating(false);
    }
  };

  // ---------------- JOB EDIT (admin + mod) — SEMPRE ----------------
  const saveJob = async () => {
    if (!selected || !canEditJob) return;

    const nextJob = (jobDraft || "").trim();

    setJobSaving(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .update({
          job: nextJob.length ? nextJob : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id)
        .select("id, job, updated_at")
        .single();

      if (error) {
        console.error(error);
        await alertError("Errore", "Impossibile salvare il job.");
        return;
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === selected.id
            ? {
                ...it,
                job: data.job ?? "",
                jobNorm: normalizeJob(data.job ?? ""),
                lastUpdatedAt: data.updated_at,
              }
            : it
        )
      );

      toast("success", nextJob ? "Job aggiornato" : "Job rimosso");
    } finally {
      setJobSaving(false);
    }
  };

  const clearJob = async () => {
    setJobDraft("");
    await saveJob();
  };

  // ---------------- USERS VIEW (inside moderation) ----------------
  const usersInQueue = useMemo(() => {
    const map = new Map(); // userId -> aggregated
    items.forEach((it) => {
      if (!map.has(it.userId)) {
        map.set(it.userId, {
          userId: it.userId,
          discordName: it.discordName,
          discordId: it.discordId,
          // job: prendiamo l’ultimo job disponibile del suo background più recente (items è già ordinato desc)
          job: it.job || "",
          backgroundsCount: 0,
          latestStatus: it.status,
          latestCreatedAt: it.submittedAt,
        });
      }
      const u = map.get(it.userId);
      u.backgroundsCount += 1;
    });

    const list = Array.from(map.values());
    // sort: più recenti in alto
    list.sort(
      (a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt)
    );
    return list;
  }, [items]);

  const openUserModal = (u) => {
    const st = userStats.get(u.userId) || null;
    setModalUser({
      ...u,
      hoursPlayed: st?.hoursPlayed ?? 0,
      lastServerJoinAt: st?.lastServerJoinAt ?? null,
    });
    const bgs = items.filter((x) => x.userId === u.userId);
    setModalUserBackgrounds(bgs);
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setModalUser(null);
    setModalUserBackgrounds([]);
  };

  const selectFromModal = (bgId) => {
    setSelectedId(bgId);
    setView("backgrounds");
    closeUserModal();
  };

  const cardAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.15 } },
  };

  const selectedUserStat = selected?.userId
    ? userStats.get(selected.userId)
    : null;

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
      <header className={`${shellCard} p-5 md:p-6 space-y-3`}>
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
            onClick={() => {
              loadBackgrounds();
              loadUserStats();
            }}
            className="px-3 py-2 rounded-full border border-[var(--color-border)] hover:bg-white/5 inline-flex items-center gap-2 text-xs"
            title="Aggiorna lista"
          >
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </motion.button>
        </div>

        {/* SUB-TABS: Background / Utenti */}
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
          <span className="ml-auto text-[11px] text-[var(--color-text-muted)] self-center">
            {view === "backgrounds"
              ? `${filtered.length} background`
              : `${usersInQueue.length} utenti`}
            {statsLoading ? " • stats..." : ""}
          </span>
        </div>

        {/* Filtri stato (solo view backgrounds) */}
        {view === "backgrounds" && (
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
          </div>
        )}

        {/* ✅ SOLO ADMIN: search + job filter + debug pill (solo view backgrounds) */}
        {view === "backgrounds" && isAdmin && (
          <div className="pt-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca (nome, cognome, discord, id, job...)"
                className="w-full pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-sm outline-none focus:border-[var(--blue)]"
              />
            </div>

            <div className="md:w-[260px] relative">
              <Briefcase className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-sm outline-none focus:border-[var(--blue)]"
              >
                {jobOptions.map((j) => (
                  <option key={j.norm} value={j.norm}>
                    {j.display}
                  </option>
                ))}
              </select>
            </div>

            <div className="self-center text-[11px] px-3 py-1 rounded-full border border-[var(--color-border)] bg-black/20 text-[var(--color-text-muted)]">
              JobFilter: <span className="font-mono">{jobFilter}</span>
            </div>
          </div>
        )}
      </header>

      {/* LOADING */}
      {loadingData ? (
        <div
          className={`${softPanel} px-4 py-3 text-xs text-[var(--color-text-muted)]`}
        >
          Caricamento…
        </div>
      ) : (
        <>
          {/* VIEW: USERS */}
          {view === "users" && (
            <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <UsersRound className="w-4 h-4" />
                  Utenti (clicca per vedere i background in modale)
                </h3>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Job = gruppo
                </span>
              </div>

              <div className="space-y-2 max-h-[560px] overflow-y-auto">
                {usersInQueue.map((u) => {
                  const st = userStats.get(u.userId);
                  const last = st?.lastServerJoinAt
                    ? new Date(st.lastServerJoinAt).toLocaleString("it-IT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—";
                  const hrs = Number(st?.hoursPlayed ?? 0).toFixed(1);

                  return (
                    <motion.button
                      key={u.userId}
                      type="button"
                      whileTap={{ scale: reduce ? 1 : 0.985 }}
                      onClick={() => openUserModal(u)}
                      className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 px-4 py-3 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {u.discordName}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                            ID:{" "}
                            <span className="font-mono">
                              {u.discordId || u.userId}
                            </span>
                            <span className="mx-2 opacity-50">•</span>
                            Job:{" "}
                            <span className="text-white/80 font-semibold">
                              {u.job || "—"}
                            </span>
                            <span className="mx-2 opacity-50">•</span>
                            BG:{" "}
                            <span className="text-white/80 font-semibold">
                              {u.backgroundsCount}
                            </span>
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            Ultimo accesso:{" "}
                            <span className="text-white/80">{last}</span>
                            <span className="mx-2 opacity-50">•</span>
                            Ore:{" "}
                            <span className="text-white/80 font-semibold">
                              {hrs}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                            u.latestStatus
                          )}`}
                        >
                          {STATUS_LABELS[u.latestStatus] ?? u.latestStatus}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}

                {usersInQueue.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nessun utente trovato.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VIEW: BACKGROUNDS */}
          {view === "backgrounds" && (
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
                              <span className="truncate">
                                {item.discordName}
                                {item.job ? (
                                  <span className="ml-2 opacity-70">
                                    • {item.job}
                                  </span>
                                ) : null}
                              </span>
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
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.2 },
                      }}
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

                          {/* Discord + Job + Access info */}
                          <p className="text-xs text-[var(--color-text-muted)]">
                            <span className="truncate">
                              {selected.discordName} • ID:{" "}
                              <span className="font-mono">
                                {selected.discordId}
                              </span>
                              {selected.job ? (
                                <>
                                  <span className="mx-2 opacity-50">•</span>
                                  Job:{" "}
                                  <span className="font-semibold text-white/80">
                                    {selected.job}
                                  </span>
                                </>
                              ) : null}
                            </span>
                          </p>

                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                            Ultimo accesso:{" "}
                            <span className="text-white/80">
                              {selectedUserStat?.lastServerJoinAt
                                ? new Date(
                                    selectedUserStat.lastServerJoinAt
                                  ).toLocaleString("it-IT", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "—"}
                            </span>
                            <span className="mx-2 opacity-50">•</span>
                            Ore:{" "}
                            <span className="text-white/80 font-semibold">
                              {Number(
                                selectedUserStat?.hoursPlayed ?? 0
                              ).toFixed(1)}
                            </span>
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
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Banner lock (solo stato) */}
                      {isLocked && (
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm">
                          <div className="flex items-start gap-2">
                            <Lock className="w-4 h-4 mt-0.5 text-emerald-300" />
                            <div>
                              <p className="font-semibold text-emerald-200">
                                Background approvato – stato bloccato
                              </p>
                              <p className="text-xs text-emerald-200/80">
                                Lo stato non può più cambiare, ma Job e Commenti
                                restano modificabili.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ JOB EDIT (admin + mod) — SEMPRE */}
                      <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
                        <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[var(--color-text-muted)]" />
                          Job (Gruppo)
                        </h3>

                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <input
                            value={jobDraft}
                            onChange={(e) => setJobDraft(e.target.value)}
                            disabled={!canEditJob || jobSaving}
                            placeholder="Inserisci job (es. Polizia, Meccanico...)"
                            className="flex-1 px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-[#111326] text-sm outline-none focus:border-[var(--blue)] disabled:opacity-50"
                          />

                          <div className="flex items-center gap-2">
                            <motion.button
                              type="button"
                              whileTap={{ scale: reduce ? 1 : 0.97 }}
                              onClick={saveJob}
                              disabled={!canEditJob || jobSaving}
                              className="px-4 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {jobSaving ? "Salvataggio..." : "Salva job"}
                            </motion.button>

                            <motion.button
                              type="button"
                              whileTap={{ scale: reduce ? 1 : 0.97 }}
                              onClick={clearJob}
                              disabled={!canEditJob || jobSaving}
                              className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-2"
                              title="Rimuovi job"
                            >
                              <Trash2 className="w-4 h-4" />
                              Togli job
                            </motion.button>
                          </div>
                        </div>

                        {/* Mini debug: raw + norm */}
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          Debug: raw=
                          <span className="font-mono">
                            {selected.job || "—"}
                          </span>{" "}
                          • norm=
                          <span className="font-mono">
                            {" "}
                            {normalizeJob(selected.job)}
                          </span>
                        </p>
                      </section>

                      {/* Sezione testo BG */}
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

                        {/* ✅ BOX COMMENTI UNICO — SEMPRE + 4 visibili poi scroll */}
                        <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                              <MessageSquarePlus className="w-4 h-4 text-[var(--color-text-muted)]" />
                              Commenti staff
                            </h3>
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {commentsLoading
                                ? "Caricamento..."
                                : `${comments.length} commenti`}
                            </span>
                          </div>

                          {/* 4 commenti visibili ≈ max-h, poi scroll */}
                          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                            {comments.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-semibold truncate">
                                      {c.authorName}
                                    </span>
                                    <RoleBadge role={c.authorRole} />
                                  </div>
                                  <span className="text-[10px] text-[var(--color-text-muted)]">
                                    {new Date(c.createdAt).toLocaleString(
                                      "it-IT",
                                      {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      }
                                    )}
                                  </span>
                                </div>

                                {/* testo con altezza controllata per non “rompere” le 4 righe */}
                                <div className="mt-1 max-h-[64px] overflow-y-auto">
                                  <p className="text-xs md:text-sm text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                                    {c.message}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {!commentsLoading && comments.length === 0 && (
                              <p className="text-xs text-[var(--color-text-muted)]">
                                Nessun commento.
                              </p>
                            )}
                          </div>

                          <textarea
                            disabled={commentSending || updating}
                            className="w-full min-h-[90px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
                            placeholder="Scrivi un commento (o la motivazione del rifiuto)..."
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                          />

                          <div className="flex flex-wrap gap-2">
                            <motion.button
                              type="button"
                              whileTap={{ scale: reduce ? 1 : 0.97 }}
                              onClick={sendComment}
                              disabled={commentSending}
                              className="px-4 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              <MessageSquarePlus className="w-4 h-4" />
                              {commentSending ? "Invio..." : "Invia commento"}
                            </motion.button>
                          </div>
                        </section>
                      </div>

                      {/* Azioni */}
                      <div className="mt-2 border-t border-[var(--color-border)] pt-4 space-y-3">
                        {!editMode ? (
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

                            {canEditBgText && (
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
                        ) : (
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
        </>
      )}

      {/* ---------- USER MODAL ---------- */}
      <AnimatePresence>
        {userModalOpen && modalUser && (
          <motion.div
            key="userModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeUserModal();
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: reduce ? 0 : 12,
                scale: reduce ? 1 : 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.18 },
              }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : 10,
                scale: reduce ? 1 : 0.98,
                transition: { duration: 0.12 },
              }}
              className={`w-full max-w-3xl ${shellCard} p-4 md:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-semibold truncate">
                    {modalUser.discordName}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    ID:{" "}
                    <span className="font-mono">
                      {modalUser.discordId || modalUser.userId}
                    </span>
                    <span className="mx-2 opacity-50">•</span>
                    Job:{" "}
                    <span className="text-white/80 font-semibold">
                      {modalUser.job || "—"}
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Ultimo accesso:{" "}
                    <span className="text-white/80">
                      {modalUser.lastServerJoinAt
                        ? new Date(modalUser.lastServerJoinAt).toLocaleString(
                            "it-IT",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            }
                          )
                        : "—"}
                    </span>
                    <span className="mx-2 opacity-50">•</span>
                    Ore:{" "}
                    <span className="text-white/80 font-semibold">
                      {Number(modalUser.hoursPlayed ?? 0).toFixed(1)}
                    </span>
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.97 }}
                  onClick={closeUserModal}
                  className="px-3 py-2 rounded-full border border-[var(--color-border)] bg-black/20 hover:bg-white/5 inline-flex items-center gap-2 text-xs"
                >
                  <CloseIcon className="w-4 h-4" />
                  Chiudi
                </motion.button>
              </div>

              <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {modalUserBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {bg.nome} {bg.cognome}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          Inviato:{" "}
                          {new Date(bg.submittedAt).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                          {bg.job ? (
                            <>
                              <span className="mx-2 opacity-50">•</span>
                              Job:{" "}
                              <span className="text-white/80 font-semibold">
                                {bg.job}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                            bg.status
                          )}`}
                        >
                          {STATUS_LABELS[bg.status] ?? bg.status}
                        </span>

                        <motion.button
                          type="button"
                          whileTap={{ scale: reduce ? 1 : 0.97 }}
                          onClick={() => selectFromModal(bg.id)}
                          className="px-3 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 inline-flex items-center gap-2 text-xs"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Apri
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))}

                {modalUserBackgrounds.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nessun background per questo utente.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
