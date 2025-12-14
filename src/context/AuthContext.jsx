import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/alerts";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔔 NOTIFICHE
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const recalcUnread = (list) =>
    (list || []).reduce((acc, n) => acc + (n?.read_at ? 0 : 1), 0);

  useEffect(() => {
    let alive = true;

    const fetchProfile = async (user) => {
      if (!user || !alive) return;

      const meta = user.user_metadata || {};

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            discord_id: meta.sub ?? meta.provider_id ?? null,
            discord_username:
              meta.custom_claims?.global_name ??
              meta.global_name ??
              meta.full_name ??
              meta.name ??
              meta.user_name ??
              user.email,
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
            last_login_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("*")
        .single();

      if (!alive) return;

      if (error) {
        console.error("[Auth] profile upsert error:", error);
        // NON ammazzare la sessione se fallisce il profilo
        setProfile(null);
        return;
      }

      setProfile(data);
    };

    // 1) sessione iniziale
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error("[Auth] getSession error:", error);

      const s = data.session ?? null;
      setSession(s);

      if (s?.user) fetchProfile(s.user);
      setLoading(false);
    });

    // 2) listener auth
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!alive) return;

      setSession(s ?? null);

      if (s?.user) {
        fetchProfile(s.user);
      } else {
        // reset completo su logout reale
        setProfile(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /**
   * 🔔 Notifiche: load + realtime
   * NB: RLS fa il filtro vero. Qui facciamo un “guard” extra.
   */
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !profile) return;

    const isStaff = !!profile.is_admin || !!profile.is_moderator;
    let alive = true;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id,audience,target_user_id,type,title,message,meta,read_at,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(40);

      if (!alive) return;
      if (error) {
        console.error("[Auth] notifications load error:", error);
        return;
      }

      const list = data || [];
      setNotifications(list);
      setUnreadCount(recalcUnread(list));
    };

    loadNotifications();

    const channel = supabase
      .channel("rt:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          const isMine =
            row.audience === "user" && row.target_user_id === userId;
          const isStaffNote = row.audience === "staff" && isStaff;

          if (!isMine && !isStaffNote) return;

          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev; // evita duplicati su reconnect
            const next = [row, ...prev].slice(0, 60);
            setUnreadCount(recalcUnread(next));
            return next;
          });

          toast("info", `${row.title}: ${row.message}`);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [
    session?.user?.id,
    profile?.id,
    profile?.is_admin,
    profile?.is_moderator,
  ]);

  // ✅ segna una notifica come letta
  const markNotificationRead = async (id) => {
    const now = new Date().toISOString();

    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, read_at: n.read_at ?? now } : n
      );
      setUnreadCount(recalcUnread(next));
      return next;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", id);

    if (error) console.error("[Auth] markNotificationRead error:", error);
  };

  // ✅ segna tutte lette
  const markAllNotificationsRead = async () => {
    const now = new Date().toISOString();
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;

    setNotifications((prev) => {
      const next = prev.map((n) => (!n.read_at ? { ...n, read_at: now } : n));
      setUnreadCount(0);
      return next;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .in("id", ids);

    if (error) console.error("[Auth] markAllNotificationsRead error:", error);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
