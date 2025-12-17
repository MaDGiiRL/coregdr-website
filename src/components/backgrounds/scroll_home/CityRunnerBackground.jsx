import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import FpsOverlay from "../../connect/FpsOverlay"; // ✅ aggiusta il path se diverso
import { createGtaTexturePack } from "./gtaTextures";

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

function pickQuality() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const isLow = cores <= 4 || mem <= 4;
  const isMid = cores <= 8 || mem <= 8;
  if (isLow) return "low";
  if (isMid) return "mid";
  return "high";
}

function CityRunnerScene({ scrollRef, quality }) {
  const group = useRef();

  const { roadTex, buildingTex, neonStripeTex } = useMemo(
    () => createGtaTexturePack({ palette: PALETTE, quality }),
    [quality]
  );

  const Q = useMemo(() => {
    if (quality === "low") return { neonMul: 0.45, tubeMul: 0.5, bMul: 0.55 };
    if (quality === "mid") return { neonMul: 0.7, tubeMul: 0.75, bMul: 0.8 };
    return { neonMul: 1, tubeMul: 1, bMul: 1 };
  }, [quality]);

  const speedRef = useRef(0);
  const baseSpeed = 18;

  const ROAD_LOOP = 220;
  const zStart = 18;

  const dashGeo = useMemo(() => new THREE.PlaneGeometry(0.22, 2.2), []);
  const sideGeo = useMemo(() => new THREE.PlaneGeometry(0.16, 5.0), []);
  const neonGeo = useMemo(() => new THREE.BoxGeometry(0.28, 1, 0.05), []);
  const tubeGeo = useMemo(() => new THREE.BoxGeometry(0.18, 1.9, 0.06), []);
  const buildingGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const dashMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8f2ff",
        emissive: new THREE.Color(PALETTE.blueLight),
        emissiveIntensity: 0.8,
        roughness: 0.55,
        metalness: 0.1,
      }),
    []
  );

  const sideMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.violetLight,
        emissive: new THREE.Color(PALETTE.blue),
        emissiveIntensity: 0.26,
        roughness: 0.7,
        metalness: 0.05,
      }),
    []
  );

  const neonMatBlue = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.blue,
        emissive: new THREE.Color(PALETTE.blue),
        emissiveIntensity: 1.15,
        roughness: 0.22,
        metalness: 0.18,
      }),
    []
  );
  const neonMatViolet = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.violet,
        emissive: new THREE.Color(PALETTE.violet),
        emissiveIntensity: 1.15,
        roughness: 0.22,
        metalness: 0.18,
      }),
    []
  );
  const neonMatPink = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.pink,
        emissive: new THREE.Color(PALETTE.pink),
        emissiveIntensity: 1.0,
        roughness: 0.22,
        metalness: 0.18,
      }),
    []
  );

  const tubeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: neonStripeTex,
        color: PALETTE.blue,
        emissive: new THREE.Color(PALETTE.blue),
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.25,
      }),
    [neonStripeTex]
  );

  const bDarkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: buildingTex,
        color: PALETTE.bDark,
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.98,
        metalness: 0.04,
      }),
    [buildingTex]
  );

  const bCoolLeftMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: buildingTex,
        color: PALETTE.bCool,
        emissive: new THREE.Color(PALETTE.violet),
        emissiveIntensity: 0.18,
        roughness: 0.98,
        metalness: 0.04,
      }),
    [buildingTex]
  );

  const bCoolRightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: buildingTex,
        color: PALETTE.bCool,
        emissive: new THREE.Color(PALETTE.blue),
        emissiveIntensity: 0.18,
        roughness: 0.98,
        metalness: 0.04,
      }),
    [buildingTex]
  );

  const dashIM = useRef();
  const sideIM = useRef();
  const neonBlueIM = useRef();
  const neonVioletIM = useRef();
  const neonPinkIM = useRef();
  const tubeIM = useRef();

  const bDarkL = useRef();
  const bDarkR = useRef();
  const bCoolL = useRef();
  const bCoolR = useRef();

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
    const baseCount = Math.floor(ROAD_LOOP / gap) + 44;
    const count = Math.floor(baseCount * Q.neonMul);

    const arr = [];
    for (let i = 0; i < count; i++) {
      const pick = Math.random();
      const tint = pick < 0.52 ? "blue" : pick < 0.86 ? "violet" : "pink";
      arr.push({
        z: -i * gap - Math.random() * 2.8,
        x: (Math.random() < 0.5 ? -1 : 1) * (6.1 + Math.random() * 1.8),
        tint,
        len: 2.1 + Math.random() * 4.4,
      });
    }
    return arr;
  }, [Q.neonMul]);

  const tubes = useMemo(() => {
    const gap = 6.0;
    const baseCount = Math.floor(ROAD_LOOP / gap) + 26;
    const count = Math.floor(baseCount * Q.tubeMul);

    return Array.from({ length: count }, (_, i) => ({
      z: -i * gap - Math.random() * 3.8,
      x: (Math.random() < 0.5 ? -1 : 1) * (3.9 + Math.random() * 1.2),
    }));
  }, [Q.tubeMul]);

  const buildingsAll = useMemo(() => {
    const gap = 3.8;
    const baseCount = Math.floor((ROAD_LOOP + 40) / gap);
    const count = Math.floor(baseCount * Q.bMul);

    return Array.from({ length: count }, (_, i) => ({
      z: -i * gap - 16,
      h: 7 + Math.random() * 26,
      w: 1.6 + Math.random() * 2.4,
      d: 2.1 + Math.random() * 3.2,
      xL: -9.2 - Math.random() * 4.2,
      xR: 9.2 + Math.random() * 4.2,
      cool: Math.random() < 0.55,
    }));
  }, [Q.bMul]);

  const neonGroups = useMemo(() => {
    const blue = [];
    const violet = [];
    const pink = [];
    neons.forEach((n, idx) => {
      if (n.tint === "blue") blue.push({ ...n, idx });
      else if (n.tint === "violet") violet.push({ ...n, idx });
      else pink.push({ ...n, idx });
    });
    return { blue, violet, pink };
  }, [neons]);

  const buildingGroups = useMemo(() => {
    const dark = [];
    const cool = [];
    buildingsAll.forEach((b, idx) => {
      (b.cool ? cool : dark).push({ ...b, idx });
    });
    return { dark, cool };
  }, [buildingsAll]);

  const dashZ = useRef(dashes.map((d) => d.z));
  const sideZ = useRef(sideLines.map((s) => s.z));
  const neonZ = useRef(neons.map((n) => n.z));
  const tubeZ = useRef(tubes.map((t) => t.z));
  const bZ = useRef(buildingsAll.map((b) => b.z));

  const tmp = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 8);
    roadTex.needsUpdate = true;
  }, [roadTex]);

  useEffect(() => {
    if (dashIM.current) {
      for (let i = 0; i < dashes.length; i++) {
        tmp.position.set(0, 0.02, dashZ.current[i]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        dashIM.current.setMatrixAt(i, tmp.matrix);
      }
      dashIM.current.instanceMatrix.needsUpdate = true;
    }

    if (sideIM.current) {
      for (let i = 0; i < sideLines.length; i++) {
        tmp.position.set(sideLines[i].x, 0.02, sideZ.current[i]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        sideIM.current.setMatrixAt(i, tmp.matrix);
      }
      sideIM.current.instanceMatrix.needsUpdate = true;
    }
  }, [dashes.length, sideLines.length, tmp]);

  useEffect(() => {
    const fillNeon = (ref, list) => {
      if (!ref.current) return;
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        tmp.position.set(n.x, 0.03, neonZ.current[n.idx]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, n.len, 1);
        tmp.updateMatrix();
        ref.current.setMatrixAt(i, tmp.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };

    fillNeon(neonBlueIM, neonGroups.blue);
    fillNeon(neonVioletIM, neonGroups.violet);
    fillNeon(neonPinkIM, neonGroups.pink);
  }, [neonGroups, tmp]);

  useEffect(() => {
    if (!tubeIM.current) return;
    for (let i = 0; i < tubes.length; i++) {
      tmp.position.set(tubes[i].x, 0.035, tubeZ.current[i]);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      tubeIM.current.setMatrixAt(i, tmp.matrix);
    }
    tubeIM.current.instanceMatrix.needsUpdate = true;
  }, [tubes.length, tmp]);

  useEffect(() => {
    const fillBuildings = (ref, list, side) => {
      if (!ref.current) return;
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        const x = side === "L" ? b.xL : b.xR;
        const z = bZ.current[b.idx];
        tmp.position.set(x, b.h / 2, z);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(b.w, b.h, b.d);
        tmp.updateMatrix();
        ref.current.setMatrixAt(i, tmp.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };

    fillBuildings(bDarkL, buildingGroups.dark, "L");
    fillBuildings(bDarkR, buildingGroups.dark, "R");
    fillBuildings(bCoolL, buildingGroups.cool, "L");
    fillBuildings(bCoolR, buildingGroups.cool, "R");
  }, [buildingGroups, tmp]);

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

    roadTex.offset.y -= dz * 0.0032;

    const wrap = (z) => (z > zStart ? z - ROAD_LOOP : z);

    if (dashIM.current) {
      for (let i = 0; i < dashZ.current.length; i++) {
        dashZ.current[i] = wrap(dashZ.current[i] + dz);
        tmp.position.set(0, 0.02, dashZ.current[i]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        dashIM.current.setMatrixAt(i, tmp.matrix);
      }
      dashIM.current.instanceMatrix.needsUpdate = true;
    }

    if (sideIM.current) {
      for (let i = 0; i < sideZ.current.length; i++) {
        sideZ.current[i] = wrap(sideZ.current[i] + dz * 0.95);
        tmp.position.set(sideLines[i].x, 0.02, sideZ.current[i]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        sideIM.current.setMatrixAt(i, tmp.matrix);
      }
      sideIM.current.instanceMatrix.needsUpdate = true;
    }

    const updateNeonList = (ref, list, speedMul = 1.06) => {
      if (!ref.current) return;
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        neonZ.current[n.idx] = wrap(neonZ.current[n.idx] + dz * speedMul);
        tmp.position.set(n.x, 0.03, neonZ.current[n.idx]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, n.len, 1);
        tmp.updateMatrix();
        ref.current.setMatrixAt(i, tmp.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateNeonList(neonBlueIM, neonGroups.blue);
    updateNeonList(neonVioletIM, neonGroups.violet);
    updateNeonList(neonPinkIM, neonGroups.pink);

    if (tubeIM.current) {
      for (let i = 0; i < tubeZ.current.length; i++) {
        tubeZ.current[i] = wrap(tubeZ.current[i] + dz * 1.02);
        tmp.position.set(tubes[i].x, 0.035, tubeZ.current[i]);
        tmp.rotation.set(-Math.PI / 2, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        tubeIM.current.setMatrixAt(i, tmp.matrix);
      }
      tubeIM.current.instanceMatrix.needsUpdate = true;
    }

    const updateBuildings = (ref, list, side, speedMul = 0.78) => {
      if (!ref.current) return;
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        bZ.current[b.idx] = wrap(bZ.current[b.idx] + dz * speedMul);
        const x = side === "L" ? b.xL : b.xR;
        tmp.position.set(x, b.h / 2, bZ.current[b.idx]);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(b.w, b.h, b.d);
        tmp.updateMatrix();
        ref.current.setMatrixAt(i, tmp.matrix);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateBuildings(bDarkL, buildingGroups.dark, "L");
    updateBuildings(bDarkR, buildingGroups.dark, "R");
    updateBuildings(bCoolL, buildingGroups.cool, "L");
    updateBuildings(bCoolR, buildingGroups.cool, "R");
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={0.95}
        color={PALETTE.blueLight}
      />
      <pointLight position={[-12, 7, -8]} intensity={1.3} color={PALETTE.violet} />
      <pointLight position={[12, 7, -12]} intensity={1.1} color={PALETTE.blue} />
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

      <instancedMesh ref={dashIM} args={[dashGeo, dashMat, dashes.length]} />
      <instancedMesh ref={sideIM} args={[sideGeo, sideMat, sideLines.length]} />

      <instancedMesh
        ref={neonBlueIM}
        args={[neonGeo, neonMatBlue, neonGroups.blue.length]}
      />
      <instancedMesh
        ref={neonVioletIM}
        args={[neonGeo, neonMatViolet, neonGroups.violet.length]}
      />
      <instancedMesh
        ref={neonPinkIM}
        args={[neonGeo, neonMatPink, neonGroups.pink.length]}
      />

      <instancedMesh ref={tubeIM} args={[tubeGeo, tubeMat, tubes.length]} />

      <instancedMesh
        ref={bDarkL}
        args={[buildingGeo, bDarkMat, buildingGroups.dark.length]}
      />
      <instancedMesh
        ref={bDarkR}
        args={[buildingGeo, bDarkMat, buildingGroups.dark.length]}
      />
      <instancedMesh
        ref={bCoolL}
        args={[buildingGeo, bCoolLeftMat, buildingGroups.cool.length]}
      />
      <instancedMesh
        ref={bCoolR}
        args={[buildingGeo, bCoolRightMat, buildingGroups.cool.length]}
      />
    </group>
  );
}

export default function CityRunnerBackground({
  navHeight = 70,
  scrollYProgress,
  showStats = true,
}) {
  const [webglOk, setWebglOk] = useState(true);
  const [quality] = useState(() => pickQuality());
  const scrollRef = useRef(0);

  useEffect(() => {
    if (!scrollYProgress) return;
    const unsub = scrollYProgress.on("change", (v) => {
      scrollRef.current = v;
    });
    return () => unsub?.();
  }, [scrollYProgress]);

  useEffect(() => {
    if (!scrollYProgress) scrollRef.current = 0.2;
  }, [scrollYProgress]);

  const dpr = quality === "low" ? 1 : quality === "mid" ? 1.25 : 1.5;
  const enableBloom = quality !== "low";
  const canvasElRef = useRef(null);

  useEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;

    const onLost = (e) => {
      e.preventDefault();
      setWebglOk(false);
    };

    canvas.addEventListener("webglcontextlost", onLost, false);
    return () => canvas.removeEventListener("webglcontextlost", onLost, false);
  }, [canvasElRef.current]);

  return (
    <>
      {showStats && webglOk && (
        <FpsOverlay bottom={12} right={12} zIndex={100001} />
      )}

      <div
        className="fixed inset-x-0 pointer-events-none z-0"
        style={{ top: navHeight, height: `calc(100vh - ${navHeight}px)` }}
      >
        {!webglOk ? (
          <div className="absolute inset-0 bg-[var(--bg-gradient)] opacity-90" />
        ) : (
          <Canvas
            frameloop="always"
            dpr={dpr}
            performance={{ min: 0.5 }}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
              preserveDrawingBuffer: false,
            }}
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [0, 5.2, 14], fov: 58, near: 0.1, far: 260 }}
            onCreated={({ gl }) => {
              canvasElRef.current = gl.domElement;
            }}
          >
            <color attach="background" args={[PALETTE.bg]} />
            <CityRunnerScene scrollRef={scrollRef} quality={quality} />

            {enableBloom && (
              <EffectComposer>
                <Bloom
                  intensity={quality === "mid" ? 0.6 : 0.85}
                  mipmapBlur
                  luminanceThreshold={quality === "mid" ? 0.35 : 0.25}
                  luminanceSmoothing={0.25}
                />
              </EffectComposer>
            )}
          </Canvas>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(53,210,255,0.10),transparent_45%),radial-gradient(circle_at_bottom,rgba(111,47,217,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
      </div>
    </>
  );
}
