// src/components/backgrounds/scroll_home/CityRunnerBackground.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ⚠️ Se @react-three/postprocessing non è installato/compatibile, commenta queste 2 righe
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { createGtaTexturePack } from "./gtaTextures";

// Palette coerente con i tuoi CSS vars
const PALETTE = {
  violet: "#6F2FD9",
  violetLight: "#B496FF",
  blue: "#35D2FF",
  blueLight: "#A6ECFF",
  pink: "#FFF9C9",
  bg: "#050615",
  asphalt: "#060611",
  bDark: "#090b1a",
  bCool: "#101635",
  text: "#fdf7ff",
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function CityRunnerScene({ scrollRef }) {
  const group = useRef();

  const { roadTex, buildingTex, neonStripeTex } = useMemo(
    () => createGtaTexturePack({ palette: PALETTE }),
    []
  );

  const speedRef = useRef(0);
  const baseSpeed = 18;

  const dashRefs = useRef([]);
  const sideRefs = useRef([]);
  const neonRefs = useRef([]);
  const tubeRefs = useRef([]);
  const bLRefs = useRef([]);
  const bRRefs = useRef([]);

  const ROAD_LOOP = 220;
  const zStart = 18;

  const dashes = useMemo(() => {
    const gap = 4.2;
    const count = Math.floor(ROAD_LOOP / gap);
    return Array.from({ length: count }, (_, i) => ({ z: -i * gap }));
  }, []);

  const sideLines = useMemo(() => {
    const gap = 6.4;
    const count = Math.floor(ROAD_LOOP / gap);
    return Array.from({ length: count }, (_, i) => ({
      z: -i * gap,
      x: i % 2 ? 4.8 : -4.8,
    }));
  }, []);

  const neons = useMemo(() => {
    const gap = 4.0;
    const count = Math.floor(ROAD_LOOP / gap) + 44;
    return Array.from({ length: count }, (_, i) => {
      const pick = Math.random();
      const tint =
        pick < 0.52
          ? PALETTE.blue
          : pick < 0.86
          ? PALETTE.violet
          : PALETTE.pink;
      return {
        z: -i * gap - Math.random() * 2.8,
        x: (Math.random() < 0.5 ? -1 : 1) * (6.1 + Math.random() * 1.8),
        tint,
        len: 2.1 + Math.random() * 4.4,
      };
    });
  }, []);

  const tubes = useMemo(() => {
    const gap = 6.0;
    const count = Math.floor(ROAD_LOOP / gap) + 26;
    return Array.from({ length: count }, (_, i) => ({
      z: -i * gap - Math.random() * 3.8,
      x: (Math.random() < 0.5 ? -1 : 1) * (3.9 + Math.random() * 1.2),
      tint: Math.random() < 0.6 ? PALETTE.blue : PALETTE.violetLight,
    }));
  }, []);

  const buildings = useMemo(() => {
    const gap = 3.8;
    const count = Math.floor((ROAD_LOOP + 40) / gap);
    return Array.from({ length: count }, (_, i) => ({
      z: -i * gap - 16,
      h: 7 + Math.random() * 26,
      w: 1.6 + Math.random() * 2.4,
      d: 2.1 + Math.random() * 3.2,
      xL: -9.2 - Math.random() * 4.2,
      xR: 9.2 + Math.random() * 4.2,
      cool: Math.random() < 0.55,
    }));
  }, []);

  useEffect(() => {
    // tile road
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 8);
    roadTex.needsUpdate = true;
  }, [roadTex]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const sp = clamp01(scrollRef.current ?? 0);

    const targetSpeed = baseSpeed + sp * 42;
    speedRef.current = lerp(speedRef.current, targetSpeed, 0.08);

    const safeDelta = Math.min(delta, 1 / 30);
    const dz = safeDelta * speedRef.current;

    if (group.current) {
      group.current.rotation.z = Math.sin(t * 9.5) * 0.003;
      group.current.rotation.y = Math.sin(t * 0.75) * 0.05;
      group.current.position.x = Math.sin(t * 1.05) * 0.22;
      group.current.position.y = 0.85 + Math.sin(t * 7.7) * 0.03;
    }

    // road scroll UV
    roadTex.offset.y -= dz * 0.0032;

    const wrap = (z) => (z > zStart ? z - ROAD_LOOP : z);

    for (let i = 0; i < dashes.length; i++) {
      const m = dashRefs.current[i];
      if (!m) continue;
      m.position.z = wrap(m.position.z + dz);
    }

    for (let i = 0; i < sideLines.length; i++) {
      const m = sideRefs.current[i];
      if (!m) continue;
      m.position.z = wrap(m.position.z + dz * 0.95);
    }

    for (let i = 0; i < neons.length; i++) {
      const m = neonRefs.current[i];
      if (!m) continue;
      m.position.z = wrap(m.position.z + dz * 1.06);
      const mat = m.material;
      if (mat) mat.emissiveIntensity = 1.2 + Math.sin(t * 3.1 + i) * 0.9;
    }

    for (let i = 0; i < tubes.length; i++) {
      const m = tubeRefs.current[i];
      if (!m) continue;
      m.position.z = wrap(m.position.z + dz * 1.02);
      const mat = m.material;
      if (mat) mat.emissiveIntensity = 1.0 + Math.sin(t * 2.2 + i * 0.6) * 0.6;
    }

    for (let i = 0; i < buildings.length; i++) {
      const L = bLRefs.current[i];
      const R = bRRefs.current[i];
      if (L) L.position.z = wrap(L.position.z + dz * 0.78);
      if (R) R.position.z = wrap(R.position.z + dz * 0.78);
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={0.95}
        color={PALETTE.blueLight}
      />
      <pointLight
        position={[-12, 7, -8]}
        intensity={1.3}
        color={PALETTE.violet}
      />
      <pointLight
        position={[12, 7, -12]}
        intensity={1.1}
        color={PALETTE.blue}
      />
      <fog attach="fog" args={[PALETTE.bg, 8, 95]} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -85]}>
        <planeGeometry args={[16.2, 260]} />
        <meshStandardMaterial
          map={roadTex}
          color={PALETTE.asphalt}
          roughness={0.98}
          metalness={0.03}
        />
      </mesh>

      {dashes.map((d, i) => (
        <mesh
          key={`dash-${i}`}
          ref={(el) => (dashRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[0, 0.02, d.z]}
        >
          <planeGeometry args={[0.22, 2.2]} />
          <meshStandardMaterial
            color="#e8f2ff"
            emissive={PALETTE.blueLight}
            emissiveIntensity={0.8}
            roughness={0.55}
            metalness={0.1}
          />
        </mesh>
      ))}

      {sideLines.map((s, i) => (
        <mesh
          key={`side-${i}`}
          ref={(el) => (sideRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[s.x, 0.02, s.z]}
        >
          <planeGeometry args={[0.16, 5.0]} />
          <meshStandardMaterial
            color={PALETTE.violetLight}
            emissive={PALETTE.blue}
            emissiveIntensity={0.26}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}

      {neons.map((n, i) => (
        <mesh
          key={`neon-${i}`}
          ref={(el) => (neonRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[n.x, 0.03, n.z]}
        >
          <boxGeometry args={[0.28, n.len, 0.05]} />
          <meshStandardMaterial
            color={n.tint}
            emissive={n.tint}
            emissiveIntensity={1.35}
            roughness={0.22}
            metalness={0.18}
          />
        </mesh>
      ))}

      {tubes.map((n, i) => (
        <mesh
          key={`tube-${i}`}
          ref={(el) => (tubeRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[n.x, 0.035, n.z]}
        >
          <boxGeometry args={[0.18, 1.9, 0.06]} />
          <meshStandardMaterial
            map={neonStripeTex}
            color={n.tint}
            emissive={n.tint}
            emissiveIntensity={1.15}
            roughness={0.2}
            metalness={0.25}
          />
        </mesh>
      ))}

      {buildings.map((b, i) => (
        <group key={`b-${i}`}>
          <mesh
            ref={(el) => (bLRefs.current[i] = el)}
            position={[b.xL, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={buildingTex}
              color={b.cool ? PALETTE.bCool : PALETTE.bDark}
              emissive={b.cool ? PALETTE.violet : "#000000"}
              emissiveIntensity={b.cool ? 0.18 : 0}
              roughness={0.98}
              metalness={0.04}
            />
          </mesh>

          <mesh
            ref={(el) => (bRRefs.current[i] = el)}
            position={[b.xR, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={buildingTex}
              color={b.cool ? PALETTE.bCool : PALETTE.bDark}
              emissive={b.cool ? PALETTE.blue : "#000000"}
              emissiveIntensity={b.cool ? 0.18 : 0}
              roughness={0.98}
              metalness={0.04}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CityRunnerBackground({
  navHeight = 70,
  scrollYProgress,
}) {
  const [webglOk, setWebglOk] = useState(true);
  const scrollRef = useRef(0);

  useEffect(() => {
    if (!scrollYProgress) return;
    const unsub = scrollYProgress.on("change", (v) => {
      scrollRef.current = v;
    });
    return () => unsub?.();
  }, [scrollYProgress]);

  useEffect(() => {
    // fallback: se scrollYProgress non arriva, almeno animazione idle
    if (!scrollYProgress) {
      scrollRef.current = 0.2;
    }
  }, [scrollYProgress]);

  return (
    <div
      className="fixed inset-x-0 pointer-events-none z-0" // ✅ FIX: NON negativo
      style={{ top: navHeight, height: `calc(100vh - ${navHeight}px)` }}
    >
      {!webglOk ? (
        <div className="absolute inset-0 bg-[var(--bg-gradient)] opacity-90" />
      ) : (
        <Canvas
          frameloop="always"
          dpr={1}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
          style={{ width: "100%", height: "100%" }} // ✅ importante
          camera={{ position: [0, 5.2, 14], fov: 58, near: 0.1, far: 260 }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;

            const onLost = (e) => {
              e.preventDefault();
              setWebglOk(false);
            };

            // ✅ cleanup + listener
            canvas.addEventListener("webglcontextlost", onLost, false);

            return () => {
              canvas.removeEventListener("webglcontextlost", onLost, false);
            };
          }}
        >
          <color attach="background" args={[PALETTE.bg]} />

          <CityRunnerScene scrollRef={scrollRef} />

          {/* Bloom: se ti dà problemi di dipendenze, commenta questo blocco */}
          <EffectComposer>
            <Bloom
              intensity={0.85}
              mipmapBlur
              luminanceThreshold={0.25}
              luminanceSmoothing={0.25}
            />
          </EffectComposer>
        </Canvas>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(53,210,255,0.10),transparent_45%),radial-gradient(circle_at_bottom,rgba(111,47,217,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
    </div>
  );
}
