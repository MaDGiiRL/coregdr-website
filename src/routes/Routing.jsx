// src/routes/Routing.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";

import Home from "../pages/home/Home";
import HowToConnect from "../pages/connect/HowToConnect";
import Rules from "../pages/rules/Rules";
import CharacterDashboard from "../pages/users/CharacterDashboard";
import BackgroundForm from "../pages/users/BackgroundForm";
import Staff from "../pages/staff/Staff";
import TramaTV from "../pages/trama/TramaTV";

import BackgroundQueue from "../pages/admin/BackgroundQueue";
import AdminDashboard from "../pages/admin/AdminDashboard";

import ProtectedRoute from "./protectedRoute";

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
