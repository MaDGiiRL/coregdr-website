// src/routes/Routing.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";

import Home from "../pages/Home";
import HowToConnect from "../pages/HowToConnect";
import Rules from "../pages/Rules";
import CharacterDashboard from "../pages/CharacterDashboard";
import BackgroundForm from "../pages/BackgroundForm";
import Staff from "../pages/Staff";
import TramaTV from "../pages/TramaTV";

import BackgroundQueue from "../pages/admin/BackgroundQueue";
import AdminDashboard from "../pages/admin/AdminDashboard";

import ProtectedRoute from "./ProtectedRoute";

export default function Routing() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/how-to-connect" element={<HowToConnect />} />
        <Route path="/regolamento" element={<Rules />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/trama" element={<TramaTV />} />
        {/* AUTH (logged-in) */}
        <Route element={<ProtectedRoute requireAuth redirectTo="/" />}>
          <Route path="/dashboard" element={<CharacterDashboard />} />
          <Route path="/background" element={<BackgroundForm />} />
        </Route>

        {/* ADMIN ONLY */}
        <Route
          element={<ProtectedRoute requireAuth requireAdmin redirectTo="/" />}
        >
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* MOD ONLY (SOLO MOD, NON ADMIN) */}
        <Route element={<ProtectedRoute requireAuth modOnly redirectTo="/" />}>
          <Route path="/admin/backgrounds" element={<BackgroundQueue />} />
        </Route>
      </Route>
    </Routes>
  );
}
