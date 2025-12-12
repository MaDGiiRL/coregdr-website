// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchProfile = async (user) => {
      if (!user || !alive) return;

      const meta = user.user_metadata || {};

      // ✅ usa UPSERT: elimina conflitti e “profilo creato in parallelo”
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

    // 1) Prendi sessione iniziale UNA VOLTA
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error("[Auth] getSession error:", error);

      setSession(data.session ?? null);
      if (data.session?.user) fetchProfile(data.session.user);
      setLoading(false);
    });

    // 2) Listener: unica fonte successiva
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      console.log("[Auth] event:", event);

      setSession(session ?? null);

      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
