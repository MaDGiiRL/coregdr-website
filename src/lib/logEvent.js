import { supabase } from "../../lib/supabaseClient";

// Enhanced logEvent function with specific tab, staff_id, and staff_discord_id
export function logEvent(type, message, meta = {}) {
    const discordId = supabase.auth.user()?.id; // Fetching discord_id from authenticated user
    if (!discordId) {
        console.error("Unable to log event: user is not authenticated.");
        return; // Prevent logging if no discord_id
    }

    // Fetching staff details from the meta or the logged-in user
    const staffId = meta.staff_id || discordId; // Defaulting to the current user if staff_id is not provided
    const staffDiscordId = meta.staff_discord_id || discordId; // Similarly, using the current user's discord_id if not provided
    const tab = meta.tab || "unknown"; // Default to "unknown" if the tab is not provided

    // Enriching meta with discord_id, staff_id, staff_discord_id, and tab
    const enrichedMeta = {
        ...meta,
        discord_id: discordId,          // Adding discord_id of the logged-in user
        staff_id: staffId,              // Adding staff_id
        staff_discord_id: staffDiscordId, // Adding staff's discord ID
        tab: tab,                       // The tab information
    };

    // Constructing the payload
    const payload = {
        _type: String(type || "GENERIC"),   // Event type, defaulting to "GENERIC"
        _message: String(message || ""),    // The actual log message
        _meta: enrichedMeta,                // All the metadata (discord_id, staff info, etc.)
    };

    // Fire-and-forget logging with RPC to Supabase
    Promise.resolve()
        .then(async () => {
            const { error } = await supabase.rpc("write_log", payload);
            if (error) {
                console.debug("[LOG RPC Error]:", error.message || error);
            } else {
                console.log("[LOG] Event logged successfully");
            }
        })
        .catch((error) => {
            console.debug("[LOG Failed]:", error?.message || error);
        });
}
