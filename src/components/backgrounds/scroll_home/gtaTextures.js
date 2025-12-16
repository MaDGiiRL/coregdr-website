import * as THREE from "three";

function makeCanvasTexture(draw, size = 1024, repeatX = 1, repeatY = 1) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  draw(ctx, size);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 1; // un filo più leggero (2->1)
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function rnd(seed) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createGtaTexturePack({
  palette = {
    bg: "#050615",
    asphalt: "#060611",
    blue: "#35D2FF",
    blueLight: "#A6ECFF",
    violet: "#6F2FD9",
    violetLight: "#B496FF",
    pink: "#FFF9C9",
    text: "#fdf7ff",
  },
  quality = "high",
} = {}) {
  const isLow = quality === "low";
  const isMid = quality === "mid";

  // ---- ROAD TEXTURE
  const roadTex = makeCanvasTexture(
    (ctx, s) => {
      ctx.fillStyle = palette.asphalt;
      ctx.fillRect(0, 0, s, s);

      // grain: tantissimo su high, meno su low
      const r = rnd(42);
      const grainCount = isLow ? 12000 : isMid ? 26000 : 65000;

      for (let i = 0; i < grainCount; i++) {
        const x = (r() * s) | 0;
        const y = (r() * s) | 0;
        const a = r() * (isLow ? 0.05 : 0.08);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1, 1);
      }

      ctx.globalAlpha = 0.18;
      const streaks = isLow ? 14 : 26;
      for (let i = 0; i < streaks; i++) {
        const y = (i / streaks) * s;
        ctx.fillStyle = i % 2 ? "#0a0b18" : "#070816";
        ctx.fillRect(0, y, s, s * 0.01);
      }
      ctx.globalAlpha = 1;
    },
    isLow ? 512 : 1024,
    1,
    6
  );

  // ---- BUILDING TEXTURE
  const buildingTex = makeCanvasTexture(
    (ctx, s) => {
      ctx.fillStyle = "#090b1a";
      ctx.fillRect(0, 0, s, s);

      const r = rnd(1337);

      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#0b0d1f");
      g.addColorStop(1, "#060611");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);

      const cols = isLow ? 10 : 16;
      const rows = isLow ? 16 : 24;
      const pad = s * 0.06;
      const w = (s - pad * 2) / cols;
      const h = (s - pad * 2) / rows;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const on = r() < (isLow ? 0.22 : 0.28);
          const neon = r() < (isLow ? 0.05 : 0.08);
          const rx = pad + x * w;
          const ry = pad + y * h;

          if (on) {
            const base = neon ? (r() < 0.5 ? palette.blue : palette.violetLight) : "#c0c3e0";
            ctx.fillStyle = base;

            const ww = w * (0.55 + r() * 0.25);
            const hh = h * (0.45 + r() * 0.25);

            ctx.globalAlpha = neon ? 0.85 : 0.35;
            ctx.fillRect(rx + w * 0.2, ry + h * 0.25, ww, hh);

            ctx.globalAlpha = neon ? 0.22 : 0.1;
            ctx.strokeStyle = base;
            ctx.lineWidth = 2;
            ctx.strokeRect(rx + w * 0.2, ry + h * 0.25, ww, hh);
            ctx.globalAlpha = 1;
          } else {
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = "#000000";
            ctx.fillRect(rx + w * 0.2, ry + h * 0.25, w * 0.6, h * 0.5);
            ctx.globalAlpha = 1;
          }
        }
      }

      // scanlines leggere (meno su low)
      ctx.globalAlpha = isLow ? 0.06 : 0.09;
      ctx.fillStyle = palette.violet;
      const lines = isLow ? 10 : 18;
      for (let i = 0; i < lines; i++) {
        ctx.fillRect(0, (i / lines) * s, s, 1);
      }
      ctx.globalAlpha = 1;
    },
    isLow ? 512 : 1024,
    1,
    1
  );

  // ---- NEON STRIPE
  const neonStripeTex = makeCanvasTexture(
    (ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      const grad = ctx.createLinearGradient(0, 0, s, 0);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.2, "rgba(255,255,255,0.9)");
      grad.addColorStop(0.5, "rgba(255,255,255,1)");
      grad.addColorStop(0.8, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, s * 0.35, s, s * 0.3);
    },
    512,
    4,
    1
  );

  // ---- STARS (opzionale, non usata nella scena ma la lascio)
  const starsTex = makeCanvasTexture(
    (ctx, s) => {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, s, s);
      const r = rnd(7);
      const count = isLow ? 900 : 2400;
      for (let i = 0; i < count; i++) {
        const x = (r() * s) | 0;
        const y = (r() * s) | 0;
        const a = 0.15 + r() * 0.65;
        const sz = r() < 0.9 ? 1 : 2;
        ctx.fillStyle = `rgba(166,236,255,${a})`;
        ctx.fillRect(x, y, sz, sz);
      }
    },
    1024,
    1,
    1
  );

  return { roadTex, buildingTex, neonStripeTex, starsTex };
}
