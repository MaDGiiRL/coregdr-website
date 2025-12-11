// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import BackgroundQueue from "./BackgroundQueue";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const PAGE_SIZE_OVERVIEW = 10;
const PAGE_SIZE_FULL = 30;

const statusPill = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-400/15 text-yellow-300 border-yellow-400/40";
    case "approved":
      return "bg-emerald-400/15 text-emerald-300 border-emerald-400/40";
    case "rejected":
      return "bg-red-400/15 text-red-300 border-red-400/40";
    default:
      return "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

const TABS = [
  { id: "overview", label: "Panoramica" },
  { id: "backgrounds", label: "Background" },
  { id: "users", label: "Utenti" },
  { id: "logs", label: "Log" },
];

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;
  const isStaff = isAdmin || isMod;

  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBackgrounds: 0,
    pendingBackgrounds: 0,
    approvedBackgrounds: 0,
    rejectedBackgrounds: 0,
  });

  const [users, setUsers] = useState([]); // { id, discordName, joinedAt, bgStatus, isModerator }
  const [logs, setLogs] = useState([]); // { id, type, message, createdAt }

  const [loadingData, setLoadingData] = useState(true);
  const [updatingRoleIds, setUpdatingRoleIds] = useState([]);

  // paginazione overview (10 per pagina)
  const [overviewUsersPage, setOverviewUsersPage] = useState(1);
  const [overviewLogsPage, setOverviewLogsPage] = useState(1);

  // paginazione tab dedicati (30 per pagina)
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  const paginate = (items, page, pageSize) => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  };

  const buildRangeLabel = (total, page, pageSize) => {
    if (total === 0) return "0 di 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `${start}–${end} di ${total}`;
  };

  // TABS visibili in base al ruolo
  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter((t) => t.id === "backgrounds");

  // Se non sei admin, forza sempre la tab "backgrounds"
  useEffect(() => {
    if (!isAdmin && activeTab !== "backgrounds") {
      setActiveTab("backgrounds");
    }
  }, [isAdmin, activeTab]);

  // FETCH DATI DA SUPABASE (solo admin: mod non ha bisogno di stats/users/logs)
  useEffect(() => {
    if (!profile) return;

    if (!isAdmin) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      setLoadingData(true);

      try {
        // STATISTICHE (contatori)
        const [
          usersCountRes,
          totalBgRes,
          pendingBgRes,
          approvedBgRes,
          rejectedBgRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("characters")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("characters")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("characters")
            .select("*", { count: "exact", head: true })
            .eq("status", "approved"),
          supabase
            .from("characters")
            .select("*", { count: "exact", head: true })
            .eq("status", "rejected"),
        ]);

        setStats({
          totalUsers: usersCountRes.count ?? 0,
          totalBackgrounds: totalBgRes.count ?? 0,
          pendingBackgrounds: pendingBgRes.count ?? 0,
          approvedBackgrounds: approvedBgRes.count ?? 0,
          rejectedBackgrounds: rejectedBgRes.count ?? 0,
        });

        // ULTIMI UTENTI
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, discord_username, created_at, is_moderator")
          .order("created_at", { ascending: false });

        if (usersError) {
          console.error("Error fetching users", usersError);
        } else {
          // prendo tutti i BG e calcolo lo status BG più recente per ogni user
          const { data: charsData, error: charsError } = await supabase
            .from("characters")
            .select("id, user_id, status, created_at")
            .order("created_at", { ascending: false });

          if (charsError) {
            console.error("Error fetching characters for bgStatus", charsError);
          }

          const latestBgByUser = new Map();
          (charsData || []).forEach((ch) => {
            if (!latestBgByUser.has(ch.user_id)) {
              latestBgByUser.set(ch.user_id, ch.status);
            }
          });

          const mapped = (usersData || []).map((u) => ({
            id: u.id,
            discordName: u.discord_username ?? "Senza nome",
            joinedAt: u.created_at,
            bgStatus: latestBgByUser.get(u.id) ?? "none",
            isModerator: !!u.is_moderator,
          }));
          setUsers(mapped);
        }

        // LOG ATTIVITÀ
        const { data: logsData, error: logsError } = await supabase
          .from("logs")
          .select("id, type, message, created_at")
          .order("created_at", { ascending: false });

        if (logsError) {
          console.error("Error fetching logs", logsError);
        } else {
          const mappedLogs = (logsData || []).map((l) => ({
            id: l.id,
            type: l.type ?? "GENERIC",
            message: l.message ?? "",
            createdAt: l.created_at,
          }));
          setLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Error loading admin data", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [profile, isAdmin]);

  const overviewUsersTotalPages = Math.max(
    1,
    Math.ceil(users.length / PAGE_SIZE_OVERVIEW)
  );
  const overviewLogsTotalPages = Math.max(
    1,
    Math.ceil(logs.length / PAGE_SIZE_OVERVIEW)
  );

  const usersTotalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE_FULL));
  const logsTotalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE_FULL));

  const overviewUsers = paginate(users, overviewUsersPage, PAGE_SIZE_OVERVIEW);
  const overviewLogs = paginate(logs, overviewLogsPage, PAGE_SIZE_OVERVIEW);
  const paginatedUsers = paginate(users, usersPage, PAGE_SIZE_FULL);
  const paginatedLogs = paginate(logs, logsPage, PAGE_SIZE_FULL);

  const toggleModerator = async (userId, currentValue) => {
    if (!isAdmin) return;
    if (userId === profile.id) {
      alert("Non puoi modificare il tuo stesso ruolo da qui.");
      return;
    }

    const newValue = !currentValue;

    setUpdatingRoleIds((prev) => [...prev, userId]);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_moderator: newValue })
        .eq("id", userId);

      if (error) {
        console.error("Error updating moderator role", error);
        alert("Errore durante l'aggiornamento del ruolo.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isModerator: newValue } : u))
      );

      await supabase.from("logs").insert({
        type: newValue ? "ROLE_PROMOTE_MOD" : "ROLE_DEMOTE_MOD",
        message: `${profile.discord_username} ha ${
          newValue ? "promosso" : "rimosso"
        } un moderatore.`,
        meta: JSON.stringify({
          admin_id: profile.id,
          target_user_id: userId,
          is_moderator: newValue,
        }),
      });
    } catch (err) {
      console.error("Error updating moderator role", err);
    } finally {
      setUpdatingRoleIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // PROTEZIONE STAFF
  if (authLoading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Caricamento…</p>
    );
  }

  if (!profile) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Devi effettuare il login con Discord per accedere all&apos;area staff.
      </p>
    );
  }

  if (!isStaff) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Non hai i permessi per accedere a questa pagina.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold">
          {isAdmin ? "Admin dashboard" : "Area moderazione"}
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
          {isAdmin
            ? "Panoramica su background, iscritti e attività del server. Accesso riservato allo staff admin."
            : "Area staff dedicata alla moderazione dei background. Puoi solo approvare o rifiutare i BG."}
        </p>
      </header>

      {/* TAB NAV (i mod vedono solo la tab Background) */}
      <nav className="border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/80 backdrop-blur px-3 py-2 flex flex-wrap gap-2 text-xs md:text-sm">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl border transition ${
                isActive
                  ? "bg-[var(--violet)] text-white border-[var(--violet-soft)] shadow-md"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {loadingData && isAdmin && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Caricamento dati admin…
        </p>
      )}

      {/* ========== TAB OVERVIEW (solo admin) ========== */}
      {!loadingData && isAdmin && activeTab === "overview" && (
        <section className="space-y-6">
          {/* TOP STATS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 flex flex-col gap-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                Utenti registrati
              </p>
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 flex flex-col gap-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                Background inviati
              </p>
              <p className="text-2xl font-semibold">{stats.totalBackgrounds}</p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 flex flex-col gap-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                BG in attesa
              </p>
              <p className="text-2xl font-semibold text-yellow-300">
                {stats.pendingBackgrounds}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 flex flex-col gap-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                BG approvati / rifiutati
              </p>
              <p className="text-2xl font-semibold">
                {stats.approvedBackgrounds}
                <span className="text-sm text-[var(--color-text-muted)]">
                  {" "}
                  / {stats.rejectedBackgrounds}
                </span>
              </p>
            </div>
          </div>

          {/* MINI UTENTI + MINI LOG (10 per pagina) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Ultimi iscritti */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm md:text-base font-semibold">
                    Ultimi iscritti
                  </h2>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {buildRangeLabel(
                      users.length,
                      overviewUsersPage,
                      PAGE_SIZE_OVERVIEW
                    )}
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {overviewUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-2 text-xs md:text-sm flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {user.discordName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] ${statusPill(
                            user.bgStatus === "none" ? "none" : user.bgStatus
                          )}`}
                        >
                          {user.bgStatus === "none"
                            ? "Nessun BG"
                            : user.bgStatus === "pending"
                            ? "BG in attesa"
                            : user.bgStatus === "approved"
                            ? "BG approvato"
                            : "BG rifiutato"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Iscritto il{" "}
                        {new Date(user.joinedAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  ))}
                  {overviewUsers.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Nessun utente registrato.
                    </p>
                  )}
                </div>

                {/* Pagination mini utenti */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                  <button
                    type="button"
                    onClick={() =>
                      setOverviewUsersPage((p) => Math.max(1, p - 1))
                    }
                    disabled={overviewUsersPage === 1}
                    className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
                  >
                    Prev
                  </button>
                  <span>
                    Pagina {overviewUsersPage} / {overviewUsersTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOverviewUsersPage((p) =>
                        Math.min(overviewUsersTotalPages, p + 1)
                      )
                    }
                    disabled={overviewUsersPage === overviewUsersTotalPages}
                    className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Log attività */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm md:text-base font-semibold">
                    Log attività
                  </h2>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {buildRangeLabel(
                      logs.length,
                      overviewLogsPage,
                      PAGE_SIZE_OVERVIEW
                    )}
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto text-xs md:text-sm">
                  {overviewLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {log.type}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {new Date(log.createdAt).toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-[var(--color-text)] text-xs md:text-sm">
                        {log.message}
                      </p>
                    </div>
                  ))}
                  {overviewLogs.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Nessun log disponibile.
                    </p>
                  )}
                </div>

                {/* Pagination mini log */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                  <button
                    type="button"
                    onClick={() =>
                      setOverviewLogsPage((p) => Math.max(1, p - 1))
                    }
                    disabled={overviewLogsPage === 1}
                    className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                  >
                    Prev
                  </button>
                  <span>
                    Pagina {overviewLogsPage} / {overviewLogsTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOverviewLogsPage((p) =>
                        Math.min(overviewLogsTotalPages, p + 1)
                      )
                    }
                    disabled={overviewLogsPage === overviewLogsTotalPages}
                    className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== TAB BACKGROUNDS (admin + mod) ========== */}
      {activeTab === "backgrounds" && (
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Coda background</h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-3xl">
            Gestisci i background inviati dai giocatori. I moderatori possono
            solo approvare/rifiutare, gli admin possono anche modificare il
            testo e gestire gli altri dati admin.
          </p>
          <BackgroundQueue />
        </section>
      )}

      {/* ========== TAB USERS (solo admin) ========== */}
      {isAdmin && activeTab === "users" && (
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Utenti registrati
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-3xl">
            Elenco degli utenti registrati al sito tramite Discord, stato del
            loro background e ruolo staff. Da qui puoi promuovere o rimuovere
            moderatori (i mod possono solo approvare/rifiutare BG).
          </p>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                {buildRangeLabel(users.length, usersPage, PAGE_SIZE_FULL)}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Clicca sul pulsante per promuovere/rimuovere moderatori.
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {paginatedUsers.map((user) => {
                const isUpdating = updatingRoleIds.includes(user.id);
                const isSelf = user.id === profile.id;
                return (
                  <div
                    key={user.id}
                    className="rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-2 text-xs md:text-sm flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {user.discordName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] ${statusPill(
                          user.bgStatus === "none" ? "none" : user.bgStatus
                        )}`}
                      >
                        {user.bgStatus === "none"
                          ? "Nessun BG"
                          : user.bgStatus === "pending"
                          ? "BG in attesa"
                          : user.bgStatus === "approved"
                          ? "BG approvato"
                          : "BG rifiutato"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Iscritto il{" "}
                        {new Date(user.joinedAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                      <button
                        type="button"
                        disabled={isUpdating || isSelf}
                        onClick={() =>
                          toggleModerator(user.id, user.isModerator)
                        }
                        className={`text-[10px] px-2 py-1 rounded-full border ${
                          user.isModerator
                            ? "border-amber-400 text-amber-300"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                        } disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5`}
                      >
                        {isSelf
                          ? "Tu (admin)"
                          : user.isModerator
                          ? "Rimuovi mod"
                          : "Promuovi a mod"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {paginatedUsers.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nessun utente registrato.
                </p>
              )}
            </div>

            {/* Pagination users */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
              <button
                type="button"
                onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                disabled={usersPage === 1}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
              >
                Prev
              </button>
              <span>
                Pagina {usersPage} / {usersTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setUsersPage((p) => Math.min(usersTotalPages, p + 1))
                }
                disabled={usersPage === usersTotalPages}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========== TAB LOGS (solo admin) ========== */}
      {isAdmin && activeTab === "logs" && (
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Log attività</h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-3xl">
            Eventi registrati lato staff/backend: approvazioni, rifiuti, login,
            cambi ruolo, ecc.
          </p>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                {buildRangeLabel(logs.length, logsPage, PAGE_SIZE_FULL)}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Dati da tabella <code>logs</code>
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto text-xs md:text-sm">
              {paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      {log.type}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(log.createdAt).toLocaleString("it-IT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-[var(--color-text)] text-xs md:text-sm">
                    {log.message}
                  </p>
                </div>
              ))}
              {paginatedLogs.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nessun log disponibile.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
              <button
                type="button"
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                disabled={logsPage === 1}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
              >
                Prev
              </button>
              <span>
                Pagina {logsPage} / {logsTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLogsPage((p) => Math.min(logsTotalPages, p + 1))
                }
                disabled={logsPage === logsTotalPages}
                className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg:white/5 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
