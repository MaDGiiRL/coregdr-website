// src/components/backgrounds/scene/BuildingsTunnel.jsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "./palette";

const wrapZ = (obj, zStart, loopLen) => {
  while (obj.position.z > zStart) obj.position.z -= loopLen;
};

export default function BuildingsTunnel() {
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const poleRefs = useRef([]);

  const speed = 26 * 0.85; // parallax

  const LOOP_LEN = 260;
  const zStart = 24;

  const blocks = useMemo(() => {
    const gap = 5.2; // ✅ meno palazzi = più stabile
    const count = Math.floor(LOOP_LEN / gap);
    const items = [];

    for (let i = 0; i < count; i++) {
      items.push({
        z: -i * gap - 10,
        h: 7 + Math.random() * 24,
        w: 1.6 + Math.random() * 2.6,
        d: 2.0 + Math.random() * 3.2,
        xL: -9.2 - Math.random() * 4.2,
        xR: 9.2 + Math.random() * 4.2,
        cool: Math.random() < 0.45,
      });
    }
    return items;
  }, []);

  const poles = useMemo(() => {
    const gap = 9.5;
    const count = Math.floor(LOOP_LEN / gap) + 8;
    return Array.from({ length: count }).map((_, i) => {
      const pick = Math.random();
      const tint =
        pick < 0.5 ? PALETTE.blue : pick < 0.85 ? PALETTE.violet : PALETTE.pink;
      return {
        z: -i * gap - 18 - Math.random() * 6,
        x: (Math.random() < 0.5 ? -1 : 1) * (7.2 + Math.random() * 2.2),
        tint,
        h: 2.6 + Math.random() * 4.0,
      };
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const safeDelta = Math.min(delta, 1 / 60);
    const dz = safeDelta * speed;

    for (let i = 0; i < blocks.length; i++) {
      const L = leftRefs.current[i];
      const R = rightRefs.current[i];

      if (L) {
        L.position.z += dz;
        wrapZ(L, zStart, LOOP_LEN);
      }
      if (R) {
        R.position.z += dz;
        wrapZ(R, zStart, LOOP_LEN);
      }
    }

    for (let i = 0; i < poles.length; i++) {
      const P = poleRefs.current[i];
      if (!P) continue;
      P.position.z += dz * 1.03;
      wrapZ(P, zStart, LOOP_LEN);

      const mat = P.material;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.15 + Math.sin(t * 3.0 + i) * 0.85;
      }
    }
  });

  return (
    <group>
      {blocks.map((b, i) => (
        <group key={i}>
          <mesh
            ref={(el) => (leftRefs.current[i] = el)}
            position={[b.xL, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.cool ? PALETTE.bCool : PALETTE.bDark}
              emissive={b.cool ? PALETTE.violet : "#000000"}
              emissiveIntensity={b.cool ? 0.14 : 0}
              roughness={0.98}
              metalness={0.04}
            />
          </mesh>

          <mesh
            ref={(el) => (rightRefs.current[i] = el)}
            position={[b.xR, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.cool ? PALETTE.bCool : PALETTE.bDark}
              emissive={b.cool ? PALETTE.blue : "#000000"}
              emissiveIntensity={b.cool ? 0.14 : 0}
              roughness={0.98}
              metalness={0.04}
            />
          </mesh>
        </group>
      ))}

      {poles.map((p, i) => (
        <mesh
          key={`pole-${i}`}
          ref={(el) => (poleRefs.current[i] = el)}
          position={[p.x, p.h / 2, p.z]}
        >
          <boxGeometry args={[0.16, p.h, 0.16]} />
          <meshStandardMaterial
            color={p.tint}
            emissive={p.tint}
            emissiveIntensity={1.55}
            roughness={0.25}
            metalness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
