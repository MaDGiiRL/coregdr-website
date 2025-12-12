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
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("[Auth] Logout error:", error);
        throw error;
    }
}
