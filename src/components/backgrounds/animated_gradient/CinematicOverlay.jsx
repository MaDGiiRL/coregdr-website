export default function CinematicOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 30%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.52) 100%)",
        }}
      />

      {/* chroma / glow (leggero jitter) */}
      <div className="absolute inset-0 chroma-layer" />

      {/* grain */}
      <div className="absolute inset-0 grain-layer" />
    </div>
  );
}
