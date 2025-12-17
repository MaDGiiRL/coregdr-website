// ---------- BADGES (UI) ----------
const badgeBase =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap";

const BADGE = {
    // roles
    role_admin:
        "bg-gradient-to-r from-fuchsia-500/25 to-violet-500/10 text-white border-fuchsia-400/35 shadow-[0_0_0_1px_rgba(217,70,239,0.16)]",
    role_whitelister:
        "bg-gradient-to-r from-amber-400/20 to-orange-400/10 text-amber-200 border-amber-400/35 shadow-[0_0_0_1px_rgba(251,191,36,0.14)]",
    role_user:
        "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",

    // background status
    bg_pending:
        "bg-yellow-400/15 text-yellow-300 border-yellow-400/40 shadow-[0_0_0_1px_rgba(250,204,21,0.12)]",
    bg_approved:
        "bg-emerald-400/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_0_1px_rgba(52,211,153,0.12)]",
    bg_rejected:
        "bg-rose-400/15 text-rose-300 border-rose-400/40 shadow-[0_0_0_1px_rgba(251,113,133,0.12)]",
    bg_none:
        "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]",

    // job
    job: "bg-cyan-400/10 text-cyan-200 border-cyan-400/25 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",

    // pg
    pg: "bg-indigo-400/10 text-indigo-200 border-indigo-400/25 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]",

    // logs type
    log_generic:
        "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",
    log_auth: "bg-sky-400/10 text-sky-200 border-sky-400/25",
    log_dash: "bg-violet-400/10 text-violet-200 border-violet-400/25",
    log_notif: "bg-teal-400/10 text-teal-200 border-teal-400/25",
    log_error: "bg-rose-400/15 text-rose-300 border-rose-400/35",

    // server logs
    srv_generic:
        "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]",
    srv_plugin: "bg-indigo-400/10 text-indigo-200 border-indigo-400/25",
    srv_resource: "bg-emerald-400/10 text-emerald-200 border-emerald-400/25",
};

export const Badge = ({ variant = "log_generic", icon: Icon, children, title }) => (
    <span className={`${badgeBase} ${BADGE[variant] || BADGE.log_generic}`} title={title}>
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        <span className="truncate">{children}</span>
    </span>
);

export const roleVariant = (role) =>
    role === "Admin"
        ? "role_admin"
        : role === "Whitelister"
            ? "role_whitelister"
            : "role_user";

export const bgVariant = (status) =>
    status === "pending"
        ? "bg_pending"
        : status === "approved"
            ? "bg_approved"
            : status === "rejected"
                ? "bg_rejected"
                : "bg_none";

export const logVariant = (type) => {
    const t = (type || "").toString().toUpperCase();
    if (t.includes("ERROR") || t.includes("FAIL")) return "log_error";
    if (t.startsWith("AUTH")) return "log_auth";
    if (t.startsWith("DASH")) return "log_dash";
    if (t.startsWith("NOTIF")) return "log_notif";
    return "log_generic";
};

export const srvVariant = (pluginType) => {
    const t = (pluginType || "").toString().toUpperCase();
    if (t.includes("PLUGIN")) return "srv_plugin";
    if (t.includes("RESOURCE")) return "srv_resource";
    return "srv_generic";
};
