import { useEffect, useMemo, useState } from "react";
import { useDiscordRoles } from "../../hooks/useDiscordRoles";
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
  Briefcase,
  Search,
} from "lucide-react";

import BackgroundQueue from "./BackgroundQueue";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { alertError } from "../../lib/alerts";

const PAGE_SIZE_OVERVIEW = 10;
const PAGE_SIZE_FULL = 30;

const normalizeJob = (job) => (job || "").toString().trim().toLowerCase();

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
      return "bg-gradient-to-r from-[var(--violet)]/25 to-fuchsia-400/10 text-white border-[var(--violet-soft)] shadow-[0_0_0_1px_rgba(124,92,255,0.25)]";
    case "Whitelister":
      return "bg-gradient-to-r from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]";
    default:
      return "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

const RoleBadge = ({ role }) => {
  const Icon =
    role === "Admin" ? Crown : role === "Whitelister" ? BadgeCheck : UserCog;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] ${rolePill(
        role
      )}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold">{role}</span>
    </span>
  );
};

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const reduce = useReducedMotion();

  const discordId = profile?.discord_id;

  const {
    isAdmin,
    isStaff,
    loading: roleLoading,
  } = useDiscordRoles(discordId ? [discordId] : [], [discordId]);

  const TABS = useMemo(
    () => [
      { id: "overview", label: "Panoramica", icon: LayoutDashboard },
      { id: "backgrounds", label: "Background", icon: FileText },
      { id: "users", label: "Utenti", icon: UsersIcon }, // admin
      { id: "logs", label: "Log", icon: Activity }, // admin
      { id: "serverLogs", label: "Log server", icon: Server }, // admin
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
  const [serverLogs, setServerLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [overviewUsersPage, setOverviewUsersPage] = useState(1);
  const [overviewLogsPage, setOverviewLogsPage] = useState(1);

  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [serverLogsPage, setServerLogsPage] = useState(1);

  // ✅ filtro JOB (al posto del filtro gruppo)
  const [jobFilter, setJobFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");

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

  // ✅ admin vede tutti i tab, whitelister solo backgrounds
  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter((t) => t.id === "backgrounds");

  useEffect(() => {
    if (!isAdmin && activeTab !== "backgrounds") setActiveTab("backgrounds");
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    if (!profile) return;

    // whitelister vede solo backgrounds
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

      // ✅ users base
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          discord_username,
          created_at,
          is_moderator,
          is_admin
        `
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error(usersError);
        await alertError("Errore", "Impossibile caricare la lista utenti.");
      } else {
        // ✅ per collegare "Gruppo" al Job:
        // prendiamo il job più recente per user dalla tabella characters
        const { data: charsData, error: charsErr } = await supabase
          .from("characters")
          .select("id, user_id, status, created_at, job")
          .order("created_at", { ascending: false });

        if (charsErr) console.error(charsErr);

        const latestBgByUser = new Map();
        const latestJobByUser = new Map();

        (charsData || []).forEach((ch) => {
          if (!latestBgByUser.has(ch.user_id))
            latestBgByUser.set(ch.user_id, ch.status);
          if (!latestJobByUser.has(ch.user_id))
            latestJobByUser.set(ch.user_id, (ch.job ?? "").trim());
        });

        // ✅ accessi/ore (admin-only)
        const { data: statsData, error: statsErr } = await supabase
          .from("profile_admin_stats")
          .select("profile_id, last_server_join_at, hours_played");

        const statsMap = new Map();
        if (!statsErr) {
          (statsData || []).forEach((r) => {
            statsMap.set(r.profile_id, {
              lastServerJoinAt: r.last_server_join_at ?? null,
              hoursPlayed: Number(r.hours_played ?? 0),
            });
          });
        }

        setUsers(
          (usersData || []).map((u) => {
            const st = statsMap.get(u.id);
            return {
              id: u.id,
              discordName: u.discord_username ?? "Senza nome",
              joinedAt: u.created_at,
              bgStatus: latestBgByUser.get(u.id) ?? "none",
              job: latestJobByUser.get(u.id) ?? "",
              jobNorm: normalizeJob(latestJobByUser.get(u.id) ?? ""),
              isMod: !!u.is_moderator,
              isAdmin: !!u.is_admin,
              lastServerJoinAt: st?.lastServerJoinAt ?? null,
              hoursPlayed: Number(st?.hoursPlayed ?? 0),
            };
          })
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

      const { data: serverLogsData, error: serverLogsError } = await supabase
        .from("server_logs")
        .select("id, plugin, plugin_type, description, created_at")
        .order("created_at", { ascending: false });

      if (serverLogsError) {
        console.error(serverLogsError);
        await alertError("Errore", "Impossibile caricare i log server.");
      } else {
        setServerLogs(
          (serverLogsData || []).map((l) => ({
            id: l.id,
            plugin: l.plugin ?? "unknown",
            plugin_type: l.plugin_type ?? "GENERIC",
            description: l.description ?? "",
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

  // ✅ opzioni filtro JOB
  const jobOptions = useMemo(() => {
    const map = new Map(); // norm->display
    users.forEach((u) => {
      const raw = (u.job || "").trim();
      const norm = normalizeJob(raw);
      if (!raw) return;
      if (!map.has(norm)) map.set(norm, raw);
    });

    const list = Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([norm, display]) => ({ norm, display }));

    return [{ norm: "ALL", display: "Tutti i job" }, ...list];
  }, [users]);

  const filteredUsers = useMemo(() => {
    let base = users;

    const q = userSearch.trim().toLowerCase();
    if (q) {
      base = base.filter((u) => {
        const hay = [u.discordName, u.id, u.job]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (jobFilter !== "ALL") {
      base = base.filter((u) => u.jobNorm === jobFilter);
    }

    return base;
  }, [users, userSearch, jobFilter]);

  useEffect(() => {
    setUsersPage(1);
  }, [jobFilter, userSearch]);

  const overviewUsersTotalPages = Math.max(
    1,
    Math.ceil(users.length / PAGE_SIZE_OVERVIEW)
  );
  const overviewLogsTotalPages = Math.max(
    1,
    Math.ceil(logs.length / PAGE_SIZE_OVERVIEW)
  );

  const usersTotalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE_FULL)
  );
  const logsTotalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE_FULL));
  const serverLogsTotalPages = Math.max(
    1,
    Math.ceil(serverLogs.length / PAGE_SIZE_FULL)
  );

  const overviewUsers = paginate(users, overviewUsersPage, PAGE_SIZE_OVERVIEW);
  const overviewLogs = paginate(logs, overviewLogsPage, PAGE_SIZE_OVERVIEW);

  const paginatedUsers = paginate(filteredUsers, usersPage, PAGE_SIZE_FULL);
  const paginatedLogs = paginate(logs, logsPage, PAGE_SIZE_FULL);
  const paginatedServerLogs = paginate(
    serverLogs,
    serverLogsPage,
    PAGE_SIZE_FULL
  );

  const roleLabel = (u) =>
    u.isAdmin ? "Admin" : u.isMod ? "Whitelister" : "User";

  const pageAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: reduce ? 0 : -8, transition: { duration: 0.16 } },
  };

  // ---------- GATES ----------
  if (authLoading || roleLoading) {
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

  const staffRole = isAdmin ? "Admin" : "Whitelister";

  const TabCount = (tabId) => {
    if (!isAdmin) return null;
    if (tabId === "users") return stats.totalUsers;
    if (tabId === "logs") return logs.length;
    if (tabId === "serverLogs") return serverLogs.length;
    if (tabId === "backgrounds") return stats.pendingBackgrounds;
    return null;
  };

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
                  {isAdmin ? "Admin Dashboard" : "Area Whitelister"}
                </h1>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] truncate">
                  {isAdmin
                    ? "Controllo completo su utenti, background e log."
                    : "Moderazione background (commenti + job sempre)."}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <RoleBadge role={staffRole} />
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
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                              Job:{" "}
                              <span className="text-white/80 font-semibold">
                                {u.job || "—"}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <RoleBadge role={roleLabel(u)} />
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
            <BackgroundQueue />
          </motion.section>
        )}

        {/* USERS */}
        {isAdmin && activeTab === "users" && (
          <motion.section key="users" {...pageAnim} className="space-y-4">
            <div className={`${shellCard} p-4 md:p-5 space-y-3`}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Utenti registrati
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                    Job = gruppo (preso dai background). Ultimo accesso + ore
                    giocate.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Cerca utente (discord/id/job)"
                      className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                    />
                  </div>

                  {/* job filter */}
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={jobFilter}
                      onChange={(e) => setJobFilter(e.target.value)}
                      className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                    >
                      {jobOptions.map((j) => (
                        <option key={j.norm} value={j.norm}>
                          {j.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs text-[var(--color-text-muted)]">
                    {buildRangeLabel(
                      filteredUsers.length,
                      usersPage,
                      PAGE_SIZE_FULL
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedUsers.map((u) => {
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

                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                            Ultimo accesso:{" "}
                            <span className="text-white/80">
                              {u.lastServerJoinAt
                                ? new Date(u.lastServerJoinAt).toLocaleString(
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
                              {Number(u.hoursPlayed || 0).toFixed(1)}
                            </span>
                          </p>

                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            Iscritto il{" "}
                            {new Date(u.joinedAt).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                            <span className="mx-2 opacity-50">•</span>
                            <span className="font-mono opacity-80">
                              {u.id.slice(0, 8)}…
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <RoleBadge role={currentRole} />
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

        {/* SERVER LOGS */}
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
                    Eventi dai plugin/risorse FiveM.
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
                          {l.plugin} - {l.plugin_type}
                        </span>
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
