// src/components/backgrounds/scene/GtaRunScene.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "./palette";
import Stars from "./Stars";
import RoadRun from "./RoadRun";
import BuildingsTunnel from "./BuildingsTunnel";

export default function GtaRunScene() {
  const rig = useRef();

  useFrame(({ clock }) => {
    if (!rig.current) return;
    const t = clock.getElapsedTime();

    rig.current.rotation.z = Math.sin(t * 10) * 0.003;
    rig.current.rotation.y = Math.sin(t * 0.8) * 0.05;
    rig.current.position.x = Math.sin(t * 1.2) * 0.25;
    rig.current.position.y = 0.8 + Math.sin(t * 8) * 0.03;
  });

  return (
    <group ref={rig}>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={0.95}
        color={PALETTE.blueLight}
      />
      <pointLight
        position={[-12, 7, -8]}
        intensity={1.4}
        color={PALETTE.violet}
      />
      <pointLight
        position={[12, 7, -12]}
        intensity={1.2}
        color={PALETTE.blue}
      />

      <fog attach="fog" args={[PALETTE.bg, 8, 95]} />

      <Stars />
      <RoadRun />
      <BuildingsTunnel />
    </group>
  );
}
