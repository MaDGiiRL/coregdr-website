// src/components/backgrounds/GtaRunBackground.jsx
import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PALETTE } from "./scene/palette";
import GtaRunScene from "./scene/GtaRunScene";

function WebGLStabilityHooks() {
  const { gl } = useThree();

  useEffect(() => {
    // ✅ clamp DPR runtime
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

    const canvas = gl.domElement;

    const onLost = (e) => {
      e.preventDefault();
      console.warn("⚠️ WebGL context lost");
    };
    const onRestore = () => console.warn("✅ WebGL context restored");

    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestore, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestore);
    };
  }, [gl]);

  return null;
}

export default function GtaRunBackground({ navHeight = 70 }) {
  return (
    <div
      className="fixed inset-x-0 pointer-events-none -z-10"
      style={{
        top: navHeight,
        height: `calc(100vh - ${navHeight}px)`,
      }}
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.25]} // ✅ clamp dpr
        gl={{
          antialias: false, // ✅ stabilità
          alpha: true,
          powerPreference: "low-power", // ✅ stabilità
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 5.2, 14], fov: 58, near: 0.1, far: 260 }}
        onError={(e) => console.error("❌ R3F Canvas error:", e)}
      >
        <color attach="background" args={[PALETTE.bg]} />
        <WebGLStabilityHooks />
        <GtaRunScene />
      </Canvas>

      {/* overlay cinematic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(53,210,255,0.10),transparent_45%),radial-gradient(circle_at_bottom,rgba(111,47,217,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
    </div>
  );
}
