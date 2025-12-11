// src/lib/auth.js
import { supabase } from "./supabaseClient";

export async function signInWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
            redirectTo: window.location.origin + "/dashboard",
        },
    });

    if (error) {
        console.error("Discord login error:", error);
        throw error;
    }

    return data;
}

export async function signOut() {
    console.log("[Auth] signOut chiamato");

    // 🔹 In supabase-js v2 è consigliato passare scope, soprattutto se hai più tab
    const { error } = await supabase.auth.signOut({
        scope: "global", // "local" se vuoi solo questa tab
    });

    if (error) {
        console.error("[Auth] Logout error:", error);
        throw error; // lo gestiamo nel caller
    }

    console.log("[Auth] signOut completato");
}
