import { useEffect, useState } from "react";
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
  Plug,
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

  job: "bg-cyan-400/10 text-cyan-200 border-cyan-400/25 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",
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

  // ✅ writer log (fallback se la colonna meta non esiste)
  const writeLog = async (type, message, meta = {}) => {
    try {
      const res = await supabase.from("logs").insert({
        type,
        message,
        meta: safeMeta(meta),
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

      // ✅ users base
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(
          `id,
          discord_username,
          created_at,
          is_moderator,
          is_admin`
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error(usersError);
        await alertError("Errore", "Impossibile caricare la lista utenti.");
      } else {
        const { data: charsData, error: charsErr } = await supabase
          .from("characters")
          .select("user_id, status, created_at, job")
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

        setUsers(
          (usersData || []).map((u) => {
            const bgStatus = latestBgByUser.get(u.id) ?? "none";
            const job = latestJobByUser.get(u.id) ?? "";
            return {
              id: u.id,
              discordName: u.discord_username ?? "Senza nome",
              joinedAt: u.created_at,
              bgStatus,
              job,
              jobNorm: normalizeJob(job),
              isMod: !!u.is_moderator,
              isAdmin: !!u.is_admin,
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
  }, [profile, isAdmin]);

  // Gestione errori fetch
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
          .select("id, type, message, created_at")
          .order("created_at", { ascending: false })
          .limit(250);

        if (!alive) return;
        if (!error) {
          setLogs(
            (data || []).map((l) => ({
              id: l.id,
              type: l.type ?? "GENERIC",
              message: l.message ?? "",
              createdAt: l.created_at,
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

  // -------------------------------
  return (
    <section className="space-y-6">
      {/* HEADER */}
      <header className="p-5 md:p-6">
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
                variant={roleVariant(isAdmin ? "Admin" : "Whitelister")}
                icon={isAdmin ? Crown : BadgeCheck}
              >
                {isAdmin ? "Admin" : "Whitelister"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            {isAdmin && (
              <motion.button
                whileTap={{ scale: reduce ? 1 : 0.97 }}
                onClick={fetchData}
                className="px-4 py-2 rounded-2xl border bg-black/20 text-xs font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna dati
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className="p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl ${
                  isActive
                    ? "bg-white/5 border-[var(--violet-soft)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Contenuti tab */}
      <AnimatePresence>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "backgrounds" && <BackgroundQueue />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "serverLogs" && <ServerLogsTab />}
      </AnimatePresence>
    </section>
  );
}
