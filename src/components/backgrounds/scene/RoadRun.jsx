// src/components/backgrounds/scene/RoadRun.jsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "./palette";

const wrapZ = (obj, zStart, loopLen) => {
  while (obj.position.z > zStart) obj.position.z -= loopLen; // ✅ robusto (no salti)
};

export default function RoadRun() {
  const dashRefs = useRef([]);
  const sideRefs = useRef([]);
  const neonRefs = useRef([]);
  const tubeRefs = useRef([]);

  const speed = 26;

  const LOOP_LEN = 220;
  const zStart = 20;

  const dashes = useMemo(() => {
    const gap = 4.6;
    const count = Math.floor(LOOP_LEN / gap);
    return Array.from({ length: count }).map((_, i) => ({ z: -i * gap }));
  }, []);

  const sideLines = useMemo(() => {
    const gap = 7.0;
    const count = Math.floor(LOOP_LEN / gap);
    return Array.from({ length: count }).map((_, i) => ({
      z: -i * gap,
      x: i % 2 === 0 ? -5.0 : 5.0,
    }));
  }, []);

  // ✅ più neon ma non esagerati (stabilità)
  const neons = useMemo(() => {
    const gap = 4.8;
    const count = Math.floor(LOOP_LEN / gap) + 18;
    return Array.from({ length: count }).map((_, i) => {
      const pick = Math.random();
      const tint =
        pick < 0.5 ? PALETTE.blue : pick < 0.85 ? PALETTE.violet : PALETTE.pink;
      return {
        z: -i * gap - Math.random() * 2.5,
        x: (Math.random() < 0.5 ? -1 : 1) * (6.0 + Math.random() * 1.5),
        tint,
        len: 2.0 + Math.random() * 3.6,
      };
    });
  }, []);

  const tubes = useMemo(() => {
    const gap = 6.2;
    const count = Math.floor(LOOP_LEN / gap) + 10;
    return Array.from({ length: count }).map((_, i) => {
      const tint = Math.random() < 0.55 ? PALETTE.blue : PALETTE.violetLight;
      return {
        z: -i * gap - Math.random() * 3.5,
        x: (Math.random() < 0.5 ? -1 : 1) * (4.6 + Math.random() * 1.0),
        tint,
      };
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // ✅ clamp più aggressivo (evita scatti se tab perde focus)
    const safeDelta = Math.min(delta, 1 / 60);
    const dz = safeDelta * speed;

    for (let i = 0; i < dashes.length; i++) {
      const m = dashRefs.current[i];
      if (!m) continue;
      m.position.z += dz;
      wrapZ(m, zStart, LOOP_LEN);
    }

    for (let i = 0; i < sideLines.length; i++) {
      const m = sideRefs.current[i];
      if (!m) continue;
      m.position.z += dz * 0.95;
      wrapZ(m, zStart, LOOP_LEN);
    }

    for (let i = 0; i < neons.length; i++) {
      const m = neonRefs.current[i];
      if (!m) continue;
      m.position.z += dz * 1.06;
      wrapZ(m, zStart, LOOP_LEN);

      const mat = m.material;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.45 + Math.sin(t * 3.4 + i) * 0.85;
      }
    }

    for (let i = 0; i < tubes.length; i++) {
      const m = tubeRefs.current[i];
      if (!m) continue;
      m.position.z += dz * 1.02;
      wrapZ(m, zStart, LOOP_LEN);

      const mat = m.material;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.05 + Math.sin(t * 2.2 + i * 0.6) * 0.55;
      }
    }
  });

  return (
    <group>
      {/* strada */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -85]}>
        <planeGeometry args={[16.5, 260]} />
        <meshStandardMaterial
          color={PALETTE.asphalt}
          roughness={0.98}
          metalness={0.04}
        />
      </mesh>

      {/* trattini centrali */}
      {dashes.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => (dashRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[0, 0.02, d.z]}
        >
          <planeGeometry args={[0.22, 2.2]} />
          <meshStandardMaterial
            color="#e8f2ff"
            emissive={PALETTE.blueLight}
            emissiveIntensity={0.85}
            roughness={0.5}
            metalness={0.12}
          />
        </mesh>
      ))}

      {/* bordi corsia */}
      {sideLines.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (sideRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[s.x, 0.02, s.z]}
        >
          <planeGeometry args={[0.16, 5.0]} />
          <meshStandardMaterial
            color={PALETTE.violetLight}
            emissive={PALETTE.blue}
            emissiveIntensity={0.28}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* streak neon */}
      {neons.map((n, i) => (
        <mesh
          key={i}
          ref={(el) => (neonRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[n.x, 0.03, n.z]}
        >
          <boxGeometry args={[0.28, n.len, 0.04]} />
          <meshStandardMaterial
            color={n.tint}
            emissive={n.tint}
            emissiveIntensity={1.7}
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* tube neon */}
      {tubes.map((n, i) => (
        <mesh
          key={`tube-${i}`}
          ref={(el) => (tubeRefs.current[i] = el)}
          rotation-x={-Math.PI / 2}
          position={[n.x, 0.035, n.z]}
        >
          <boxGeometry args={[0.16, 1.7, 0.04]} />
          <meshStandardMaterial
            color={n.tint}
            emissive={n.tint}
            emissiveIntensity={1.25}
            roughness={0.25}
            metalness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
