import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import AnimatedGradientBackground from "../components/backgrounds/animated_gradient/AnimatedGradientBackground";
import CinematicOverlay from "../components/backgrounds/animated_gradient/CinematicOverlay";

export default function Layout() {
  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-x-hidden pt-20"
      style={{
        backgroundColor: "var(--color-bg)",
        backgroundImage: "var(--bg-gradient)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ✅ anima le bolle (scrive --bg-gradient in :root) */}
      <AnimatedGradientBackground />

      {/* ✅ overlay grain/vignette/chroma */}
      <CinematicOverlay />

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 min-w-0 relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
