// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] URL o anon key mancanti. Controlla le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // ✅ salva la sessione (localStorage)
    autoRefreshToken: true,        // ✅ refresh automatico access token
    detectSessionInUrl: true,      // ✅ gestisce callback OAuth (Discord)
    storage: window.localStorage,  // ✅ storage esplicito
  },
});
