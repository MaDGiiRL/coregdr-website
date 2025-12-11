// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (user) => {
      if (!user || !isMounted) return;

      console.log("[Auth] user:", user);

      // 1) provo a leggere il profilo
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Error fetching profile", error);
        return;
      }

      // 2) se NON esiste profilo → lo CREO
      if (!data) {
        console.log("[Auth] Nessun profilo, creo nuovo profilo…");

        const meta = user.user_metadata || {};
        console.log("[Auth] user_metadata:", meta);

        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id, // deve matchare auth.users.id
            discord_id:
              meta.sub ?? meta.provider_id ?? meta.provider_id ?? null,
            discord_username:
              meta.custom_claims?.global_name ??
              meta.global_name ??
              meta.full_name ??
              meta.name ??
              meta.user_name ??
              user.email,
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
          })
          .select("*")
          .single();

        if (insertError) {
          // se dovesse capitare un conflitto (profilo creato in parallelo)
          if (insertError.code === "23505") {
            console.warn(
              "[Auth] Profilo già creato da un'altra richiesta, rileggo…"
            );
            const { data: again, error: againError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (againError) {
              console.error(
                "[Auth] Error refetching profile after conflict",
                againError
              );
              return;
            }

            if (!isMounted) return;
            setProfile(again);
            return;
          }

          console.error("[Auth] Error creating profile", insertError);
          return;
        }

        console.log("[Auth] Profilo creato:", inserted);
        if (!isMounted) return;
        setProfile(inserted);
        return;
      }

      // 3) profilo ESISTE → aggiorno last_login_at (opzionale)
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("[Auth] Error updating profile", updateError);
        if (!isMounted) return;
        setProfile(data); // fallback versione vecchia
      } else {
        if (!isMounted) return;
        setProfile(updated);
      }
    };

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("[Auth] getSession →", session, error);
        if (!isMounted) return;

        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user);
        }
      } catch (err) {
        console.error("[Auth] getSession exception", err);
      } finally {
        if (isMounted) {
          console.log("[Auth] init: setLoading(false)");
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] onAuthStateChange:", event, session);

      if (!isMounted) return;

      // gestiamo SEMPRE gli eventi, anche INITIAL_SESSION
      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
      }

      // qualunque cosa succeda, dopo il primo evento auth smetti di "caricare"
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
