// src/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Layout() {
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{
        backgroundImage: "var(--bg-gradient)",
        color: "var(--color-text)",
      }}
    >
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
