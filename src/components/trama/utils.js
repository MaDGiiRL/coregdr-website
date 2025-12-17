export function clampIndex(i, len) {
    const m = ((i % len) + len) % len;
    return m;
}
