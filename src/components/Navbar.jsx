// src/components/Navbar.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  LogIn,
  LogOut,
  LayoutDashboard,
  Shield,
  FileText,
  ScrollText,
  Home as HomeIcon,
  Plug,
  Users,
  Bell,
} from "lucide-react";

import logo from "../assets/img/logo.png";
import { useAuth } from "../context/AuthContext";
import { signInWithDiscord, signOut } from "../lib/auth";
import { alertError, confirmAction, toast } from "../lib/alerts";
import { supabase } from "../lib/supabaseClient";

/* ------------------ LINK STYLES ------------------ */
const linkBase =
  "px-3 py-2 text-sm md:text-base rounded-full transition border border-transparent inline-flex items-center gap-2";
const linkActive =
  "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent-cool)] shadow-md";
const linkInactive =
  "text-[var(--color-text-muted)] hover:text-[var(--color-accent-cool)] hover:bg-white/5";

/* ------------------ NAV ITEMS ------------------ */
const navItems = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/how-to-connect", label: "Connect", icon: Plug },
  { to: "/regolamento", label: "Regolamento", icon: ScrollText },

  // ✅ PAGINA TRAMA (3 ATTI)
  { to: "/trama", label: "Trama", icon: FileText },

  { to: "/staff", label: "Staff", icon: Users },
];

/* ------------------ AVATAR BUILDER ------------------ */
function buildDiscordAvatarUrl(meta) {
  if (!meta) return null;
  if (meta.avatar_url) return meta.avatar_url;

  const discordId = meta.provider_id || meta.sub || meta.id;
  const avatarHash = meta.avatar;
  if (discordId && avatarHash) {
    const ext = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=128`;
  }
  return null;
}

/* ------------------ LOG HELPER ------------------ */
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
    console.debug("[NAVBAR LOG]", e?.message || e);
  }
};
/* ------------------------------------------------ */

export default function Navbar() {
  const {
    session,
    profile,
    loading,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const mobileRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  const user = session?.user || null;
  const isLoggedIn = !!user;

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;

  const meta = user?.user_metadata || {};
  const displayName =
    profile?.discord_username ||
    meta.global_name ||
    meta.full_name ||
    meta.name ||
    "Utente";

  const avatarInitial = displayName.charAt(0).toUpperCase();
  const discordAvatarUrl = useMemo(() => buildDiscordAvatarUrl(meta), [meta]);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => setAvatarError(false), [discordAvatarUrl]);

  /* ------------------ ESC + CLICK OUT ------------------ */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------ BODY LOCK ------------------ */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const closeAllAndGo = async (to) => {
    setMobileOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
    await writeLog("NAVIGATE", `Go to ${to}`);
    navigate(to);
  };

  /* ------------------ Z INDEX ------------------ */
  const Z_NAV = 100000;
  const Z_OVER = 100001;
  const Z_DRAWER = 100002;

  return (
    <header
      className="fixed top-0 inset-x-0 border-b border-[var(--color-border)]/40 bg-[#13142b]/70 backdrop-blur"
      style={{ zIndex: Z_NAV }}
    >
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Core GDR" className="h-9 w-9 rounded-2xl" />
          <div>
            <p className="font-semibold">Core GDR</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              FiveM Server
            </p>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </NavLink>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>

          {!isLoggedIn ? (
            <button
              onClick={signInWithDiscord}
              className="hidden md:inline-flex px-4 py-2 rounded-full bg-[var(--blue)] text-[#050816] text-sm font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login Discord
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--color-border)] bg-white/5"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-[var(--violet)] grid place-items-center">
                  {discordAvatarUrl && !avatarError ? (
                    <img
                      src={discordAvatarUrl}
                      onError={() => setAvatarError(true)}
                      alt=""
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {avatarInitial}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-[#181a33] p-2"
                    style={{ zIndex: Z_DRAWER }}
                  >
                    <button
                      onClick={() => closeAllAndGo("/dashboard")}
                      className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => closeAllAndGo("/admin")}
                        className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </button>
                    )}

                    <button
                      onClick={signOut}
                      className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2 text-red-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70"
              style={{ zIndex: Z_OVER }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 h-full w-[86%] max-w-[360px] bg-[#0b0d1b] border-l border-[var(--color-border)] p-4"
              style={{ zIndex: Z_DRAWER }}
            >
              <div className="space-y-2">
                {navItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--color-border)]"
                    >
                      <Icon className="w-4 h-4" />
                      {it.label}
                    </NavLink>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
