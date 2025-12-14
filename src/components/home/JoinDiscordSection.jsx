// src/pages/Home/JoinDiscordSection.jsx
import { Canvas, useLoader } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import logo from "../../assets/img/logo.png";

function Logo3D() {
  const texture = useLoader(THREE.TextureLoader, logo);

  return (
    <Float speed={2} floatIntensity={1.5} rotationIntensity={0.5}>
      <mesh>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

export default function JoinDiscordSection() {
  return (
    <section
      id="join-discord"
      className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-r from-[#181a33]/90 via-[#15162c]/90 to-[#181a33]/90 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl overflow-hidden relative min-w-0"
    >
      {/* glow dietro */}
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,var(--blue)_0,transparent_55%)]" />

      <div className="relative z-10 max-w-xl space-y-3 min-w-0">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1">
          Entra nel nostro Discord
        </h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)]">
          Il Discord è il cuore della community: annunci, whitelist, supporto,
          segnalazioni, eventi e tutto ciò che riguarda il server.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
          <a
            href="https://discord.gg/AgQbbnzwMc"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full font-medium bg-[var(--blue)] text-[#050816] shadow-lg hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-transform transition-shadow text-sm md:text-base"
          >
            Unisciti al Discord
          </a>
        </div>
      </div>

      {/* Parte 3D con logo */}
      <div className="relative z-10 w-full md:w-1/2 h-56 md:h-64 lg:h-72 rounded-3xl border border-white/10 bg-black/40 overflow-hidden min-w-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={1}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 3, 5]} intensity={1.2} />

          <Logo3D />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={1.2}
          />
        </Canvas>
      </div>
    </section>
  );
}
