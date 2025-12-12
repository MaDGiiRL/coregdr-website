import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users as UsersIcon,
  Activity,
  Shield,
  RefreshCw,
  Crown,
  BadgeCheck,
  UserCog, 
  Server,
} from "lucide-react";


import BackgroundQueue from "./BackgroundQueue";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import {
  alertError,
  alertWarning,
  confirmAction,
  toast,
} from "../../lib/alerts";

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
      return "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

const rolePill = (role) => {
  switch (role) {
    case "Admin":
      return "bg-[var(--violet)]/15 text-[var(--color-accent-cool)] border-[var(--violet-soft)]";
    case "Mod":
      return "bg-amber-400/15 text-amber-300 border-amber-400/40";
    default:
      return "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const reduce = useReducedMotion();

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;
  const isStaff = isAdmin || isMod;

  const TABS = useMemo(
    () => [
      { id: "overview", label: "Panoramica", icon: LayoutDashboard },
      { id: "backgrounds", label: "Background", icon: FileText },
      { id: "users", label: "Utenti", icon: UsersIcon },
      { id: "logs", label: "Log", icon: Activity },
      { id: "serverLogs", label: "Log server", icon: Server }, // ✅ NEW
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBackgrounds: 0,
    pendingBackgrounds: 0,
    approvedBackgrounds: 0,
    rejectedBackgrounds: 0,
  });

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [serverLogs, setServerLogs] = useState([]); // ✅ NEW

  const [loadingData, setLoadingData] = useState(true);
  const [updatingRoleIds, setUpdatingRoleIds] = useState([]);

  const [overviewUsersPage, setOverviewUsersPage] = useState(1);
  const [overviewLogsPage, setOverviewLogsPage] = useState(1);

  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [serverLogsPage, setServerLogsPage] = useState(1); // ✅ NEW

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";

  const softPanel =
    "rounded-2xl border border-[var(--color-border)] bg-black/20";

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

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter((t) => t.id === "backgrounds");

  useEffect(() => {
    if (!isAdmin && activeTab !== "backgrounds") setActiveTab("backgrounds");
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    if (!profile) return;

    // i mod vedono solo backgrounds: non carichiamo overview/users/logs
    if (!isAdmin) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const [
        usersCountRes,
        totalBgRes,
        pendingBgRes,
        approvedBgRes,
        rejectedBgRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("characters").select("*", { count: "exact", head: true }),
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

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, discord_username, created_at, is_moderator, is_admin")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error(usersError);
        await alertError("Errore", "Impossibile caricare la lista utenti.");
      } else {
        const { data: charsData, error: charsErr } = await supabase
          .from("characters")
          .select("id, user_id, status, created_at")
          .order("created_at", { ascending: false });

        if (charsErr) console.error(charsErr);

        const latestBgByUser = new Map();
        (charsData || []).forEach((ch) => {
          if (!latestBgByUser.has(ch.user_id))
            latestBgByUser.set(ch.user_id, ch.status);
        });

        setUsers(
          (usersData || []).map((u) => ({
            id: u.id,
            discordName: u.discord_username ?? "Senza nome",
            joinedAt: u.created_at,
            bgStatus: latestBgByUser.get(u.id) ?? "none",
            isModerator: !!u.is_moderator,
            isAdmin: !!u.is_admin,
          }))
        );
      }

      const { data: logsData, error: logsError } = await supabase
        .from("logs")
        .select("id, type, message, created_at")
        .order("created_at", { ascending: false });

      if (logsError) {
        console.error(logsError);
        await alertError("Errore", "Impossibile caricare i log.");
      } else {
        setLogs(
          (logsData || []).map((l) => ({
            id: l.id,
            type: l.type ?? "GENERIC",
            message: l.message ?? "",
            createdAt: l.created_at,
          }))
        );
      }

      // ✅ NEW: SERVER LOGS
      const { data: serverLogsData, error: serverLogsError } = await supabase
        .from("server_logs")
        .select("id, plugin, type, description, embeds, created_at")
        .order("created_at", { ascending: false });

      if (serverLogsError) {
        console.error(serverLogsError);
        await alertError("Errore", "Impossibile caricare i log server.");
      } else {
        setServerLogs(
          (serverLogsData || []).map((l) => ({
            id: l.id,
            plugin: l.plugin ?? "unknown",
            type: l.type ?? "GENERIC",
            description: l.description ?? "",
            embeds: l.embeds ?? null,
            createdAt: l.created_at,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading admin data", err);
      await alertError("Errore", "Errore imprevisto nel caricamento dati.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const serverLogsTotalPages = Math.max(
    1,
    Math.ceil(serverLogs.length / PAGE_SIZE_FULL)
  ); // ✅ NEW

  const overviewUsers = paginate(users, overviewUsersPage, PAGE_SIZE_OVERVIEW);
  const overviewLogs = paginate(logs, overviewLogsPage, PAGE_SIZE_OVERVIEW);

  const paginatedUsers = paginate(users, usersPage, PAGE_SIZE_FULL);
  const paginatedLogs = paginate(logs, logsPage, PAGE_SIZE_FULL);
  const paginatedServerLogs = paginate(
    serverLogs,
    serverLogsPage,
    PAGE_SIZE_FULL
  ); // ✅ NEW

  const roleLabel = (u) =>
    u.isAdmin ? "Admin" : u.isModerator ? "Mod" : "User";

  const setUserRole = async (userId, nextRole) => {
    if (!isAdmin) return;

    if (userId === profile.id) {
      await alertWarning(
        "Operazione non consentita",
        "Non puoi modificare il tuo stesso ruolo da qui."
      );
      return;
    }

    const current = users.find((u) => u.id === userId);
    const currentRole = current ? roleLabel(current) : "User";
    if (currentRole === nextRole) return;

    const ok = await confirmAction({
      title: `Impostare ruolo: ${nextRole}?`,
      text: `Stai cambiando il ruolo da ${currentRole} a ${nextRole}.`,
      confirmText: "Sì, conferma",
      cancelText: "Annulla",
    });

    if (!ok) return;

    setUpdatingRoleIds((prev) => [...prev, userId]);

    const patch =
      nextRole === "Admin"
        ? { is_admin: true, is_moderator: true }
        : nextRole === "Mod"
        ? { is_admin: false, is_moderator: true }
        : { is_admin: false, is_moderator: false };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId);

      if (error) {
        console.error(error);
        await alertError("Errore", "Errore durante l'aggiornamento del ruolo.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isAdmin: !!patch.is_admin,
                isModerator: !!patch.is_moderator,
              }
            : u
        )
      );

      await supabase.from("logs").insert({
        type:
          nextRole === "Admin"
            ? "ROLE_SET_ADMIN"
            : nextRole === "Mod"
            ? "ROLE_SET_MOD"
            : "ROLE_SET_USER",
        message: `${profile.discord_username} ha impostato il ruolo di un utente a ${nextRole}.`,
        meta: JSON.stringify({
          admin_id: profile.id,
          target_user_id: userId,
          role: nextRole,
        }),
      });

      toast("success", `Ruolo aggiornato: ${nextRole}`);
    } catch (err) {
      console.error("Error updating role", err);
      await alertError("Errore", "Errore imprevisto durante l'operazione.");
    } finally {
      setUpdatingRoleIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const pageAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: reduce ? 0 : -8, transition: { duration: 0.16 } },
  };

  // ---------- GATES ----------
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

  const staffRole = isAdmin ? "Admin" : "Mod";

  const TabCount = (tabId) => {
    if (!isAdmin) return null;
    if (tabId === "users") return stats.totalUsers;
    if (tabId === "logs") return logs.length;
    if (tabId === "serverLogs") return serverLogs.length; // ✅ NEW
    if (tabId === "backgrounds") return stats.pendingBackgrounds;
    return null;
  };

  // ---------- UI ----------
  return (
    <section className="space-y-6">
      {/* HEADER */}
      <header className={`${shellCard} p-5 md:p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/20 grid place-items-center">
                <Shield className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-semibold truncate">
                  {isAdmin ? "Admin Dashboard" : "Area Moderazione"}
                </h1>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] truncate">
                  {isAdmin
                    ? "Controllo completo su utenti, background e log."
                    : "Moderazione background (approva / rifiuta)."}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-3 py-1 rounded-full border ${rolePill(
                  staffRole
                )}`}
              >
                <span className="inline-flex items-center gap-2">
                  {isAdmin ? (
                    <Crown className="w-4 h-4" />
                  ) : (
                    <BadgeCheck className="w-4 h-4" />
                  )}
                  Ruolo: {staffRole}
                </span>
              </span>

              <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-black/20 text-[var(--color-text-muted)]">
                Staff ID:{" "}
                <span className="font-mono">
                  {profile.discord_id ?? profile.id}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            {isAdmin && (
              <motion.button
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={fetchData}
                className="px-4 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 text-xs md:text-sm font-semibold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna dati
              </motion.button>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.97 }}
              onClick={() => setActiveTab("backgrounds")}
              className="px-4 py-2 rounded-2xl bg-[var(--violet)] text-white text-xs md:text-sm font-semibold shadow-md hover:brightness-110 inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Vai ai background
            </motion.button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className={`${shellCard} p-2`}>
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count = TabCount(tab.id);
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: reduce ? 1 : 0.985 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl border transition inline-flex items-center gap-2 text-xs md:text-sm ${
                  isActive
                    ? "bg-white/5 border-[var(--violet-soft)] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.25)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold">{tab.label}</span>
                {typeof count === "number" && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] ${
                      tab.id === "backgrounds"
                        ? "border-yellow-400/40 text-yellow-300 bg-yellow-400/10"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] bg-black/20"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* LOADING */}
      {loadingData && isAdmin && (
        <div
          className={`${softPanel} px-4 py-3 text-xs text-[var(--color-text-muted)]`}
        >
          Caricamento dati admin…
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* OVERVIEW */}
        {!loadingData && isAdmin && activeTab === "overview" && (
          <motion.section key="overview" {...pageAnim} className="space-y-6">
            {/* KPI */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Utenti registrati",
                  value: stats.totalUsers,
                  icon: UsersIcon,
                  hint: "Totale profili",
                },
                {
                  label: "Background inviati",
                  value: stats.totalBackgrounds,
                  icon: FileText,
                  hint: "Totale record",
                },
                {
                  label: "In attesa revisione",
                  value: stats.pendingBackgrounds,
                  icon: BadgeCheck,
                  hint: "Da processare",
                  extra: "text-yellow-300",
                },
                {
                  label: "Approvati / Rifiutati",
                  value: `${stats.approvedBackgrounds} / ${stats.rejectedBackgrounds}`,
                  icon: Activity,
                  hint: "Storico",
                },
              ].map((c, idx) => {
                const Icon = c.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: reduce ? 0 : -2 }}
                    className={`${shellCard} p-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {c.label}
                        </p>
                        <p
                          className={`mt-1 text-2xl font-semibold ${
                            c.extra ?? ""
                          }`}
                        >
                          {c.value}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                          {c.hint}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/20 grid place-items-center">
                        <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* LISTE OVERVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ultimi iscritti */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className={`${shellCard} p-4 space-y-3`}>
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

                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {overviewUsers.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-semibold truncate">
                              {u.discordName}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">
                              Iscritto il{" "}
                              {new Date(u.joinedAt).toLocaleString("it-IT", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                                u.bgStatus === "none" ? "none" : u.bgStatus
                              )}`}
                            >
                              {u.bgStatus === "none"
                                ? "Nessun BG"
                                : u.bgStatus === "pending"
                                ? "In attesa"
                                : u.bgStatus === "approved"
                                ? "Approvato"
                                : "Rifiutato"}
                            </span>

                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10px] ${rolePill(
                                roleLabel(u)
                              )}`}
                            >
                              {roleLabel(u)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {overviewUsers.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Nessun utente registrato.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                    <button
                      type="button"
                      onClick={() =>
                        setOverviewUsersPage((p) => Math.max(1, p - 1))
                      }
                      disabled={overviewUsersPage === 1}
                      className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                      className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Log attività */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className={`${shellCard} p-4 space-y-3`}>
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

                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {overviewLogs.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                            {l.type}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(l.createdAt).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs md:text-sm text-[var(--color-text)]">
                          {l.message}
                        </p>
                      </div>
                    ))}

                    {overviewLogs.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Nessun log disponibile.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                    <button
                      type="button"
                      onClick={() =>
                        setOverviewLogsPage((p) => Math.max(1, p - 1))
                      }
                      disabled={overviewLogsPage === 1}
                      className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                      className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* BACKGROUNDS */}
        {activeTab === "backgrounds" && (
          <motion.section key="backgrounds" {...pageAnim} className="space-y-4">
            <div className={`${shellCard} p-4 md:p-5`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Coda background
                  </h2>
                  <p className="mt-1 text-xs md:text-sm text-[var(--color-text-muted)]">
                    Gestisci i background inviati dai giocatori.
                  </p>
                </div>

                {!isAdmin && (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs">
                    <div className="flex items-start gap-2">
                      <UserCog className="w-4 h-4 mt-0.5 text-amber-300" />
                      <div>
                        <p className="font-semibold text-amber-200">
                          Permessi limitati
                        </p>
                        <p className="text-[11px] text-amber-200/80">
                          Come moderatore puoi solo approvare o rifiutare.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <BackgroundQueue />
          </motion.section>
        )}

        {/* USERS */}
        {isAdmin && activeTab === "users" && (
          <motion.section key="users" {...pageAnim} className="space-y-4">
            <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Utenti registrati
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                    Gestione ruoli: User / Mod / Admin.
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {buildRangeLabel(users.length, usersPage, PAGE_SIZE_FULL)}
                </span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedUsers.map((u) => {
                  const isUpdating = updatingRoleIds.includes(u.id);
                  const isSelf = u.id === profile.id;
                  const currentRole = roleLabel(u);

                  return (
                    <div
                      key={u.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {u.discordName}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            Iscritto il{" "}
                            {new Date(u.joinedAt).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[10px] ${rolePill(
                              currentRole
                            )}`}
                          >
                            {currentRole}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full border text-[10px] ${statusPill(
                              u.bgStatus === "none" ? "none" : u.bgStatus
                            )}`}
                          >
                            {u.bgStatus === "none"
                              ? "Nessun BG"
                              : u.bgStatus === "pending"
                              ? "In attesa"
                              : u.bgStatus === "approved"
                              ? "Approvato"
                              : "Rifiutato"}
                          </span>

                          <div className="h-6 w-px bg-[var(--color-border)] mx-1 hidden md:block" />

                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(u.id, "User")}
                            className="text-[10px] px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-40 hover:bg-white/5"
                          >
                            User
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(u.id, "Mod")}
                            className="text-[10px] px-3 py-1.5 rounded-full border border-amber-400/60 text-amber-300 disabled:opacity-40 hover:bg-white/5"
                          >
                            Mod
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(u.id, "Admin")}
                            className="text-[10px] px-3 py-1.5 rounded-full border border-[var(--violet-soft)] text-[var(--color-accent-cool)] disabled:opacity-40 hover:bg-white/5"
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* LOGS */}
        {isAdmin && activeTab === "logs" && (
          <motion.section key="logs" {...pageAnim} className="space-y-4">
            <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Log attività
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                    Eventi dalla tabella <code>logs</code>.
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {buildRangeLabel(logs.length, logsPage, PAGE_SIZE_FULL)}
                </span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedLogs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        {l.type}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {new Date(l.createdAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs md:text-sm text-[var(--color-text)]">
                      {l.message}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                <button
                  type="button"
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ✅ NEW: SERVER LOGS */}
        {isAdmin && activeTab === "serverLogs" && (
          <motion.section key="serverLogs" {...pageAnim} className="space-y-4">
            <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Log server
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                    Eventi dai plugin/risorse FiveM (payload embeds per
                    Discord).
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {buildRangeLabel(
                    serverLogs.length,
                    serverLogsPage,
                    PAGE_SIZE_FULL
                  )}
                </span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedServerLogs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {l.plugin}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {l.type}
                        </span>
                        {l.embeds && (
                          <span className="px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-black/20 text-[10px] text-[var(--color-text-muted)]">
                            embeds
                          </span>
                        )}
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

                    {l.embeds && (
                      <pre className="mt-2 text-[10px] leading-relaxed overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-black/30 p-3 text-[var(--color-text-muted)]">
                        {JSON.stringify(l.embeds, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}

                {paginatedServerLogs.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Nessun log server disponibile.
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
                    setServerLogsPage((p) =>
                      Math.min(serverLogsTotalPages, p + 1)
                    )
                  }
                  disabled={serverLogsPage === serverLogsTotalPages}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </section>
  );
} 
