// src/routes/Routing.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import Home from "../pages/Home";
import HowToConnect from "../pages/HowToConnect";
import Rules from "../pages/Rules";
import CharacterDashboard from "../pages/CharacterDashboard";
import BackgroundForm from "../pages/BackgroundForm";
import BackgroundQueue from "../pages/admin/BackgroundQueue";
import AdminDashboard from "../pages/admin/AdminDashboard";

export default function Routing() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-connect" element={<HowToConnect />} />
        <Route path="/regolamento" element={<Rules />} />
        <Route path="/dashboard" element={<CharacterDashboard />} />
        <Route path="/background" element={<BackgroundForm />} />
        {/* admin ONLY */}
        <Route path="/admin" element={<AdminDashboard />} />
        {/* se vuoi route diretta solo coda BG */}
        <Route path="/admin/backgrounds" element={<BackgroundQueue />} />
      </Route>
    </Routes>
  );
}
