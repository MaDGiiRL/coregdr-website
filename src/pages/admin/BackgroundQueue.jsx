import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  alertError,
  alertInfo,
  alertWarning,
  confirmAction,
  toast,
} from "../../lib/alerts";

// components UI
import BackgroundQueueHeader from "../../components/admin/background-queue/BackgroundQueueHeader";
import BackgroundQueueFilters from "../../components/admin/background-queue/BackgroundQueueFilters";
import UsersTab from "../../components/admin/background-queue/UsersTab";
import BackgroundsTab from "../../components/admin/background-queue/BackgroundsTab";
import BackgroundsList from "../../components/admin/background-queue/BackgroundsList";
import BackgroundDetail from "../../components/admin/background-queue/BackgroundDetail";
import RejectModal from "../../components/admin/background-queue/RejectModal";
import UserModal from "../../components/admin/background-queue/UserModal";

// utils
import {
  normalizeJob,
  safeMeta,
} from "../../components/admin/background-queue/utils";

export default function BackgroundQueue() {
  const { profile, loading } = useAuth();
  const reduce = useReducedMotion();

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator && !isAdmin;
  const canModerate = isAdmin || isMod;

  const canEditBgText = canModerate;
  const canEditJob = canModerate;
  const canChangeStatus = canModerate;

  const [view, setView] = useState("backgrounds"); // "backgrounds" | "users"
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected
  const [selectedId, setSelectedId] = useState(null);

  // shared filters (valgono su entrambi i tab)
  const [q, setQ] = useState("");
  const [jobFilter, setJobFilter] = useState("ALL");

  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);

  // comments
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);

  // job edit
  const [jobDraft, setJobDraft] = useState("");
  const [jobSaving, setJobSaving] = useState(false);

  // edit BG text
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState({
    storiaBreve: "",
    condannePenali: "",
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });

  // stats
  const [userStats, setUserStats] = useState(new Map());
  const [statsLoading, setStatsLoading] = useState(false);

  // user modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalUserBackgrounds, setModalUserBackgrounds] = useState([]);

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonDraft, setRejectReasonDraft] = useState("");
  const [rejectSending, setRejectSending] = useState(false);

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

  const softPanel =
    "rounded-2xl border border-[var(--color-border)] bg-black/20";

  // LOG WRITER
  const writeLog = async (type, message, meta = {}) => {
    try {
      await supabase.from("logs").insert({
        type,
        message,
        meta: safeMeta(meta),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug("[LOGS] writeLog failed:", e?.message || e);
    }
  };

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
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_admin_stats")
        .select("profile_id, last_server_join_at, hours_played");

      if (error) {
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
  const isLocked = selected?.status === "approved";

  // sync jobDraft
  useEffect(() => {
    setJobDraft(selected?.job ?? "");
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // realtime + load comments
  useEffect(() => {
    if (!selected?.id) return;

    let alive = true;

    const loadCommentsRT = async () => {
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
          .eq("character_id", selected.id)
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

    loadCommentsRT();

    const commentChannel = supabase
      .channel("realtime-comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "character_comments",
          filter: `character_id=eq.${selected.id}`,
        },
        (payload) => {
          if (!alive) return;

          const newComment = payload.new;
          if (!newComment) return;

          const profile = newComment.profiles;
          const role = profile?.is_admin
            ? "Admin"
            : profile?.is_moderator
            ? "Whitelister"
            : "User";

          setComments((prev) => [
            ...prev,
            {
              id: newComment.id,
              message: newComment.comment ?? "",
              createdAt: newComment.created_at,
              authorId: newComment.author_id,
              authorName: profile?.discord_username ?? "Sconosciuto",
              authorRole: role,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(commentChannel);
    };
  }, [selected?.id]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setEditMode(false);
  };

  // job options
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

  // BACKGROUNDS filtered (filtri su BG)
  const filtered = useMemo(() => {
    const byStatus = items.filter((item) =>
      filter === "all" ? true : item.status === filter
    );

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

  // COMMENTS load (non realtime)
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

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [comments]);

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

      await writeLog(
        "BG_COMMENT",
        `Commento staff su BG ${selected.id} (${selected.nome} ${selected.cognome})`,
        {
          character_id: selected.id,
          user_id: selected.userId,
          author_id: profile.id,
          author_role: isAdmin ? "ADMIN" : "WHITELISTER",
          preview: commentDraft.trim().slice(0, 140),
        }
      );

      setCommentDraft("");
      toast("success", "Commento inviato");
    } finally {
      setCommentSending(false);
    }
  };

  // UPDATE STATUS
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

      if (status === "approved") {
        await writeLog(
          "BG_APPROVE",
          `BG approvato: ${current?.nome ?? ""} ${
            current?.cognome ?? ""
          }`.trim(),
          { character_id: id, user_id: current?.userId, staff_id: profile.id }
        );
      }

      if (status === "rejected") {
        await writeLog(
          "BG_REJECT",
          `BG rifiutato: ${current?.nome ?? ""} ${
            current?.cognome ?? ""
          }`.trim(),
          {
            character_id: id,
            user_id: current?.userId,
            staff_id: profile.id,
            reason: (rejectionReason || "").slice(0, 200),
          }
        );
      }

      if (status === "pending") {
        await writeLog(
          "BG_STATUS",
          `BG riportato in pending: ${current?.nome ?? ""} ${
            current?.cognome ?? ""
          }`.trim(),
          { character_id: id, user_id: current?.userId, staff_id: profile.id }
        );
      }

      toast(
        "success",
        status === "approved"
          ? "Background approvato"
          : status === "rejected"
          ? "Background rifiutato"
          : "Background aggiornato"
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

  const openRejectModal = async () => {
    if (!selected) return;

    if (selected.status === "approved") {
      await alertInfo(
        "Background bloccato",
        "Questo background è approvato e non può più cambiare stato."
      );
      return;
    }

    setRejectReasonDraft("");
    setRejectOpen(true);
  };

  const closeRejectModal = () => {
    if (rejectSending) return;
    setRejectOpen(false);
    setRejectReasonDraft("");
  };

  const submitReject = async () => {
    if (!selected) return;
    if (selected.status === "approved") return;

    const reason = rejectReasonDraft.trim();
    if (!reason) {
      await alertWarning(
        "Motivazione mancante",
        "Scrivi il motivo del rifiuto."
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

    setRejectSending(true);
    try {
      await updateStatus(selected.id, "rejected", reason);

      const payload = {
        character_id: selected.id,
        author_id: profile.id,
        comment: reason,
        author_role: isAdmin ? "ADMIN" : "WHITELISTER",
      };

      const { data, error } = await supabase
        .from("character_comments")
        .insert(payload)
        .select("id, comment, created_at")
        .single();

      if (error) {
        console.error(error);
        toast("warning", "Rifiutato, ma commento non salvato");
      } else {
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

        await writeLog(
          "BG_COMMENT",
          `Motivazione rifiuto salvata nei commenti (BG ${selected.id})`,
          {
            character_id: selected.id,
            user_id: selected.userId,
            author_id: profile.id,
            author_role: isAdmin ? "ADMIN" : "WHITELISTER",
            preview: reason.slice(0, 140),
          }
        );
      }

      setRejectOpen(false);
      setRejectReasonDraft("");
      toast("success", "Background rifiutato");
    } finally {
      setRejectSending(false);
    }
  };

  const handleReject = async () => {
    await openRejectModal();
  };

  // EDIT BG TEXT
  const startEdit = async () => {
    if (!selected || !canEditBgText) return;

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

      await writeLog(
        "BG_EDIT",
        `Testo BG modificato: ${selected.nome} ${selected.cognome}`,
        {
          character_id: selected.id,
          user_id: selected.userId,
          staff_id: profile.id,
        }
      );

      setEditMode(false);
      toast("success", "Modifiche salvate");
    } finally {
      setUpdating(false);
    }
  };

  // JOB EDIT
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

      await writeLog(
        "BG_JOB_UPDATE",
        `Job aggiornato su BG ${selected.id} (${selected.nome} ${selected.cognome})`,
        {
          character_id: selected.id,
          user_id: selected.userId,
          staff_id: profile.id,
          job: (nextJob || "").slice(0, 80),
        }
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

  // USERS BASE
  const usersBase = useMemo(() => {
    const map = new Map();

    items.forEach((it) => {
      const prev = map.get(it.userId);

      if (!prev) {
        map.set(it.userId, {
          userId: it.userId,
          discordName: it.discordName,
          discordId: it.discordId,
          job: it.job || "",
          backgroundsCount: 1,
          latestStatus: it.status,
          latestCreatedAt: it.submittedAt,
        });
        return;
      }

      prev.backgroundsCount += 1;

      if (new Date(it.submittedAt) > new Date(prev.latestCreatedAt)) {
        prev.latestCreatedAt = it.submittedAt;
        prev.latestStatus = it.status;
        if (it.job) prev.job = it.job;
      }

      if (!prev.discordName && it.discordName)
        prev.discordName = it.discordName;
      if (!prev.discordId && it.discordId) prev.discordId = it.discordId;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt)
    );
  }, [items]);

  // USERS FILTERED (filtri su UTENTE, non su background)
  const usersFiltered = useMemo(() => {
    let list = usersBase;

    if (filter !== "all") {
      list = list.filter((u) => u.latestStatus === filter);
    }

    const qNorm = q.trim().toLowerCase();
    if (qNorm) {
      list = list.filter((u) => {
        const hay = [
          u.discordName,
          u.discordId,
          u.userId,
          u.job,
          u.latestStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(qNorm);
      });
    }

    if (isAdmin && jobFilter !== "ALL") {
      list = list.filter((u) => normalizeJob(u.job) === jobFilter);
    }

    return list;
  }, [usersBase, filter, q, isAdmin, jobFilter]);

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

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessionToggle...
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

  const resetFilters = () => {
    setQ("");
    setJobFilter("ALL");
    setFilter("all");
    setEditMode(false);
  };

  return (
    <section className="space-y-6">
      <BackgroundQueueHeader
        shellCard={shellCard}
        reduce={reduce}
        resetFilters={resetFilters}
        onRefresh={() => {
          loadBackgrounds();
          loadUserStats();
        }}
      />

      <BackgroundQueueFilters
        view={view}
        setView={setView}
        filteredCount={filtered.length}
        usersFilteredCount={usersFiltered.length}
        statsLoading={statsLoading}
        isAdmin={isAdmin}
        jobOptions={jobOptions}
        shellCard={shellCard}
        reduce={reduce}
        q={q}
        setQ={setQ}
        filter={filter}
        setFilter={setFilter}
        jobFilter={jobFilter}
        setJobFilter={setJobFilter}
        setEditMode={setEditMode}
      />

      {loadingData ? (
        <div
          className={`${softPanel} px-4 py-3 text-xs text-[var(--color-text-muted)]`}
        >
          Caricamento…
        </div>
      ) : (
        <>
          {view === "users" && (
            <UsersTab
              shellCard={shellCard}
              reduce={reduce}
              usersFiltered={usersFiltered}
              userStats={userStats}
              openUserModal={openUserModal}
            />
          )}

          {view === "backgrounds" && (
            <BackgroundsTab>
              <BackgroundsList
                shellCard={shellCard}
                filtered={filtered}
                selected={selected}
                handleSelect={handleSelect}
                cardAnim={cardAnim}
                reduce={reduce}
              />

              <main className="lg:col-span-7 xl:col-span-8">
                <BackgroundDetail
                  selected={selected}
                  shellCard={shellCard}
                  reduce={reduce}
                  isLocked={isLocked}
                  canEditJob={canEditJob}
                  jobSaving={jobSaving}
                  jobDraft={jobDraft}
                  setJobDraft={setJobDraft}
                  saveJob={saveJob}
                  clearJob={clearJob}
                  canEditBgText={canEditBgText}
                  editMode={editMode}
                  editDraft={editDraft}
                  setEditDraft={setEditDraft}
                  startEdit={startEdit}
                  saveEdit={saveEdit}
                  cancelEdit={cancelEdit}
                  updating={updating}
                  handleApprove={handleApprove}
                  handleReject={handleReject}
                  commentsLoading={commentsLoading}
                  comments={comments}
                  sortedComments={sortedComments}
                  commentDraft={commentDraft}
                  setCommentDraft={setCommentDraft}
                  commentSending={commentSending}
                  sendComment={sendComment}
                />
              </main>
            </BackgroundsTab>
          )}
        </>
      )}

      <RejectModal
        rejectOpen={rejectOpen}
        selected={selected}
        reduce={reduce}
        shellCard={shellCard}
        rejectReasonDraft={rejectReasonDraft}
        setRejectReasonDraft={setRejectReasonDraft}
        rejectSending={rejectSending}
        closeRejectModal={closeRejectModal}
        submitReject={submitReject}
      />

      <UserModal
        userModalOpen={userModalOpen}
        modalUser={modalUser}
        modalUserBackgrounds={modalUserBackgrounds}
        reduce={reduce}
        shellCard={shellCard}
        closeUserModal={closeUserModal}
        selectFromModal={selectFromModal}
      />
    </section>
  );
}
