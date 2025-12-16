// src/components/FpsOverlay.jsx
import { useEffect } from "react";
import Stats from "stats.js";

export default function FpsOverlay({
  bottom = 12,
  right = 12,
  zIndex = 100001,
}) {
  useEffect(() => {
    const stats = new Stats();
    stats.showPanel(0); // 0 = FPS

    // Posizionamento fisso bottom-right
    const el = stats.dom;
    el.style.position = "fixed";
    el.style.top = "auto";
    el.style.left = "auto";
    el.style.right = `${right}px`;
    el.style.bottom = `${bottom}px`;
    el.style.zIndex = String(zIndex);
    el.style.pointerEvents = "auto";

    document.body.appendChild(el);

    let raf = 0;
    const loop = () => {
      stats.begin();
      stats.end();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, [bottom, right, zIndex]);

  return null;
}
