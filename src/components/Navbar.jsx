// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { useAuth } from "../context/AuthContext";
import { signInWithDiscord, signOut } from "../lib/auth";

const linkBase =
  "px-3 py-2 text-sm md:text-base rounded-full transition border border-transparent";
const linkActive =
  "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent-cool)] shadow-md";
const linkInactive =
  "text-[var(--color-text-muted)] hover:text-[var(--color-accent-cool)] hover:bg-white/5";

export default function Navbar() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const user = session?.user || null;
  const isLoggedIn = !!user;

  // Chiudi il menu quando clicchi fuori o premi ESC
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(); // ✅ prima esegui davvero il logout supabase
      setMenuOpen(false);
      navigate("/"); // ✅ semplice navigate, niente hard reload
    } catch (e) {
      console.error("Errore durante logout:", e);
      alert("Errore durante il logout. Riprova tra qualche secondo.");
    }
  };

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

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;

  return (
    <header className="w-full border-b border-[var(--color-border)]/40 bg-[#13142b]/70 backdrop-blur relative z-[9999]">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* LOGO + TITLE */}
        <Link to="/" className="flex items-center gap-2">
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

        {/* NAV LINKS + AUTH AREA */}
        <div className="flex items-center gap-2 md:gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/how-to-connect"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Come connettersi
          </NavLink>
          <NavLink
            to="/regolamento"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Regolamento
          </NavLink>

          {/* AUTH AREA */}
          {loading && !session && !profile ? (
            // Skeleton mentre AuthContext sta ancora caricando lo stato iniziale
            <div className="h-8 w-24 md:w-32 rounded-full bg-white/5 animate-pulse" />
          ) : !isLoggedIn ? (
            <button
              type="button"
              onClick={signInWithDiscord}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[var(--blue)] text-[#050816] shadow-lg hover:brightness-110 transition"
            >
              Login Discord
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 hover:bg-[var(--color-surface)] transition text-xs md:text-sm"
              >
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-[var(--violet)] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {avatarInitial}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight max-w-[140px]">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Ciao,
                  </span>
                  <span className="text-[11px] md:text-xs truncate">
                    {displayName}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-[var(--color-text-muted)]">
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-[#181a33]/98 shadow-[0_18px_45px_rgba(0,0,0,0.7)] p-2 text-xs md:text-sm z-[9999]">
                  <div className="px-2 py-2 border-b border-[var(--color-border)]/60 mb-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Account
                    </p>
                    <p className="text-[12px] font-medium truncate">
                      {displayName}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    {/* Dashboard per tutti */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/dashboard");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-white/5"
                    >
                      Dashboard
                    </button>

                    {/* Moderazione BG: visibile a admin + mod */}
                    {(isAdmin || isMod) && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/admin/backgrounds");
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-white/5 text-[var(--color-accent-cool)]"
                      >
                        Moderazione BG
                      </button>
                    )}

                    {/* Admin dashboard solo se admin */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/admin");
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-white/5 text-[var(--color-accent-cool)]"
                      >
                        Admin dashboard
                      </button>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--color-border)]/60">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-white/5 text-[var(--color-text-muted)]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
