// src/components/backgrounds/scene/Stars.jsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "./palette";

export default function Stars() {
  const points = useRef();

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 800; // ✅ ridotto = più stabile
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 65 + 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.y = clock.getElapsedTime() * 0.012;
  });

  return (
    <points ref={points} geometry={geom}>
      <pointsMaterial
        size={0.14}
        sizeAttenuation
        transparent
        opacity={0.55}
        color={PALETTE.blueLight}
      />
    </points>
  );
}
