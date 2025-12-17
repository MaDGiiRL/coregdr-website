export const STATUS_LABELS = {
    pending: "In attesa",
    approved: "Approvato",
    rejected: "Rifiutato",
};

export const STATUS_COLORS = {
    pending: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
    approved: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
    rejected: "bg-red-400/15 text-red-300 border-red-400/40",
};

export const statusPill = (status) =>
    STATUS_COLORS[status] ??
    "bg-black/20 text-[var(--color-text-muted)] border-[var(--color-border)]";

export const rolePill = (role) => {
    switch (role) {
        case "Admin":
            return "bg-gradient-to-r from-[var(--violet)]/25 to-fuchsia-400/10 text-white border-[var(--violet-soft)]";
        case "Whitelister":
            return "bg-gradient-to-r from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-400/40";
        default:
            return "bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]";
    }
};
