// src/pages/admin/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users as UsersIcon,
  Activity,
  Shield,
} from "lucide-react";

import BackgroundQueue from "./BackgroundQueue";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import {
  alertError,
  alertInfo,
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
      return "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
};

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;
  const isStaff = isAdmin || isMod;

  const reduce = useReducedMotion();

  const TABS = useMemo(
    () => [
      { id: "overview", label: "Panoramica", icon: LayoutDashboard },
      { id: "backgrounds", label: "Background", icon: FileText },
      { id: "users", label: "Utenti", icon: UsersIcon },
      { id: "logs", label: "Log", icon: Activity },
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

  const [loadingData, setLoadingData] = useState(true);
  const [updatingRoleIds, setUpdatingRoleIds] = useState([]);

  const [overviewUsersPage, setOverviewUsersPage] = useState(1);
  const [overviewLogsPage, setOverviewLogsPage] = useState(1);

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

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter((t) => t.id === "backgrounds");

  useEffect(() => {
    if (!isAdmin && activeTab !== "backgrounds") setActiveTab("backgrounds");
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!profile) return;

    if (!isAdmin) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
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

        // ✅ include is_admin
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
            if (!latestBgByUser.has(ch.user_id)) {
              latestBgByUser.set(ch.user_id, ch.status);
            }
          });

          // ✅ aggiungi isAdmin nello state users
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
      } catch (err) {
        console.error("Error loading admin data", err);
        await alertError("Errore", "Errore imprevisto nel caricamento dati.");
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

  // ✅ 3 ruoli su 2 flag
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
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: reduce ? 0 : -8, transition: { duration: 0.18 } },
  };

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
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--color-text-muted)]" />
          <h1 className="text-2xl md:text-3xl font-semibold">
            {isAdmin ? "Admin dashboard" : "Area moderazione"}
          </h1>
        </div>

        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-3xl">
          {isAdmin
            ? "Panoramica su background, iscritti e attività del server. Accesso riservato allo staff admin."
            : "Area staff dedicata alla moderazione dei background. Puoi solo approvare o rifiutare i BG."}
        </p>
      </header>

      <nav className="border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/80 backdrop-blur px-3 py-2 flex flex-wrap gap-2 text-xs md:text-sm">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 ${
                isActive
                  ? "bg-[var(--violet)] text-white border-[var(--violet-soft)] shadow-md"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </nav>

      {loadingData && isAdmin && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Caricamento dati admin…
        </p>
      )}

      <AnimatePresence mode="wait">
        {!loadingData && isAdmin && activeTab === "overview" && (
          <motion.section key="overview" {...pageAnim} className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Utenti registrati", value: stats.totalUsers },
                { label: "Background inviati", value: stats.totalBackgrounds },
                {
                  label: "BG in attesa",
                  value: stats.pendingBackgrounds,
                  extra: "text-yellow-300",
                },
                {
                  label: "BG approvati / rifiutati",
                  value: `${stats.approvedBackgrounds} / ${stats.rejectedBackgrounds}`,
                },
              ].map((c, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: reduce ? 0 : -2 }}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 flex flex-col gap-2"
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {c.label}
                  </p>
                  <p className={`text-2xl font-semibold ${c.extra ?? ""}`}>
                    {c.value}
                  </p>
                </motion.div>
              ))}
            </div>

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
                      <motion.div
                        key={user.id}
                        whileHover={{ y: reduce ? 0 : -1 }}
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
                      </motion.div>
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
                      className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                      <motion.div
                        key={log.id}
                        whileHover={{ y: reduce ? 0 : -1 }}
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
                      </motion.div>
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
                      className="px-2 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "backgrounds" && (
          <motion.section key="backgrounds" {...pageAnim} className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Coda background
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-3xl">
              Gestisci i background inviati dai giocatori.
            </p>
            <BackgroundQueue />
          </motion.section>
        )}

        {isAdmin && activeTab === "users" && (
          <motion.section key="users" {...pageAnim} className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Utenti registrati
            </h2>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {buildRangeLabel(users.length, usersPage, PAGE_SIZE_FULL)}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Imposta ruolo: User / Mod / Admin.
                </span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {paginatedUsers.map((user) => {
                  const isUpdating = updatingRoleIds.includes(user.id);
                  const isSelf = user.id === profile.id;
                  const currentRole = user.isAdmin
                    ? "Admin"
                    : user.isModerator
                    ? "Mod"
                    : "User";

                  return (
                    <motion.div
                      key={user.id}
                      whileHover={{ y: reduce ? 0 : -1 }}
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

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
                            {currentRole}
                          </span>

                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(user.id, "User")}
                            className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-40 hover:bg-white/5"
                          >
                            User
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(user.id, "Mod")}
                            className="text-[10px] px-2 py-1 rounded-full border border-amber-400 text-amber-300 disabled:opacity-40 hover:bg-white/5"
                          >
                            Mod
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating || isSelf}
                            onClick={() => setUserRole(user.id, "Admin")}
                            className="text-[10px] px-2 py-1 rounded-full border border-[var(--violet-soft)] text-[var(--color-accent-cool)] disabled:opacity-40 hover:bg-white/5"
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                  className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                  className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {isAdmin && activeTab === "logs" && (
          <motion.section key="logs" {...pageAnim} className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Log attività
            </h2>

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
                  <motion.div
                    key={log.id}
                    whileHover={{ y: reduce ? 0 : -1 }}
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
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[var(--color-text-muted)]">
                <button
                  type="button"
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
                  className="px-3 py-1 rounded-full border border-[var(--color-border)] disabled:opacity-40 hover:bg-white/5"
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
