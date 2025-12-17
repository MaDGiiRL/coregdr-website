export const normalizeJob = (job) => (job || "").toString().trim().toLowerCase();

export const safeMeta = (obj) => {
    try {
        return obj && typeof obj === "object" ? obj : {};
    } catch {
        return {};
    }
};
