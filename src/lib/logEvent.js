import { supabase } from "../../lib/supabaseClient";

export function logEvent(type, message, meta = {}) {
    // fire-and-forget: mai throw
    Promise.resolve()
        .then(async () => {
            const { error } = await supabase.rpc("write_log", {
                _type: String(type || "GENERIC"),
                _message: String(message || ""),
                _meta: meta && typeof meta === "object" ? meta : { value: meta },
            });
            if (error) console.debug("[LOG] rpc error:", error.message || error);
        })
        .catch((e) => console.debug("[LOG] failed:", e?.message || e));
}
