import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  Ban,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  alertError,
  alertWarning,
  confirmAction,
  toast,
} from "../../lib/alerts";

const STATUS_LABELS = {
  pending: "In attesa",
  approved: "Approvato",
  rejected: "Rifiutato",
};

const STATUS_COLORS = {
  pending: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
  approved: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  rejected: "bg-red-400/15 text-red-300 border-red-400/40",
};

export default function BackgroundQueue() {
  const { profile, loading } = useAuth();
  const reduce = useReducedMotion();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionDraft, setRejectionDraft] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState({
    storiaBreve: "",
    condannePenali: "",
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });

  const canModerate = profile?.is_admin || profile?.is_moderator;
  const isAdmin = !!profile?.is_admin;

  const loadBackgrounds = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select(
          `
          id,
          user_id,
          status,
          nome,
          cognome,
          storia_breve,
          condanne_penali,
          segni_distintivi,
          aspetti_caratteriali,
          rejection_reason,
          created_at,
          updated_at,
          profiles:profiles!characters_user_id_fkey (
            discord_username,
            discord_id
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped =
        data?.map((row) => ({
          id: row.id,
          status: row.status,
          nome: row.nome,
          cognome: row.cognome,
          discordName: row.profiles?.discord_username ?? "Senza nome",
          discordId: row.profiles?.discord_id ?? "",
          submittedAt: row.created_at,
          lastUpdatedAt: row.updated_at,
          rejectionReason: row.rejection_reason ?? "",
          data: {
            storiaBreve: row.storia_breve ?? "",
            condannePenali: row.condanne_penali ?? "",
            segniDistintivi: row.segni_distintivi ?? "",
            aspettiCaratteriali: row.aspetti_caratteriali ?? "",
          },
        })) ?? [];

      setItems(mapped);
      setSelectedId(mapped[0]?.id ?? null);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      await alertError("Errore", "Impossibile caricare i background.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (profile && canModerate) loadBackgrounds();
    // eslint-disable-next-line
  }, [profile]);

  const filtered = items.filter((i) =>
    filter === "all" ? true : i.status === filter
  );
  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  const updateStatus = async (status) => {
    if (!selected || selected.status === "approved") return;

    if (status === "rejected" && !rejectionDraft.trim()) {
      await alertWarning("Motivo mancante", "Inserisci una motivazione.");
      return;
    }

    const ok = await confirmAction({
      title: "Conferma operazione",
      text: "Vuoi procedere?",
      confirmText: "Sì",
      cancelText: "Annulla",
    });
    if (!ok) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({
          status,
          rejection_reason: status === "rejected" ? rejectionDraft : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === selected.id
            ? { ...i, status, rejectionReason: rejectionDraft }
            : i
        )
      );

      toast(
        "success",
        status === "approved" ? "Background approvato" : "Background rifiutato"
      );
    } catch (err) {
      console.error(err);
      await alertError("Errore", "Operazione fallita.");
    } finally {
      setUpdating(false);
      setRejectionDraft("");
    }
  };

  if (loading) return null;

  if (!profile || !canModerate) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Non hai i permessi.
      </p>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-2">
        <div className="flex gap-2 text-xs">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full border"
            >
              {STATUS_LABELS[f] ?? "Tutti"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((bg) => (
            <button
              key={bg.id}
              onClick={() => {
                setSelectedId(bg.id);
                setEditMode(false);
              }}
              className="w-full text-left border rounded-xl p-3"
            >
              <div className="flex justify-between">
                <span>
                  {bg.nome} {bg.cognome}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] ${
                    STATUS_COLORS[bg.status]
                  }`}
                >
                  {STATUS_LABELS[bg.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="lg:col-span-8">
        {selected && (
          <div className="border rounded-2xl p-4 space-y-4">
            <h2 className="text-lg font-semibold">
              {selected.nome} {selected.cognome}
            </h2>

            {selected.status === "approved" ? (
              <p className="text-sm text-emerald-300">
                Background approvato – non modificabile.
              </p>
            ) : (
              <>
                <textarea
                  className="w-full border rounded-xl p-2"
                  placeholder="Motivazione rifiuto"
                  value={rejectionDraft}
                  onChange={(e) => setRejectionDraft(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus("approved")}
                    className="px-4 py-2 bg-emerald-500 rounded-full"
                  >
                    Approva
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    className="px-4 py-2 bg-red-500 rounded-full"
                  >
                    Rifiuta
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </section>
  );
}
