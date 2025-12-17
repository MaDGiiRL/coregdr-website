import { useEffect, useMemo, useState } from "react";
import { useDiscordRoles } from "../../hooks/useDiscordRoles";
import { useServerAccess } from "../../hooks/useServerAccess";
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
  Plug,
  Plus,
  Trash2,
} from "lucide-react";

import BackgroundQueue from "./BackgroundQueue";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { alertError } from "../../lib/alerts";

const PAGE_SIZE_OVERVIEW = 10;
const PAGE_SIZE_FULL = 30;

const normalizeJob = (job) => (job || "").toString().trim().toLowerCase();

const safeMeta = (obj) => {
  try {
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
};

// ---------- BADGES (UI) ----------
const badgeBase =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap";

const BADGE = {
  // roles
  role_admin:
    "bg-gradient-to-r from-fuchsia-500/25 to-violet-500/10 text-white border-fuchsia-400/35 shadow-[0_0_0_1px_rgba(217,70,239,0.16)]",
  role_whitelister:
    "bg-gradient-to-r from-amber-400/20 to-orange-400/10 text-amber-200 border-amber-400/35 shadow-[0_0_0_1px_rgba(251,191,36,0.14)]",
  role_user:
    "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",

  // background status
  bg_pending:
    "bg-yellow-400/15 text-yellow-300 border-yellow-400/40 shadow-[0_0_0_1px_rgba(250,204,21,0.12)]",
  bg_approved:
    "bg-emerald-400/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_0_1px_rgba(52,211,153,0.12)]",
  bg_rejected:
    "bg-rose-400/15 text-rose-300 border-rose-400/40 shadow-[0_0_0_1px_rgba(251,113,133,0.12)]",
  bg_none:
    "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]",

  // job
  job: "bg-cyan-400/10 text-cyan-200 border-cyan-400/25 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",

  // ✅ pg badge
  pg: "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",

  // logs type
  log_generic:
    "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",
  log_auth: "bg-sky-400/10 text-sky-200 border-sky-400/25",
  log_dash: "bg-violet-400/10 text-violet-200 border-violet-400/25",
  log_notif: "bg-teal-400/10 text-teal-200 border-teal-400/25",
  log_error: "bg-rose-400/15 text-rose-300 border-rose-400/35",

  // server logs
  srv_generic:
    "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",
  srv_plugin: "bg-indigo-400/10 text-indigo-200 border-indigo-400/25",
  srv_resource: "bg-emerald-400/10 text-emerald-200 border-emerald-400/25",
};

const Badge = ({ variant = "log_generic", icon: Icon, children, title }) => (
  <span
    className={`${badgeBase} ${BADGE[variant] || BADGE.log_generic}`}
    title={title}
  >
    {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
    <span className="truncate">{children}</span>
  </span>
);

const roleVariant = (role) =>
  role === "Admin"
    ? "role_admin"
    : role === "Whitelister"
    ? "role_whitelister"
    : "role_user";

const bgVariant = (status) =>
  status === "pending"
    ? "bg_pending"
    : status === "approved"
    ? "bg_approved"
    : status === "rejected"
    ? "bg_rejected"
    : "bg_none";

const logVariant = (type) => {
  const t = (type || "").toString().toUpperCase();
  if (t.includes("ERROR") || t.includes("FAIL")) return "log_error";
  if (t.startsWith("AUTH")) return "log_auth";
  if (t.startsWith("DASH")) return "log_dash";
  if (t.startsWith("NOTIF")) return "log_notif";
  return "log_generic";
};

const srvVariant = (pluginType) => {
  const t = (pluginType || "").toString().toUpperCase();
  if (t.includes("PLUGIN")) return "srv_plugin";
  if (t.includes("RESOURCE")) return "srv_resource";
  return "srv_generic";
};
// -------------------------------

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

  // ✅ filtro JOB
  const [jobFilter, setJobFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");

  // ✅ nuovi filtri “categoria”
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | Admin | Whitelister | User
  const [bgFilter, setBgFilter] = useState("ALL"); // ALL | pending | approved | rejected | none

  const [logTypeFilter, setLogTypeFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  const [srvTypeFilter, setSrvTypeFilter] = useState("ALL");
  const [srvSearch, setSrvSearch] = useState("");

  const shellCard =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.35)]";
  const softPanel =
    "rounded-2xl border border-[var(--color-border)] bg-black/20";

  // --- MODAL: user characters
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCharacters, setUserCharacters] = useState([]);
  const [userCharsLoading, setUserCharsLoading] = useState(false);
  const [userCharsError, setUserCharsError] = useState("");

  // server logs extra filters
  const [srvPluginFilter, setSrvPluginFilter] = useState("ALL");

  const writeLog = async (type, message, meta = {}) => {
    try {
      const res = await supabase.from("logs").insert({
        type,
        message,
        meta: {
          ...safeMeta(meta),
          user_id: profile?.id,
          discord_id: profile?.discord_id,
          provider: "discord",
          author: profile?.discord_username,
        },
        created_at: new Date().toISOString(),
      });

      if (res?.error) {
        await supabase.from("logs").insert({
          type,
          message,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      try {
        await supabase.from("logs").insert({
          type,
          message,
          created_at: new Date().toISOString(),
        });
      } catch (e2) {
        console.debug("[LOGS] writeLog failed:", e2?.message || e2);
      }
    }
  };

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

  const accessEnabled = isAdmin;

  const {
    accessMap,
    loading: accessLoading,
    error: accessError,
  } = useServerAccess({ enabled: accessEnabled });

  const fetchData = async () => {
    if (!profile) return;

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
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
      ]);

      setStats({
        totalUsers: usersCountRes.count ?? 0,
        totalBackgrounds: totalBgRes.count ?? 0,
        pendingBackgrounds: pendingBgRes.count ?? 0,
        approvedBackgrounds: approvedBgRes.count ?? 0,
        rejectedBackgrounds: rejectedBgRes.count ?? 0,
      });

      // ✅ users base (+ pg_num)
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          discord_id,
          discord_username,
          created_at,
          is_moderator,
          is_admin,
          pg_num
        `
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error(usersError);
        await alertError("Errore", "Impossibile caricare la lista utenti.");
      } else {
        const { data: charsData, error: charsErr } = await supabase
          .from("characters")
          .select("id, user_id, status, created_at, job")
          .order("created_at", { ascending: false });

        if (charsErr) console.error(charsErr);

        const latestBgByUser = new Map();
        const latestJobByUser = new Map();

        // ✅ conta PG per user (tutti i characters)
        const pgCountByUser = new Map();

        (charsData || []).forEach((ch) => {
          pgCountByUser.set(
            ch.user_id,
            (pgCountByUser.get(ch.user_id) ?? 0) + 1
          );

          if (!latestBgByUser.has(ch.user_id))
            latestBgByUser.set(ch.user_id, ch.status);
          if (!latestJobByUser.has(ch.user_id))
            latestJobByUser.set(ch.user_id, (ch.job ?? "").trim());
        });

        setUsers(
          (usersData || []).map((u) => {
            const stList = accessMap.get(u.discord_id) ?? [];

            let lastServerJoinAt = null;
            let hoursPlayed = 0;

            stList.forEach((userMap) => {
              for (const [, data] of userMap) {
                if (data.lastServerJoinAt) {
                  const date = new Date(data.lastServerJoinAt);
                  if (!lastServerJoinAt || date > lastServerJoinAt) {
                    lastServerJoinAt = date;
                  }
                }
                hoursPlayed += Number(data.hoursPlayed ?? 0);
              }
            });

            const bgStatus = latestBgByUser.get(u.id) ?? "none";
            const job = latestJobByUser.get(u.id) ?? "";

            const pgMax = Math.max(1, Number(u.pg_num ?? 1));
            const pgCount = pgCountByUser.get(u.id) ?? 0;

            return {
              id: u.id,
              discord_id: u.discord_id,
              discordName: u.discord_username ?? "Senza nome",
              joinedAt: u.created_at,
              bgStatus,
              job,
              jobNorm: normalizeJob(job),
              isMod: !!u.is_moderator,
              isAdmin: !!u.is_admin,
              lastServerJoinAt,
              hoursPlayed,

              // ✅ nuovi campi (solo UI)
              pgMax,
              pgCount,
            };
          })
        );
      }

      const { data: logsData, error: logsError } = await supabase
        .from("logs")
        .select("id, type, message, created_at, meta")
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
            meta: l.meta ?? null,
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

  const openUserModal = async (u) => {
    setSelectedUser(u);
    setUserModalOpen(true);
    setUserCharacters([]);
    setUserCharsError("");
    setUserCharsLoading(true);

    try {
      const { data, error } = await supabase
        .from("characters")
        .select(
          `
        id,
        created_at,
        allowing,
        status,
        job,
        firstname,
        lastname,
        user_id,
        profiles!inner(discord_id)
      `
        )
        .eq("profiles.discord_id", u.discord_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const stList = accessMap.get(u.discord_id) ?? [];
      let lastServerJoinAt = null;
      let hoursPlayed = 0;

      stList.forEach((userMap) => {
        for (const [, data] of userMap) {
          if (data.lastServerJoinAt) {
            const d = new Date(data.lastServerJoinAt);
            if (!lastServerJoinAt || d > lastServerJoinAt) lastServerJoinAt = d;
          }
          hoursPlayed += Number(data.hoursPlayed ?? 0);
        }
      });

      const mapped = (data || []).map((ch) => ({
        id: ch.id,
        createdAt: ch.created_at,
        status: ch.status ?? "none",
        job: (ch.job ?? "").trim(),
        name:
          [ch.firstname, ch.lastname].filter(Boolean).join(" ").trim() ||
          `PG #${ch.id}`,
        lastServerJoinAt,
        hoursPlayed,

        // ✅ flag per distinguere eventuali PG aggiunti lato UI
        __local: false,
      }));

      setUserCharacters(mapped);

      // ✅ sincronizza pgCount UI col numero reale caricato (solo UI)
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, pgCount: mapped.length } : x))
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, pgCount: mapped.length } : prev
      );
    } catch (e) {
      console.error(e);
      setUserCharsError("Impossibile caricare i personaggi di questo utente.");
    } finally {
      setUserCharsLoading(false);
    }
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setSelectedUser(null);
    setUserCharacters([]);
    setUserCharsError("");
  };

  // ✅ SOLO FRONTEND: admin add/remove PG (non tocca il backend)
  const canAdminEditPG = isAdmin && !!selectedUser;

  const addLocalCharacter = async () => {
    if (!selectedUser) return;

    const max = Math.max(1, Number(selectedUser.pgMax ?? 1));
    const count = Number(selectedUser.pgCount ?? userCharacters.length ?? 0);

    if (count >= max) {
      await alertError(
        "Limite raggiunto",
        `Questo utente ha già ${count}/${max} PG.`
      );
      return;
    }

    const newCh = {
      id: `local_${
        crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)
      }`,
      createdAt: new Date().toISOString(),
      status: "none",
      job: "",
      name: `PG #${count + 1}`,
      lastServerJoinAt: userCharacters?.[0]?.lastServerJoinAt ?? null,
      hoursPlayed: userCharacters?.[0]?.hoursPlayed ?? 0,
      __local: true,
    };

    setUserCharacters((prev) => [newCh, ...prev]);

    const nextCount = count + 1;
    setUsers((prev) =>
      prev.map((x) =>
        x.id === selectedUser.id ? { ...x, pgCount: nextCount } : x
      )
    );
    setSelectedUser((prev) => (prev ? { ...prev, pgCount: nextCount } : prev));

    await writeLog(
      "DASH_PG_ADD_UI",
      `Aggiunto PG (solo UI) a ${selectedUser.discordName}`,
      {
        target_user_id: selectedUser.id,
        target_discord_id: selectedUser.discord_id,
      }
    );
  };

  const removeLocalCharacter = async (chId) => {
    if (!selectedUser) return;

    const before = userCharacters.length;
    const nextList = userCharacters.filter((c) => c.id !== chId);
    if (nextList.length === before) return;

    setUserCharacters(nextList);

    const nextCount = nextList.length;
    setUsers((prev) =>
      prev.map((x) =>
        x.id === selectedUser.id ? { ...x, pgCount: nextCount } : x
      )
    );
    setSelectedUser((prev) => (prev ? { ...prev, pgCount: nextCount } : prev));

    await writeLog(
      "DASH_PG_REMOVE_UI",
      `Rimosso PG (solo UI) da ${selectedUser.discordName}`,
      {
        target_user_id: selectedUser.id,
        target_discord_id: selectedUser.discord_id,
        character_id: chId,
      }
    );
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAdmin, accessMap]);

  // ✅ poll leggero logs quando sei in overview/logs
  useEffect(() => {
    if (!isAdmin) return;
    if (loadingData) return;

    const shouldPoll = activeTab === "logs" || activeTab === "overview";
    if (!shouldPoll) return;

    let alive = true;

    const tick = async () => {
      try {
        const { data, error } = await supabase
          .from("logs")
          .select("id, type, message, created_at, meta")
          .order("created_at", { ascending: false })
          .limit(1000);

        if (!alive) return;
        if (!error) {
          setLogs(
            (data || []).map((l) => ({
              id: l.id,
              type: l.type ?? "GENERIC",
              message: l.message ?? "",
              createdAt: l.created_at,
              meta: l.meta ?? null,
            }))
          );
        }
      } catch (e) {
        console.debug("[LOGS] poll failed:", e?.message || e);
      }
    };

    tick();
    const t = setInterval(tick, 8000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [isAdmin, activeTab, loadingData]);

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

  const roleLabel = (u) =>
    u.isAdmin ? "Admin" : u.isMod ? "Whitelister" : "User";

  const filteredUsers = useMemo(() => {
    let base = users;

    const q = userSearch.trim().toLowerCase();
    if (q) {
      base = base.filter((u) => {
        const hay = [
          u.discordName,
          u.id,
          u.job,
          u.bgStatus,
          `${u.pgCount}/${u.pgMax}`,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (jobFilter !== "ALL") base = base.filter((u) => u.jobNorm === jobFilter);
    if (roleFilter !== "ALL")
      base = base.filter((u) => roleLabel(u) === roleFilter);
    if (bgFilter !== "ALL")
      base = base.filter((u) => (u.bgStatus || "none") === bgFilter);

    return base;
  }, [users, userSearch, jobFilter, roleFilter, bgFilter]);

  // ✅ LOGS: opzioni + filtro
  const logTypeOptions = useMemo(() => {
    const set = new Set(
      (logs || []).map((l) => (l.type || "GENERIC").toString())
    );
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["ALL", ...list];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let base = logs;

    const q = logSearch.trim().toLowerCase();
    if (q) {
      base = base.filter((l) => {
        const hay = [l.type, l.message].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    if (logTypeFilter !== "ALL") {
      base = base.filter((l) => (l.type || "GENERIC") === logTypeFilter);
    }

    return base;
  }, [logs, logSearch, logTypeFilter]);

  // ✅ SERVER LOGS: opzioni + filtro
  const srvTypeOptions = useMemo(() => {
    const set = new Set(
      (serverLogs || []).map((l) => (l.plugin_type || "GENERIC").toString())
    );
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["ALL", ...list];
  }, [serverLogs]);

  const srvPluginOptions = useMemo(() => {
    const set = new Set(
      (serverLogs || []).map((l) => (l.plugin || "unknown").toString())
    );
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["ALL", ...list];
  }, [serverLogs]);

  const filteredServerLogs = useMemo(() => {
    let base = serverLogs;

    const q = srvSearch.trim().toLowerCase();
    if (q) {
      base = base.filter((l) => {
        const hay = [l.plugin, l.plugin_type, l.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (srvTypeFilter !== "ALL") {
      base = base.filter((l) => (l.plugin_type || "GENERIC") === srvTypeFilter);
    }

    if (srvPluginFilter !== "ALL") {
      base = base.filter((l) => (l.plugin || "unknown") === srvPluginFilter);
    }

    return base;
  }, [serverLogs, srvSearch, srvTypeFilter, srvPluginFilter]);

  // ✅ reset pagine quando cambiano filtri
  useEffect(
    () => setUsersPage(1),
    [jobFilter, userSearch, roleFilter, bgFilter]
  );
  useEffect(() => setLogsPage(1), [logTypeFilter, logSearch]);
  useEffect(
    () => setServerLogsPage(1),
    [srvTypeFilter, srvPluginFilter, srvSearch]
  );

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
  const logsTotalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / PAGE_SIZE_FULL)
  );
  const serverLogsTotalPages = Math.max(
    1,
    Math.ceil(filteredServerLogs.length / PAGE_SIZE_FULL)
  );

  const overviewUsers = paginate(users, overviewUsersPage, PAGE_SIZE_OVERVIEW);
  const overviewLogs = paginate(logs, overviewLogsPage, PAGE_SIZE_OVERVIEW);

  const paginatedUsers = paginate(filteredUsers, usersPage, PAGE_SIZE_FULL);
  const paginatedLogs = paginate(filteredLogs, logsPage, PAGE_SIZE_FULL);
  const paginatedServerLogs = paginate(
    filteredServerLogs,
    serverLogsPage,
    PAGE_SIZE_FULL
  );

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
    if (tabId === "logs") return filteredLogs.length;
    if (tabId === "serverLogs") return filteredServerLogs.length;
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
              <Badge
                variant={roleVariant(staffRole)}
                icon={staffRole === "Admin" ? Crown : BadgeCheck}
              >
                {staffRole}
              </Badge>

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
                onClick={async () => {
                  await writeLog(
                    "DASH_REFRESH",
                    "Admin ha aggiornato i dati dashboard",
                    {
                      staff_id: profile?.id,
                      staff_discord_id: profile?.discord_id,
                    }
                  );
                  await fetchData();
                }}
                className="px-4 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 text-xs md:text-sm font-semibold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna dati
              </motion.button>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.97 }}
              onClick={async () => {
                setActiveTab("backgrounds");
                await writeLog("DASH_GOTO_BG", "Vai ai background", {
                  staff_id: profile?.id,
                  staff_discord_id: profile?.discord_id,
                });
              }}
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
                onClick={async () => {
                  setActiveTab(tab.id);
                  if (isAdmin) {
                    await writeLog("DASH_TAB", `Cambio tab: ${tab.id}`, {
                      staff_id: profile?.id,
                      staff_discord_id: profile?.discord_id,
                      tab: tab.id,
                    });
                  }
                }}
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
                    {overviewUsers.map((u) => {
                      const currentRole = roleLabel(u);
                      return (
                        <div
                          key={u.id}
                          className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
                        >
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

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant={roleVariant(currentRole)}
                                icon={
                                  currentRole === "Admin"
                                    ? Crown
                                    : currentRole === "Whitelister"
                                    ? BadgeCheck
                                    : UserCog
                                }
                              >
                                {currentRole}
                              </Badge>

                              <Badge
                                variant={bgVariant(u.bgStatus)}
                                icon={FileText}
                                title="Stato background"
                              >
                                {u.bgStatus === "none"
                                  ? "BG: —"
                                  : `BG: ${u.bgStatus}`}
                              </Badge>

                              <Badge
                                variant="job"
                                icon={Briefcase}
                                title="Job (dal background)"
                              >
                                {u.job ? `Job: ${u.job}` : "Job: —"}
                              </Badge>

                              {/* ✅ PG badge */}
                              <Badge
                                variant="pg"
                                icon={UsersIcon}
                                title="Personaggi / slot (pg_num)"
                              >
                                PG: {u.pgCount ?? 0} / {u.pgMax ?? 1}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}

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
                          <Badge variant={logVariant(l.type)} icon={Activity}>
                            {l.type}
                          </Badge>
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

                        {l.meta?.author && (
                          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                            <span>Autore: </span>
                            <span className="font-semibold">
                              {l.meta.author}
                            </span>
                          </div>
                        )}

                        {l.meta?.discord_id && (
                          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                            <span>Discord ID: </span>
                            <span className="font-semibold">
                              {l.meta.discord_id}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Cerca utente (discord/id/job/bg)"
                      className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                    />
                  </div>

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

                  <div className="relative">
                    <UserCog className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                    >
                      <option value="ALL">Tutti i ruoli</option>
                      <option value="Admin">Admin</option>
                      <option value="Whitelister">Whitelister</option>
                      <option value="User">User</option>
                    </select>
                  </div>

                  <div className="relative">
                    <FileText className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={bgFilter}
                      onChange={(e) => setBgFilter(e.target.value)}
                      className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                    >
                      <option value="ALL">Tutti BG</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="none">Nessun BG</option>
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
                    <motion.button
                      key={u.id}
                      type="button"
                      onClick={() => openUserModal(u)}
                      whileTap={{ scale: reduce ? 1 : 0.99 }}
                      className="
                        w-full text-left
                        rounded-2xl border border-[var(--color-border)]
                        bg-black/20 px-4 py-3
                        hover:bg-white/5 transition
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]
                      "
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
                            <span className="font-mono opacity-80">
                              {u.discord_id}
                            </span>
                            <span className="mx-2 opacity-50">•</span>
                            Iscritto il{" "}
                            {new Date(u.joinedAt).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge
                              variant={roleVariant(currentRole)}
                              icon={
                                currentRole === "Admin"
                                  ? Crown
                                  : currentRole === "Whitelister"
                                  ? BadgeCheck
                                  : UserCog
                              }
                            >
                              {currentRole}
                            </Badge>

                            {/* ✅ PG badge nella lista utenti */}
                            <Badge
                              variant="pg"
                              icon={UsersIcon}
                              title="Personaggi / slot (pg_num)"
                            >
                              PG: {u.pgCount ?? 0} / {u.pgMax ?? 1}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          {/* spazio azioni future */}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}

                {paginatedUsers.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
                    Nessun utente corrisponde ai filtri.
                  </p>
                )}
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
                  {buildRangeLabel(
                    filteredLogs.length,
                    logsPage,
                    PAGE_SIZE_FULL
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Cerca nei log..."
                    className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                  />
                </div>

                <div className="relative">
                  <Activity className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={logTypeFilter}
                    onChange={(e) => setLogTypeFilter(e.target.value)}
                    className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                  >
                    {logTypeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t === "ALL" ? "Tutti i type" : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedLogs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={logVariant(l.type)} icon={Activity}>
                        {l.type}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {new Date(l.createdAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <p className="mt-2 text-xs md:text-sm text-[var(--color-text)]">
                      {l.message}
                    </p>

                    {l.meta?.author && (
                      <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                        <span>Autore: </span>
                        <span className="font-semibold">{l.meta.author}</span>
                      </div>
                    )}
                  </div>
                ))}

                {paginatedLogs.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
                    Nessun log corrisponde ai filtri.
                  </p>
                )}
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
                    filteredServerLogs.length,
                    serverLogsPage,
                    PAGE_SIZE_FULL
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={srvSearch}
                    onChange={(e) => setSrvSearch(e.target.value)}
                    placeholder="Cerca testo (plugin/type/descrizione)..."
                    className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                  />
                </div>

                <div className="relative">
                  <Plug className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={srvPluginFilter}
                    onChange={(e) => setSrvPluginFilter(e.target.value)}
                    className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                  >
                    {srvPluginOptions.map((p) => (
                      <option key={p} value={p}>
                        {p === "ALL" ? "Tutti i plugin" : p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Server className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={srvTypeFilter}
                    onChange={(e) => setSrvTypeFilter(e.target.value)}
                    className="pl-10 pr-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 text-xs outline-none focus:border-[var(--blue)]"
                  >
                    {srvTypeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t === "ALL" ? "Tutti i type" : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {paginatedServerLogs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Badge variant="srv_plugin" icon={Plug}>
                          {l.plugin}
                        </Badge>
                        <Badge
                          variant={srvVariant(l.plugin_type)}
                          icon={Server}
                        >
                          {l.plugin_type}
                        </Badge>
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
                  <p className="text-xs text-[var(--color-text-muted)] px-2 py-3">
                    Nessun server log corrisponde ai filtri.
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

      {/* MODAL PG */}
      <AnimatePresence>
        {userModalOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Chiudi"
              onClick={closeUserModal}
              className="absolute inset-0 bg-black/70"
            />

            <motion.div
              initial={{
                opacity: 0,
                y: reduce ? 0 : 12,
                scale: reduce ? 1 : 0.98,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : 10,
                scale: reduce ? 1 : 0.98,
              }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
            >
              <div className="p-5 md:p-6 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Personaggi utente
                    </p>
                    <h3 className="mt-1 text-lg md:text-xl font-semibold truncate">
                      {selectedUser?.discordName ?? "Utente"}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Discord ID:{" "}
                      <span className="font-mono">
                        {selectedUser?.discord_id}
                      </span>
                    </p>

                    {/* ✅ PG x/y */}
                    {selectedUser && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          variant="pg"
                          icon={UsersIcon}
                          title="Personaggi / slot (pg_num)"
                        >
                          PG: {userCharacters.length} /{" "}
                          {selectedUser.pgMax ?? 1}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ✅ Admin add (SOLO UI) */}
                    {canAdminEditPG && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: reduce ? 1 : 0.97 }}
                        onClick={addLocalCharacter}
                        disabled={
                          userCharacters.length >= (selectedUser.pgMax ?? 1)
                        }
                        className="px-3 py-2 rounded-2xl bg-[var(--violet)] text-white text-xs font-semibold shadow-md hover:brightness-110 inline-flex items-center gap-2 disabled:opacity-40"
                        title="Aggiungi PG (solo frontend)"
                      >
                        <Plus className="w-4 h-4" />
                        Aggiungi PG
                      </motion.button>
                    )}

                    <button
                      type="button"
                      onClick={closeUserModal}
                      className="px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 text-xs font-semibold"
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                {userCharsLoading && (
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Caricamento personaggi…
                  </div>
                )}

                {!userCharsLoading && userCharsError && (
                  <div className="text-xs text-rose-300">{userCharsError}</div>
                )}

                {!userCharsLoading && !userCharsError && (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {userCharacters.map((ch) => (
                      <div
                        key={ch.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-4 py-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{ch.name}</p>

                            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                              Creato il{" "}
                              {new Date(ch.createdAt).toLocaleString("it-IT", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                              {ch.__local ? (
                                <span className="ml-2 opacity-70">
                                  (solo UI)
                                </span>
                              ) : null}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant={bgVariant(ch.status)}
                                icon={FileText}
                              >
                                {ch.status === "none"
                                  ? "BG: —"
                                  : `BG: ${ch.status}`}
                              </Badge>

                              <Badge variant="job" icon={Briefcase}>
                                {ch.job ? `Job: ${ch.job}` : "Job: —"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-[11px] text-[var(--color-text-muted)] space-y-1 md:text-right">
                              <div>
                                Ultimo accesso:{" "}
                                <span className="text-white/80">
                                  {ch.lastServerJoinAt
                                    ? new Date(
                                        ch.lastServerJoinAt
                                      ).toLocaleString("it-IT", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                Ore in gioco:{" "}
                                <span className="text-white/80 font-semibold">
                                  {Number(ch.hoursPlayed || 0).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {/* ✅ Admin remove (SOLO UI) */}
                            {canAdminEditPG && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: reduce ? 1 : 0.97 }}
                                onClick={() => removeLocalCharacter(ch.id)}
                                className="ml-2 px-3 py-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 hover:bg-rose-400/15 text-rose-200 text-xs font-semibold inline-flex items-center gap-2"
                                title="Rimuovi PG (solo frontend)"
                              >
                                <Trash2 className="w-4 h-4" />
                                Rimuovi
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {userCharacters.length === 0 && (
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Nessun personaggio trovato per questo utente.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
