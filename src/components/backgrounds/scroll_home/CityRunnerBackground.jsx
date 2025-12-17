import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { makeNeonShaderMaterial, makeBuildingShaderMaterial } from "./gpuInstancedMaterials";

import FpsOverlay from "../../connect/FpsOverlay";
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

/**
 * DPR adattivo: mantiene fluidità (non limita FPS) ma abbassa risoluzione quando serve.
 */
function useAdaptiveDpr(quality) {
  const maxDpr = quality === "low" ? 1.0 : quality === "mid" ? 1.25 : 1.5;
  const minDpr = 1.0;
  const [dpr, setDpr] = useState(maxDpr);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;

    const loop = (t) => {
      frames++;
      const dt = t - last;
      if (dt >= 700) {
        const fps = (frames * 1000) / dt;
        frames = 0;
        last = t;

        setDpr((cur) => {
          // scende più velocemente se soffre, sale lentamente se va bene
          if (fps < 52) return Math.max(minDpr, cur - 0.12);
          if (fps > 58) return Math.min(maxDpr, cur + 0.04);
          return cur;
        });
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [quality]);

  // quando cambia quality, riallinea subito
  useEffect(() => {
    setDpr(maxDpr);
  }, [maxDpr]);

  return dpr;
}

/**
 * Prepara setMatrixAt super veloce con Matrix4.
 */
function setInstanceMatrix(im, i, m) {
  im.setMatrixAt(i, m);
}

function CityRunnerScene({ scrollRef, quality }) {
  const group = useRef();

  const { roadTex, buildingTex, neonStripeTex } = useMemo(
    () => createGtaTexturePack({ palette: PALETTE, quality }),
    [quality]
  );

  // Moltiplicatori: spingi più aggressivo in low
  const Q = useMemo(() => {
    if (quality === "low") return { neonMul: 0.3, tubeMul: 0.35, bMul: 0.4 };
    if (quality === "mid") return { neonMul: 0.6, tubeMul: 0.7, bMul: 0.75 };
    return { neonMul: 1.0, tubeMul: 1.0, bMul: 1.0 };
  }, [quality]);

  const speedRef = useRef(0);
  const baseSpeed = 18;

  const ROAD_LOOP = quality === "high" ? 210 : quality === "mid" ? 190 : 165;
  const zStart = 18;

  // Geometrie riusate
  const dashGeo = useMemo(() => new THREE.PlaneGeometry(0.22, 2.2), []);
  const sideGeo = useMemo(() => new THREE.PlaneGeometry(0.16, 5.0), []);
  const neonGeo = useMemo(() => new THREE.BoxGeometry(0.28, 1, 0.05), []);
  const tubeGeo = useMemo(() => new THREE.BoxGeometry(0.18, 1.9, 0.06), []);
  const buildingGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Materiali
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

  // Refs instanced mesh
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

  // ---- DATA (precompute)
  const dashes = useMemo(() => {
    const gap = 4.2;
    const count = Math.floor(ROAD_LOOP / gap);
    return { gap, count };
  }, [ROAD_LOOP]);

  const sideLines = useMemo(() => {
    const gap = 6.4;
    const count = Math.floor(ROAD_LOOP / gap);
    // x alternati precomputati in Float32Array
    const x = new Float32Array(count);
    for (let i = 0; i < count; i++) x[i] = i % 2 ? 4.8 : -4.8;
    return { gap, count, x };
  }, [ROAD_LOOP]);

  const neons = useMemo(() => {
    const gap = 4.0;
    const baseCount = Math.floor(ROAD_LOOP / gap) + 44;
    const count = Math.max(1, Math.floor(baseCount * Q.neonMul));

    // arrays compatti
    const x = new Float32Array(count);
    const len = new Float32Array(count);
    const tint = new Uint8Array(count); // 0 blue, 1 violet, 2 pink
    const z0 = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const pick = Math.random();
      const t = pick < 0.52 ? 0 : pick < 0.86 ? 1 : 2;
      tint[i] = t;
      z0[i] = -i * gap - Math.random() * 2.8;
      x[i] = (Math.random() < 0.5 ? -1 : 1) * (6.1 + Math.random() * 1.8);
      len[i] = 2.1 + Math.random() * 4.4;
    }
    return { gap, count, x, len, tint, z0 };
  }, [ROAD_LOOP, Q.neonMul]);

  const tubes = useMemo(() => {
    const gap = 6.0;
    const baseCount = Math.floor(ROAD_LOOP / gap) + 26;
    const count = Math.max(1, Math.floor(baseCount * Q.tubeMul));
    const x = new Float32Array(count);
    const z0 = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      z0[i] = -i * gap - Math.random() * 3.8;
      x[i] = (Math.random() < 0.5 ? -1 : 1) * (3.9 + Math.random() * 1.2);
    }
    return { gap, count, x, z0 };
  }, [ROAD_LOOP, Q.tubeMul]);

  const buildingsAll = useMemo(() => {
    const gap = quality === "high" ? 4.2 : quality === "mid" ? 4.8 : 5.4;
    const baseCount = Math.floor((ROAD_LOOP + 40) / gap);
    const count = Math.max(1, Math.floor(baseCount * Q.bMul));

    // compatti
    const z0 = new Float32Array(count);
    const h = new Float32Array(count);
    const w = new Float32Array(count);
    const d = new Float32Array(count);
    const xL = new Float32Array(count);
    const xR = new Float32Array(count);
    const cool = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      z0[i] = -i * gap - 16;
      h[i] = 7 + Math.random() * 26;
      w[i] = 1.6 + Math.random() * 2.4;
      d[i] = 2.1 + Math.random() * 3.2;
      xL[i] = -9.2 - Math.random() * 4.2;
      xR[i] = 9.2 + Math.random() * 4.2;
      cool[i] = Math.random() < 0.55 ? 1 : 0;
    }
    return { count, z0, h, w, d, xL, xR, cool };
  }, [ROAD_LOOP, Q.bMul, quality]);

  // ---- Z state (mutabile, zero allocations per frame)
  const dashZ = useRef(null);
  const sideZ = useRef(null);
  const neonZ = useRef(null);
  const tubeZ = useRef(null);
  const bZ = useRef(null);

  useEffect(() => {
    dashZ.current = new Float32Array(dashes.count);
    for (let i = 0; i < dashes.count; i++) dashZ.current[i] = -i * dashes.gap;

    sideZ.current = new Float32Array(sideLines.count);
    for (let i = 0; i < sideLines.count; i++)
      sideZ.current[i] = -i * sideLines.gap;

    neonZ.current = new Float32Array(neons.count);
    neonZ.current.set(neons.z0);

    tubeZ.current = new Float32Array(tubes.count);
    tubeZ.current.set(tubes.z0);

    bZ.current = new Float32Array(buildingsAll.count);
    bZ.current.set(buildingsAll.z0);
  }, [dashes, sideLines, neons, tubes, buildingsAll]);

  // ---- Matrici / temp
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const rotNeon = useMemo(() => new THREE.Euler(-Math.PI / 2, 0, 0), []);
  const rotFlatQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(rotNeon),
    [rotNeon]
  );

  // ---- Texture setup
  useEffect(() => {
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 8);
    roadTex.needsUpdate = true;
  }, [roadTex]);

  // ---- Mark instance matrices dynamic + initial fill
  useEffect(() => {
    const markDynamic = (ref) => {
      if (!ref.current) return;
      ref.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    };

    [
      dashIM,
      sideIM,
      neonBlueIM,
      neonVioletIM,
      neonPinkIM,
      tubeIM,
      bDarkL,
      bDarkR,
      bCoolL,
      bCoolR,
    ].forEach(markDynamic);
  }, []);

  // ---- Initial fill (una sola volta per set)
  useEffect(() => {
    // dashes
    if (dashIM.current && dashZ.current) {
      for (let i = 0; i < dashes.count; i++) {
        pos.set(0, 0.02, dashZ.current[i]);
        scl.set(1, 1, 1);
        m4.compose(pos, rotFlatQuat, scl);
        setInstanceMatrix(dashIM.current, i, m4);
      }
      dashIM.current.instanceMatrix.needsUpdate = true;
    }

    // sides
    if (sideIM.current && sideZ.current) {
      for (let i = 0; i < sideLines.count; i++) {
        pos.set(sideLines.x[i], 0.02, sideZ.current[i]);
        scl.set(1, 1, 1);
        m4.compose(pos, rotFlatQuat, scl);
        setInstanceMatrix(sideIM.current, i, m4);
      }
      sideIM.current.instanceMatrix.needsUpdate = true;
    }

    // tubes
    if (tubeIM.current && tubeZ.current) {
      for (let i = 0; i < tubes.count; i++) {
        pos.set(tubes.x[i], 0.035, tubeZ.current[i]);
        scl.set(1, 1, 1);
        m4.compose(pos, rotFlatQuat, scl);
        setInstanceMatrix(tubeIM.current, i, m4);
      }
      tubeIM.current.instanceMatrix.needsUpdate = true;
    }
  }, [dashes.count, sideLines, tubes, m4, pos, scl, rotFlatQuat]);

  // ---- Neon indices per tint (liste di indici)
  const neonIdxByTint = useMemo(() => {
    const blue = [];
    const violet = [];
    const pink = [];
    for (let i = 0; i < neons.count; i++) {
      const t = neons.tint[i];
      if (t === 0) blue.push(i);
      else if (t === 1) violet.push(i);
      else pink.push(i);
    }
    return { blue, violet, pink };
  }, [neons]);

  // ---- Building indices per cool
  const buildingIdx = useMemo(() => {
    const dark = [];
    const cool = [];
    for (let i = 0; i < buildingsAll.count; i++) {
      (buildingsAll.cool[i] ? cool : dark).push(i);
    }
    return { dark, cool };
  }, [buildingsAll]);

  // ---- Helper: wrap
  const wrap = (z) => (z > zStart ? z - ROAD_LOOP : z);

  // ---- Round-robin update budget (più aggressivo su low)
  const tick = useRef(0);
  const neonSlices = quality === "high" ? 3 : quality === "mid" ? 4 : 6; // più slice = meno lavoro/frame
  const buildSlices = quality === "high" ? 2 : quality === "mid" ? 3 : 5;

  useFrame(({ clock }, delta) => {
    if (
      !dashZ.current ||
      !sideZ.current ||
      !neonZ.current ||
      !tubeZ.current ||
      !bZ.current
    )
      return;

    tick.current++;
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

    // Scorrimento texture (super cheap)
    roadTex.offset.y -= dz * 0.0032;

    // --- dashes (aggiorna tutti: sono pochi e importanti visivamente)
    if (dashIM.current) {
      for (let i = 0; i < dashes.count; i++) {
        dashZ.current[i] = wrap(dashZ.current[i] + dz);
        pos.set(0, 0.02, dashZ.current[i]);
        scl.set(1, 1, 1);
        m4.compose(pos, rotFlatQuat, scl);
        dashIM.current.setMatrixAt(i, m4);
      }
      dashIM.current.instanceMatrix.needsUpdate = true;
    }

    // --- side lines (tutti, ma pochi)
    if (sideIM.current) {
      for (let i = 0; i < sideLines.count; i++) {
        sideZ.current[i] = wrap(sideZ.current[i] + dz * 0.95);
        pos.set(sideLines.x[i], 0.02, sideZ.current[i]);
        scl.set(1, 1, 1);
        m4.compose(pos, rotFlatQuat, scl);
        sideIM.current.setMatrixAt(i, m4);
      }
      sideIM.current.instanceMatrix.needsUpdate = true;
    }

    // --- tubes (update a slice su mid/low)
    if (tubeIM.current) {
      const phase = tick.current % (quality === "high" ? 1 : 2);
      if (phase === 0) {
        for (let i = 0; i < tubes.count; i++) {
          tubeZ.current[i] = wrap(tubeZ.current[i] + dz * 1.02);
          pos.set(tubes.x[i], 0.035, tubeZ.current[i]);
          scl.set(1, 1, 1);
          m4.compose(pos, rotFlatQuat, scl);
          tubeIM.current.setMatrixAt(i, m4);
        }
        tubeIM.current.instanceMatrix.needsUpdate = true;
      } else {
        // anche se non aggiorni matrici, aggiorna la Z state per coerenza
        for (let i = 0; i < tubes.count; i++)
          tubeZ.current[i] = wrap(tubeZ.current[i] + dz * 1.02);
      }
    }

    // --- NEON: aggiorna 1 slice per frame, per OGNI TINT (molto più leggero)
    const updateNeonTintSlice = (ref, idxList, sliceCount, speedMul) => {
      if (!ref.current || idxList.length === 0) return;

      const phase = tick.current % sliceCount;
      const per = Math.ceil(idxList.length / sliceCount);
      const start = phase * per;
      const end = Math.min(idxList.length, start + per);

      // aggiorna z per tutti, matrice solo per slice
      for (let k = 0; k < idxList.length; k++) {
        const idx = idxList[k];
        neonZ.current[idx] = wrap(neonZ.current[idx] + dz * speedMul);
      }

      for (let k = start; k < end; k++) {
        const idx = idxList[k];
        // instance index dentro ref: è k (posizione nella lista), non idx globale
        // quindi aggiorni solo le istanze [start..end)
        const x = neons.x[idx];
        const z = neonZ.current[idx];
        const L = neons.len[idx];

        pos.set(x, 0.03, z);
        scl.set(1, L, 1);
        m4.compose(pos, rotFlatQuat, scl);
        ref.current.setMatrixAt(k, m4);
      }
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateNeonTintSlice(neonBlueIM, neonIdxByTint.blue, neonSlices, 1.06);
    updateNeonTintSlice(neonVioletIM, neonIdxByTint.violet, neonSlices, 1.06);
    updateNeonTintSlice(neonPinkIM, neonIdxByTint.pink, neonSlices, 1.06);

    // --- BUILDINGS: aggiorna z per tutti, matrice solo 1 slice per lato+tipo
    const updateBuildingsSlice = (ref, idxList, side, sliceCount, speedMul) => {
      if (!ref.current || idxList.length === 0) return;

      const phase = tick.current % sliceCount;
      const per = Math.ceil(idxList.length / sliceCount);
      const start = phase * per;
      const end = Math.min(idxList.length, start + per);

      // aggiorna z per tutti
      for (let k = 0; k < idxList.length; k++) {
        const idx = idxList[k];
        bZ.current[idx] = wrap(bZ.current[idx] + dz * speedMul);
      }

      // aggiorna matrici solo per slice
      for (let k = start; k < end; k++) {
        const idx = idxList[k];
        const z = bZ.current[idx];
        const x = side === "L" ? buildingsAll.xL[idx] : buildingsAll.xR[idx];
        const hh = buildingsAll.h[idx];
        pos.set(x, hh * 0.5, z);
        scl.set(buildingsAll.w[idx], hh, buildingsAll.d[idx]);
        m4.compose(pos, quat.identity(), scl); // edifici dritti
        ref.current.setMatrixAt(k, m4);
      }

      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateBuildingsSlice(bDarkL, buildingIdx.dark, "L", buildSlices, 0.78);
    updateBuildingsSlice(bDarkR, buildingIdx.dark, "R", buildSlices, 0.78);
    updateBuildingsSlice(bCoolL, buildingIdx.cool, "L", buildSlices, 0.78);
    updateBuildingsSlice(bCoolR, buildingIdx.cool, "R", buildSlices, 0.78);
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
      <fog attach="fog" args={[PALETTE.bg, 8, quality === "low" ? 80 : 95]} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -85]}>
        <planeGeometry args={[16.2, 260]} />
        <meshStandardMaterial
          map={roadTex}
          color={PALETTE.asphalt}
          roughness={0.98}
          metalness={0.03}
        />
      </mesh>

      <instancedMesh ref={dashIM} args={[dashGeo, dashMat, dashes.count]} />
      <instancedMesh ref={sideIM} args={[sideGeo, sideMat, sideLines.count]} />

      <instancedMesh
        ref={neonBlueIM}
        args={[neonGeo, neonMatBlue, neonIdxByTint.blue.length]}
      />
      <instancedMesh
        ref={neonVioletIM}
        args={[neonGeo, neonMatViolet, neonIdxByTint.violet.length]}
      />
      <instancedMesh
        ref={neonPinkIM}
        args={[neonGeo, neonMatPink, neonIdxByTint.pink.length]}
      />

      <instancedMesh ref={tubeIM} args={[tubeGeo, tubeMat, tubes.count]} />

      <instancedMesh
        ref={bDarkL}
        args={[buildingGeo, bDarkMat, buildingIdx.dark.length]}
      />
      <instancedMesh
        ref={bDarkR}
        args={[buildingGeo, bDarkMat, buildingIdx.dark.length]}
      />
      <instancedMesh
        ref={bCoolL}
        args={[buildingGeo, bCoolLeftMat, buildingIdx.cool.length]}
      />
      <instancedMesh
        ref={bCoolR}
        args={[buildingGeo, bCoolRightMat, buildingIdx.cool.length]}
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
  const dpr = useAdaptiveDpr(quality);

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

  const enableBloom = quality !== "low";
  const canvasDomRef = useRef(null);

  useEffect(() => {
    const canvas = canvasDomRef.current;
    if (!canvas) return;

    const onLost = (e) => {
      e.preventDefault();
      setWebglOk(false);
    };
    canvas.addEventListener("webglcontextlost", onLost, false);
    return () => canvas.removeEventListener("webglcontextlost", onLost, false);
  }, [webglOk]);

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
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
              preserveDrawingBuffer: false,
            }}
            camera={{ position: [0, 5.2, 14], fov: 58, near: 0.1, far: 260 }}
            onCreated={({ gl }) => {
              canvasDomRef.current = gl.domElement;
              // extra: riduce banda in alcuni browser
              gl.setPixelRatio(dpr);
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <color attach="background" args={[PALETTE.bg]} />
            <CityRunnerScene scrollRef={scrollRef} quality={quality} />

            {enableBloom && (
              <EffectComposer multisampling={0}>
                <Bloom
                  intensity={quality === "high" ? 0.5 : 0.35}
                  luminanceThreshold={0.5}
                  luminanceSmoothing={0.2}
                  mipmapBlur={false}
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
