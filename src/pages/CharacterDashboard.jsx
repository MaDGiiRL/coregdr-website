import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { alertError, alertWarning, confirmAction, toast } from "../lib/alerts";

export default function CharacterDashboard() {
  const { profile, session, loading } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!profile) return;

    supabase
      .from("characters")
      .select("*")
      .eq("user_id", profile.id)
      .then(({ data }) => {
        setCharacters(data || []);
        setActiveId(data?.[0]?.id ?? null);
      });
  }, [profile]);

  if (loading) return null;

  if (!session || !profile) {
    return <p>Devi effettuare il login.</p>;
  }

  const active = characters.find((c) => c.id === activeId);

  const startEdit = async () => {
    if (active.status === "approved") {
      await alertWarning(
        "Non modificabile",
        "Questo background è stato approvato e non può più essere modificato."
      );
      return;
    }

    const ok = await confirmAction({
      title: "Modifica background?",
      text: "Il BG tornerà in revisione.",
      confirmText: "Ok",
      cancelText: "Annulla",
    });
    if (!ok) return;

    setDraft(active.storia_breve || "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    const ok = await confirmAction({
      title: "Salvare?",
      text: "Il BG tornerà in revisione.",
      confirmText: "Sì",
      cancelText: "Annulla",
    });
    if (!ok) return;

    try {
      const { data, error } = await supabase
        .from("characters")
        .update({
          storia_breve: draft,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", active.id)
        .select()
        .single();

      if (error) throw error;

      setCharacters((prev) => prev.map((c) => (c.id === active.id ? data : c)));
      setEditMode(false);
      toast("success", "Background aggiornato");
    } catch (err) {
      console.error(err);
      await alertError("Errore", "Salvataggio fallito.");
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">I tuoi background</h1>

      <div className="flex gap-2">
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveId(c.id);
              setEditMode(false);
            }}
            className="border rounded-xl px-3 py-2"
          >
            {c.nome} {c.cognome}
          </button>
        ))}
      </div>

      {active && (
        <div className="border rounded-2xl p-4 space-y-3">
          <p>
            Stato: <strong>{active.status}</strong>
          </p>

          {active.status === "approved" && (
            <p className="text-emerald-300 text-sm">
              Questo background è approvato e non modificabile.
            </p>
          )}

          {!editMode ? (
            <>
              <p>{active.storia_breve}</p>
              <button
                onClick={startEdit}
                disabled={active.status === "approved"}
                className="px-4 py-2 bg-blue-500 rounded-full disabled:opacity-50"
              >
                Modifica background
              </button>
            </>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full border rounded-xl p-2"
              />
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-emerald-500 rounded-full"
              >
                Salva
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
