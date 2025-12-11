// src/pages/BackgroundForm.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const MAX_STORIA = 5000;
const MAX_CONDANNE = 300;

export default function BackgroundForm() {
  const { profile, session, loading } = useAuth();

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    sesso: "",
    statoNascita: "",
    etnia: "",
    dataNascita: "",
    storiaBreve: "",
    condannePenali: "",
    patologie: [{ id: 1, nome: "", inCura: false }],
    dipendenze: [{ id: 1, nome: "", inCura: false }],
    segniDistintivi: "",
    aspettiCaratteriali: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // "ok" | "error"

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, id, key, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
  };

  const handleArrayAdd = (field) => {
    setForm((prev) => {
      const nextId =
        prev[field].length > 0
          ? Math.max(...prev[field].map((i) => i.id)) + 1
          : 1;

      return {
        ...prev,
        [field]: [...prev[field], { id: nextId, nome: "", inCura: false }],
      };
    });
  };

  const handleArrayRemove = (field, id) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i.id !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // se Auth sta ancora caricando
      if (loading) {
        alert("Attendi il caricamento della sessione...");
        setIsSubmitting(false);
        return;
      }

      // se non ho sessione/profilo → blocco
      if (!session || !profile) {
        alert("Devi eseguire il login con Discord.");
        setSubmitStatus("error");
        setIsSubmitting(false);
        return;
      }

      // pulizia arrays
      const patologieClean = form.patologie
        .filter((p) => p.nome.trim() !== "")
        .map(({ id, ...rest }) => rest);

      const dipendenzeClean = form.dipendenze
        .filter((d) => d.nome.trim() !== "")
        .map(({ id, ...rest }) => rest);

      const payload = {
        user_id: profile.id,
        nome: form.nome,
        cognome: form.cognome,
        sesso: form.sesso,
        stato_nascita: form.statoNascita,
        etnia: form.etnia,
        data_nascita: form.dataNascita || null,
        storia_breve: form.storiaBreve,
        condanne_penali: form.condannePenali,
        patologie: patologieClean,
        dipendenze: dipendenzeClean,
        segni_distintivi: form.segniDistintivi,
        aspetti_caratteriali: form.aspettiCaratteriali,
        status: "pending",
        rejection_reason: null,
      };

      const { error } = await supabase.from("characters").insert(payload);

      if (error) {
        console.error("Errore durante l'invio:", error);
        setSubmitStatus("error");
      } else {
        setSubmitStatus("ok");
        // opzionale: reset del form
        // setForm({...});
      }
    } catch (err) {
      console.error("Errore BG:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Se Auth sta ancora caricando lo stato iniziale
  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessione…
      </p>
    );
  }

  // 🔹 Quando loading è false ma non ho session/profile → non loggata
  if (!session || !profile) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Devi effettuare il login con Discord.
      </p>
    );
  }

  // 🔹 Se arrivo qui: sono loggata e ho il profilo → mostro il form
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Background del personaggio
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Compila il background. Lo staff lo valuterà e aggiornerà il passaporto
          in città.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        {/* DISCORD INFO */}
        <div className="rounded-2xl border p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-[var(--color-text-muted)]">
              Account Discord
            </p>
            <p className="text-sm font-medium">
              {profile.discord_username || profile.id}
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[var(--blue)]/15 text-[var(--blue)] border">
            Connesso
          </span>
        </div>

        {/* DATI ANAGRAFICI */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">I. Dati anagrafici</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={form.nome}
              required
              onChange={(v) => handleChange("nome", v)}
            />
            <Input
              label="Cognome"
              value={form.cognome}
              required
              onChange={(v) => handleChange("cognome", v)}
            />

            <Select
              label="Sesso"
              value={form.sesso}
              required
              onChange={(v) => handleChange("sesso", v)}
              options={[
                { label: "Maschio", value: "M" },
                { label: "Femmina", value: "F" },
                { label: "Altro", value: "Altro" },
              ]}
            />

            <Input
              label="Stato di nascita"
              value={form.statoNascita}
              onChange={(v) => handleChange("statoNascita", v)}
            />

            <Input
              label="Etnia"
              value={form.etnia}
              onChange={(v) => handleChange("etnia", v)}
            />

            <Input
              label="Data di nascita"
              type="date"
              value={form.dataNascita}
              onChange={(v) => handleChange("dataNascita", v)}
            />
          </div>
        </section>

        {/* STORIA */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">II. Storia del personaggio</h2>

          <TextArea
            label="Storia in breve"
            max={MAX_STORIA}
            value={form.storiaBreve}
            onChange={(v) => handleChange("storiaBreve", v)}
          />

          <TextArea
            label="Condanne penali (facoltativo)"
            max={MAX_CONDANNE}
            value={form.condannePenali}
            onChange={(v) => handleChange("condannePenali", v)}
          />

          {/* PATOLGIE */}
          <DynamicList
            title="Patologie"
            items={form.patologie}
            onAdd={() => handleArrayAdd("patologie")}
            onRemove={(id) => handleArrayRemove("patologie", id)}
            onChange={(id, key, value) =>
              handleArrayChange("patologie", id, key, value)
            }
          />

          {/* DIPENDENZE */}
          <DynamicList
            title="Dipendenze"
            items={form.dipendenze}
            onAdd={() => handleArrayAdd("dipendenze")}
            onRemove={(id) => handleArrayRemove("dipendenze", id)}
            onChange={(id, key, value) =>
              handleArrayChange("dipendenze", id, key, value)
            }
          />
        </section>

        {/* CARATTERISTICHE */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">III. Caratteristiche</h2>

          <TextArea
            label="Segni distintivi"
            value={form.segniDistintivi}
            onChange={(v) => handleChange("segniDistintivi", v)}
          />

          <TextArea
            label="Aspetti caratteriali"
            value={form.aspettiCaratteriali}
            onChange={(v) => handleChange("aspettiCaratteriali", v)}
          />
        </section>

        {/* SUBMIT */}
        <div className="flex gap-3 items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-full bg-[var(--violet)] text-white font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Invio in corso..." : "Invia background"}
          </button>

          {submitStatus === "ok" && (
            <p className="text-xs text-green-400">Background inviato!</p>
          )}

          {submitStatus === "error" && (
            <p className="text-xs text-red-400">
              Errore durante l’invio. Riprova.
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

/* -----------------------------------------------------
   COMPONENTI INTERNI
------------------------------------------------------*/

function Input({ label, value, onChange, required, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-xl px-3 py-2 bg-[#111326] border border-[var(--color-border)]"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-xl px-3 py-2 bg-[#111326] border border-[var(--color-border)]"
      >
        <option value="">Seleziona…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, max }) {
  return (
    <div>
      <div className="flex justify_between">
        <label className="text-xs font-medium">{label}</label>
        {max && (
          <span className="text-[10px] text-gray-400">
            {value.length}/{max}
          </span>
        )}
      </div>

      <textarea
        className="w-full mt-1 rounded-xl px-3 py-2 bg-[#111326] border border-[var(--color-border)] min-h-[100px]"
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DynamicList({ title, items, onAdd, onRemove, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-xs font-medium">{title}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] px-2 py-1 rounded-full border border-[var(--color-border)]"
        >
          + Aggiungi
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Inserisci…"
            value={item.nome}
            onChange={(e) => onChange(item.id, "nome", e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 bg-[#111326] border border-[var(--color-border)] text-sm"
          />

          <label className="text-[11px] flex items-center gap-1">
            <input
              type="checkbox"
              checked={item.inCura}
              onChange={(e) => onChange(item.id, "inCura", e.target.checked)}
            />
            in cura
          </label>

          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-[11px] px-2 py-1 rounded-full border border-[var(--color-border)]"
            >
              Rimuovi
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
