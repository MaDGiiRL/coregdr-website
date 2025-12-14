import { supabase } from "./supabaseClient.js";

export function logEvent(type, message, meta = {}) {
  try {
    const payload = {
      _type: String(type || "GENERIC"),
      _message: String(message || ""),
      _meta: meta && typeof meta === "object" ? meta : { value: meta },
    };

    Promise.resolve()
      .then(() => supabase.rpc("write_log", payload))
      .then(({ error }) => {
        if (error) console.debug("[LOG rpc error]", error.message || error);
      })
      .catch((e) => console.debug("[LOG fail]", e?.message || e));
  } catch (e) {
    console.debug("[LOG crash]", e?.message || e);
  }
}