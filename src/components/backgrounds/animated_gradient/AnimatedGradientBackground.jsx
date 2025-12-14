import { useEffect } from "react";

const BG_TOP = "#181a33";
const BG_BOTTOM = "#13142b";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const C = {
  violet: [111, 47, 217],
  blue: [53, 210, 255],
  violetLight: [180, 150, 255],
  blueLight: [166, 236, 255],
  warm: [255, 249, 201],
};

const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`;



const BUBBLES = [
  {
    color: "violet",
    baseX: 12,
    baseY: 8,
    ampX: 18,
    ampY: 14,
    size: 56,
    aMin: 0.16,
    aMax: 0.4,
    sp: 0.28,
  },
  {
    color: "blue",
    baseX: 88,
    baseY: 10,
    ampX: 18,
    ampY: 16,
    size: 54,
    aMin: 0.16,
    aMax: 0.38,
    sp: 0.3,
  },
  {
    color: "violetLight",
    baseX: 20,
    baseY: 70,
    ampX: 16,
    ampY: 14,
    size: 46,
    aMin: 0.1,
    aMax: 0.26,
    sp: 0.24,
  },
  {
    color: "blueLight",
    baseX: 78,
    baseY: 72,
    ampX: 18,
    ampY: 16,
    size: 46,
    aMin: 0.1,
    aMax: 0.26,
    sp: 0.22,
  },
  {
    color: "warm",
    baseX: 50,
    baseY: 22,
    ampX: 14,
    ampY: 12,
    size: 42,
    aMin: 0.08,
    aMax: 0.22,
    sp: 0.18,
  },
  {
    color: "violet",
    baseX: 52,
    baseY: 78,
    ampX: 16,
    ampY: 12,
    size: 40,
    aMin: 0.08,
    aMax: 0.2,
    sp: 0.2,
  },

  {
    color: "blue",
    baseX: 8,
    baseY: 42,
    ampX: 14,
    ampY: 10,
    size: 38,
    aMin: 0.07,
    aMax: 0.18,
    sp: 0.26,
  },
  {
    color: "violetLight",
    baseX: 92,
    baseY: 46,
    ampX: 14,
    ampY: 12,
    size: 38,
    aMin: 0.07,
    aMax: 0.18,
    sp: 0.25,
  },
  {
    color: "blueLight",
    baseX: 36,
    baseY: 52,
    ampX: 14,
    ampY: 12,
    size: 36,
    aMin: 0.06,
    aMax: 0.16,
    sp: 0.21,
  },
  {
    color: "warm",
    baseX: 64,
    baseY: 48,
    ampX: 14,
    ampY: 12,
    size: 36,
    aMin: 0.06,
    aMax: 0.16,
    sp: 0.19,
  },
];

export default function AnimatedGradientBackground() {
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const animate = (now) => {
      const t = (now - start) / 1000;

      const layers = BUBBLES.map((b, i) => {
        // movimento unico per bolla (seed = i)
        const sx = b.sp + i * 0.017;
        const sy = b.sp + i * 0.013;
        const phase = i * 2.17;

        const x = b.baseX + Math.sin(t * sx + phase) * b.ampX;
        const y = b.baseY + Math.cos(t * sy + phase * 0.9) * b.ampY;

        // pulse + size breathing
        const pulse = Math.sin(t * (0.9 + i * 0.07) + i * 3.1) * 0.5 + 0.5;
        const a = clamp(b.aMin + pulse * (b.aMax - b.aMin), b.aMin, b.aMax);
        const s = b.size + pulse * 10; // breathing

        const col = C[b.color];

        return `radial-gradient(${s}% ${s}% at ${x}% ${y}%, ${rgba(
          col,
          a
        )} 0%, transparent 62%)`;
      });


      const bg = `${layers.join(
        ","
      )},linear-gradient(180deg, ${BG_TOP}, ${BG_BOTTOM})`;

      document.documentElement.style.setProperty("--bg-gradient", bg);

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return null;
}
