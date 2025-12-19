import { useEffect, useMemo, useState } from "react";
import { useDiscordRoles } from "../../hooks/useDiscordRoles";
import { useServerAccess } from "../../hooks/useServerAccess";
import { useServerPGs } from "../../hooks/useServerPGs";
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

// components (presentational)
import AdminDashboardHeader from "../../components/admin/admin-dashboard/AdminDashboardHeader";
import AdminTabsNav from "../../components/admin/admin-dashboard/AdminTabsNav";
import OverviewTab from "../../components/admin/admin-dashboard/OverviewTab";
import UsersTab from "../../components/admin/admin-dashboard/UsersTab";
import LogsTab from "../../components/admin/admin-dashboard/LogsTab";
import ServerLogsTab from "../../components/admin/admin-dashboard/ServerLogsTab";
import UserCharactersModal from "../../components/admin/admin-dashboard/UserCharactersModal";

// UI helpers (solo UI)
import {
  Badge,
  roleVariant,
  bgVariant,
  logVariant,
  srvVariant,
} from "../../components/admin/admin-dashboard/UI";

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
      { id: "users", label: "Utenti", icon: UsersIcon },
      { id: "logs", label: "Log", icon: Activity },
      { id: "serverLogs", label: "Log server", icon: Server },
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
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [bgFilter, setBgFilter] = useState("ALL");

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
  const { accessMap } = useServerAccess({ enabled: accessEnabled });
  const { pgMap } = useServerPGs({ enabled: accessEnabled });

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
            const pgList = pgMap.get(u.discord_id) ?? [];

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
      // Prendi i personaggi dal pgMap (già caricato dall'API)
      const pgList = pgMap.get(u.discord_id) ?? [];

      let lastServerJoinAt = null;
      let hoursPlayed = 0;

      // Calcola ultimo join e ore totali
      pgList.forEach((userMap) => {
        for (const [, data] of userMap) {
          if (data.lastServerJoinAt) {
            const d = new Date(data.lastServerJoinAt);
            if (!lastServerJoinAt || d > lastServerJoinAt) lastServerJoinAt = d;
          }
          hoursPlayed += Number(data.hoursPlayed ?? 0);
        }
      });

      // Aggiorna lo stato con i personaggi
      setUserCharacters(pgList);

      // Aggiorna il pgCount nell'interfaccia
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, pgCount: pgList.length } : x
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, pgCount: pgList.length } : prev
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

    try {
      const currentMax = Number(selectedUser.pgMax ?? 0);

      // Incrementa pg_num su Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ pg_num: currentMax + 1 })
        .eq("discord_id", selectedUser.discord_id);

      if (error) throw error;

      const nextMax = currentMax + 1;
      setUsers((prev) =>
        prev.map((x) =>
          x.id === selectedUser.id ? { ...x, pgMax: nextMax } : x
        )
      );
      setSelectedUser((prev) => (prev ? { ...prev, pgMax: nextMax } : prev));

      await writeLog(
        "DASH_PG_ADD_DB",
        `Incrementato pg_num per ${selectedUser.discordName}`,
        {
          target_user_id: selectedUser.id,
          target_discord_id: selectedUser.discord_id,
        }
      );
    } catch (e) {
      console.error(e);
      setUserCharsError("Impossibile aggiornare i PG dell'utente.");
    }
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
  }, [profile, isAdmin, accessMap, pgMap]);

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
      <AdminDashboardHeader
        shellCard={shellCard}
        reduce={reduce}
        isAdmin={isAdmin}
        staffRole={staffRole}
        profile={profile}
        Badge={Badge}
        roleVariant={roleVariant}
        icons={{ Shield, Crown, BadgeCheck, RefreshCw, FileText }}
        onRefresh={async () => {
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
        onGotoBackgrounds={async () => {
          setActiveTab("backgrounds");
          await writeLog("DASH_GOTO_BG", "Vai ai background", {
            staff_id: profile?.id,
            staff_discord_id: profile?.discord_id,
          });
        }}
      />

      <AdminTabsNav
        shellCard={shellCard}
        reduce={reduce}
        visibleTabs={visibleTabs}
        activeTab={activeTab}
        onTabClick={async (tabId) => {
          setActiveTab(tabId);
          if (isAdmin) {
            await writeLog("DASH_TAB", `Cambio tab: ${tabId}`, {
              staff_id: profile?.id,
              staff_discord_id: profile?.discord_id,
              tab: tabId,
            });
          }
        }}
        tabCount={TabCount}
      />

      {loadingData && isAdmin && (
        <div
          className={`${softPanel} px-4 py-3 text-xs text-[var(--color-text-muted)]`}
        >
          Caricamento dati admin…
        </div>
      )}

      <AnimatePresence mode="wait">
        {!loadingData && isAdmin && activeTab === "overview" && (
          <motion.section key="overview" {...pageAnim} className="space-y-6">
            <OverviewTab
              shellCard={shellCard}
              reduce={reduce}
              stats={stats}
              overviewUsers={overviewUsers}
              overviewLogs={overviewLogs}
              overviewUsersPage={overviewUsersPage}
              setOverviewUsersPage={setOverviewUsersPage}
              overviewUsersTotalPages={overviewUsersTotalPages}
              overviewLogsPage={overviewLogsPage}
              setOverviewLogsPage={setOverviewLogsPage}
              overviewLogsTotalPages={overviewLogsTotalPages}
              buildRangeLabel={buildRangeLabel}
              usersTotal={users.length}
              logsTotal={logs.length}
              roleLabel={roleLabel}
              Badge={Badge}
              variants={{ roleVariant, bgVariant, logVariant }}
              icons={{
                UsersIcon,
                FileText,
                BadgeCheck,
                Activity,
                Crown,
                UserCog,
              }}
            />
          </motion.section>
        )}

        {activeTab === "backgrounds" && (
          <motion.section key="backgrounds" {...pageAnim} className="space-y-4">
            <BackgroundQueue />
          </motion.section>
        )}

        {isAdmin && activeTab === "users" && (
          <motion.section key="users" {...pageAnim} className="space-y-4">
            <UsersTab
              shellCard={shellCard}
              reduce={reduce}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              jobFilter={jobFilter}
              setJobFilter={setJobFilter}
              jobOptions={jobOptions}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              bgFilter={bgFilter}
              setBgFilter={setBgFilter}
              buildRangeLabel={buildRangeLabel}
              total={filteredUsers.length}
              page={usersPage}
              pageSize={PAGE_SIZE_FULL}
              paginatedUsers={paginatedUsers}
              roleLabel={roleLabel}
              openUserModal={openUserModal}
              usersPage={usersPage}
              setUsersPage={setUsersPage}
              usersTotalPages={usersTotalPages}
              Badge={Badge}
              roleVariant={roleVariant}
              icons={{
                UsersIcon,
                Search,
                Briefcase,
                UserCog,
                FileText,
                Crown,
                BadgeCheck,
              }}
            />
          </motion.section>
        )}

        {isAdmin && activeTab === "logs" && (
          <motion.section key="logs" {...pageAnim} className="space-y-4">
            <LogsTab
              shellCard={shellCard}
              reduce={reduce}
              filteredLogs={filteredLogs}
              paginatedLogs={paginatedLogs}
              logsPage={logsPage}
              setLogsPage={setLogsPage}
              logsTotalPages={logsTotalPages}
              logSearch={logSearch}
              setLogSearch={setLogSearch}
              logTypeFilter={logTypeFilter}
              setLogTypeFilter={setLogTypeFilter}
              logTypeOptions={logTypeOptions}
              buildRangeLabel={buildRangeLabel}
              Badge={Badge}
              logVariant={logVariant}
              icons={{ Activity, Search }}
              pageSize={PAGE_SIZE_FULL}
            />
          </motion.section>
        )}

        {isAdmin && activeTab === "serverLogs" && (
          <motion.section key="serverLogs" {...pageAnim} className="space-y-4">
            <ServerLogsTab
              shellCard={shellCard}
              reduce={reduce}
              filteredServerLogs={filteredServerLogs}
              paginatedServerLogs={paginatedServerLogs}
              serverLogsPage={serverLogsPage}
              setServerLogsPage={setServerLogsPage}
              serverLogsTotalPages={serverLogsTotalPages}
              srvSearch={srvSearch}
              setSrvSearch={setSrvSearch}
              srvPluginFilter={srvPluginFilter}
              setSrvPluginFilter={setSrvPluginFilter}
              srvPluginOptions={srvPluginOptions}
              srvTypeFilter={srvTypeFilter}
              setSrvTypeFilter={setSrvTypeFilter}
              srvTypeOptions={srvTypeOptions}
              buildRangeLabel={buildRangeLabel}
              Badge={Badge}
              srvVariant={srvVariant}
              icons={{ Server, Search, Plug }}
              pageSize={PAGE_SIZE_FULL}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <UserCharactersModal
        userModalOpen={userModalOpen}
        reduce={reduce}
        selectedUser={selectedUser}
        userCharacters={userCharacters}
        userCharsLoading={userCharsLoading}
        userCharsError={userCharsError}
        closeUserModal={closeUserModal}
        canAdminEditPG={canAdminEditPG}
        addLocalCharacter={addLocalCharacter}
        removeLocalCharacter={removeLocalCharacter}
        Badge={Badge}
        bgVariant={bgVariant}
        icons={{ UsersIcon, Plus, Trash2, FileText, Briefcase }}
      />
    </section>
  );
}
