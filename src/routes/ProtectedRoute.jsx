// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  requireAuth = true,
  requireAdmin = false,
  requireMod = false,
  modOnly = false, // se true: mod sì, admin NO
  redirectTo = "/",
  forbiddenTo = "/dashboard",
}) {
  const { session, profile, loading } = useAuth();

  if (loading) return null; // oppure uno skeleton/spinner

  const isLoggedIn = !!session?.user;

  if (requireAuth && !isLoggedIn) return <Navigate to={redirectTo} replace />;

  const isAdmin = !!profile?.is_admin;
  const isMod = !!profile?.is_moderator;

  // se richiede admin
  if (requireAdmin && !isAdmin) return <Navigate to={forbiddenTo} replace />;

  // se richiede mod
  if (requireMod && !isMod) return <Navigate to={forbiddenTo} replace />;

  // mod-only: mod sì, admin no
  if (modOnly && (!isMod || isAdmin))
    return <Navigate to={forbiddenTo} replace />;

  return <Outlet />;
}
