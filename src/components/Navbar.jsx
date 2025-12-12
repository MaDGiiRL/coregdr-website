// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

import logo from "../assets/img/logo.png";
import { useAuth } from "../context/AuthContext";
import { signInWithDiscord, signOut } from "../lib/auth";
import { alertError, confirmAction, toast } from "../lib/alerts";

const linkBase =
  "px-3 py-2 text-sm md:text-base rounded-full transition border border-transparent inline-flex items-center gap-2";
const linkActive =
  "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent-cool)] shadow-md";
const linkInactive =
  "text-[var(--color-text-muted)] hover:text-[var(--color-accent-cool)] hover:bg-white/5";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/how-to-connect", label: "Come connettersi", icon: Plug },
  { to: "/regolamento", label: "Regolamento", icon: ScrollText },
  { to: "/staff", label: "Staff", icon: Users },
];

export default function Navbar() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const mobileRef = useRef(null);
  const userRef = useRef(null);

  const user = session?.user || null;
  const isLoggedIn = !!user;

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;

  const meta = user?.user_metadata || {};
  const displayName =
    profile?.discord_username ||
    meta.custom_claims?.global_name ||
    meta.global_name ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    user?.email ||
    "Utente";

  const avatarInitial =
    displayName && typeof displayName === "string"
      ? displayName.charAt(0).toUpperCase()
      : "?";

  useEffect(() => {
    const onDown = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserOpen(false);
      }
    };

    const onClick = (e) => {
      if (
        mobileOpen &&
        mobileRef.current &&
        !mobileRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
      if (userOpen && userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };

    document.addEventListener("keydown", onDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [mobileOpen, userOpen]);

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: "Vuoi uscire?",
      text: "Verrai disconnesso dal tuo account.",
      confirmText: "Sì, logout",
      cancelText: "Annulla",
      icon: "question",
    });

    if (!ok) return;

    try {
      await signOut();
      setUserOpen(false);
      setMobileOpen(false);
      toast("success", "Logout effettuato");
      navigate("/");
    } catch (e) {
      console.error("Errore durante logout:", e);
      await alertError(
        "Errore logout",
        "Errore durante il logout. Riprova tra qualche secondo."
      );
    }
  };

  const closeAllAndGo = (to) => {
    setMobileOpen(false);
    setUserOpen(false);
    navigate(to);
  };

  const overlayAnim = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  };

  const drawerAnim = {
    initial: { x: "100%" },
    animate: { x: 0, transition: { duration: 0.22, ease: "easeOut" } },
    exit: { x: "100%", transition: { duration: 0.18, ease: "easeIn" } },
  };

  const dropdownAnim = {
    initial: { opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.16 } },
    exit: {
      opacity: 0,
      y: reduce ? 0 : 6,
      scale: reduce ? 1 : 0.98,
      transition: { duration: 0.12 },
    },
  };

  return (
    <header className="w-full border-b border-[var(--color-border)]/40 bg-[#13142b]/70 backdrop-blur relative z-[9999]">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link
          to="/"
          onClick={() => {
            setMobileOpen(false);
            setUserOpen(false);
          }}
          className="flex items-center gap-2"
        >
          <img
            src={logo}
            alt="Core Roleplay logo"
            className="h-9 w-9 rounded-2xl object-cover shadow-md"
          />
          <div className="leading-tight">
            <p className="font-semibold text-sm md:text-base">Core Roleplay</p>
            <p className="text-[10px] md:text-xs text-[var(--color-text-muted)]">
              FiveM Server
            </p>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
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

        {/* RIGHT AREA */}
        <div className="flex items-center gap-2">
          {/* MOBILE hamburger */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(true);
              setUserOpen(false);
            }}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 hover:bg-[var(--color-surface)] transition"
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5 text-[var(--color-text)]" />
          </button>

          {/* AUTH (desktop) */}
          <div className="hidden md:block">
            {loading && !session && !profile ? (
              <div className="h-9 w-28 rounded-full bg-white/5 animate-pulse" />
            ) : !isLoggedIn ? (
              <button
                type="button"
                onClick={signInWithDiscord}
                className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[var(--blue)] text-[#050816] shadow-lg hover:brightness-110 transition inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login Discord
              </button>
            ) : (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserOpen((p) => !p);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 hover:bg-[var(--color-surface)] transition text-xs md:text-sm"
                >
                  <div className="h-8 w-8 rounded-full bg-[var(--violet)] flex items-center justify-center text-xs font-bold text-white shadow-md">
                    {avatarInitial}
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-tight max-w-[160px]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Ciao,
                    </span>
                    <span className="text-[11px] md:text-xs truncate">
                      {displayName}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      {...dropdownAnim}
                      className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--color-border)] bg-[#181a33]/98 shadow-[0_18px_45px_rgba(0,0,0,0.7)] p-2 text-xs md:text-sm z-[9999]"
                    >
                      <div className="px-2 py-2 border-b border-[var(--color-border)]/60 mb-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          Account
                        </p>
                        <p className="text-[12px] font-medium truncate">
                          {displayName}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => closeAllAndGo("/dashboard")}
                          className="w-full text-left px-2 py-2 rounded-xl hover:bg-white/5 inline-flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>

                        {(isAdmin || isMod) && (
                          <button
                            type="button"
                            onClick={() => closeAllAndGo("/admin/backgrounds")}
                            className="w-full text-left px-2 py-2 rounded-xl hover:bg-white/5 text-[var(--color-accent-cool)] inline-flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Moderazione BG
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => closeAllAndGo("/admin")}
                            className="w-full text-left px-2 py-2 rounded-xl hover:bg-white/5 text-[var(--color-accent-cool)] inline-flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Admin dashboard
                          </button>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-[var(--color-border)]/60">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-2 py-2 rounded-xl hover:bg-white/5 text-[var(--color-text-muted)] inline-flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              {...overlayAnim}
              className="fixed inset-0 bg-black/55 z-[9998]"
            />
            <motion.aside
              {...drawerAnim}
              ref={mobileRef}
              className="fixed top-0 right-0 h-full w-[86%] max-w-[360px] bg-[#14152b]/98 border-l border-[var(--color-border)] z-[9999] shadow-[0_18px_60px_rgba(0,0,0,0.75)]"
            >
              <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]/60">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="logo" className="h-9 w-9 rounded-2xl" />
                  <div className="leading-tight">
                    <p className="font-semibold">Core Roleplay</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Menu
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] transition inline-flex items-center justify-center"
                  aria-label="Chiudi menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LINKS */}
              <div className="p-4 space-y-2">
                {navItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `w-full px-3 py-3 rounded-2xl border transition flex items-center gap-2 ${
                          isActive
                            ? "bg-[var(--color-surface)] border-[var(--color-accent-cool)] text-[var(--color-accent-cool)]"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {it.label}
                    </NavLink>
                  );
                })}
              </div>

              {/* AUTH mobile */}
              <div className="p-4 border-t border-[var(--color-border)]/60 space-y-3">
                {loading && !session && !profile ? (
                  <div className="h-10 w-full rounded-2xl bg-white/5 animate-pulse" />
                ) : !isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signInWithDiscord();
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--blue)] text-[#050816] font-semibold shadow-md hover:brightness-110 transition inline-flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Login Discord
                  </button>
                ) : (
                  <>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        Account
                      </p>
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => closeAllAndGo("/dashboard")}
                      className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] hover:bg-white/5 transition inline-flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>

                    {(isAdmin || isMod) && (
                      <button
                        type="button"
                        onClick={() => closeAllAndGo("/admin/backgrounds")}
                        className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] hover:bg-white/5 transition inline-flex items-center gap-2 text-[var(--color-accent-cool)]"
                      >
                        <FileText className="w-4 h-4" />
                        Moderazione BG
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => closeAllAndGo("/admin")}
                        className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] hover:bg-white/5 transition inline-flex items-center gap-2 text-[var(--color-accent-cool)]"
                      >
                        <Shield className="w-4 h-4" />
                        Admin dashboard
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] hover:bg-white/5 transition inline-flex items-center gap-2 text-[var(--color-text-muted)]"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
