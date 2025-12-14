// src/pages/BackgroundForm.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

// ✅ ZOD
import { z } from "zod";

export const MAX_STORIA = 5000;
export const MAX_CONDANNE = 300;

export const usePenalCode = () => {
  const [articoli, setArticoli] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // fetch articoli
        const resArticoli = await fetch("http://localhost:3001/api/procura/articoli");
        if (!resArticoli.ok) throw new Error(`HTTP ${resArticoli.status}`);
        const articoliData = await resArticoli.json();

        // fetch categorie
        const resCategorie = await fetch("http://localhost:3001/api/procura/articoli/categorie");
        if (!resCategorie.ok) throw new Error(`HTTP ${resCategorie.status}`);
        const categorieData = await resCategorie.json();

        setArticoli(articoliData);
        setCategorie(categorieData); // es. [{ id: 1, nome: "Reati contro la persona" }, ...]
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { articoli, categorie, loading };
};

export const ListItemSchema = z.object({
  id: z.number(),
  nome: z
    .string()
    .trim()
    .max(120, "Massimo 120 caratteri")
    .optional()
    .or(z.literal("")),
});

const CondannePenaliTable = ({ value = [], onChange }) => {
  const { articoli, categorie, loading } = usePenalCode();

  const filteredCategorie = categorie.filter(c => c.id <= 8);

  if (loading) return <p>Caricamento articoli…</p>;

  // 🔹 Raggruppo articoli per categoria
  const grouped = filteredCategorie.reduce((acc, cat) => {
    acc[cat.id] = {
      label: cat.nome, // nome categoria
      items: articoli.filter((a) => a.categoria === cat.id),
    };
    return acc;
  }, {});

  const toggle = (nome) => {
    onChange(
      value.includes(nome)
        ? value.filter((v) => v !== nome)
        : [...value, nome]
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([categoriaId, group]) => (
          <div key={categoriaId} className="border rounded-xl overflow-hidden">
            {/* Header categoria */}
            <div className="px-4 py-2 bg-black/20 font-semibold text-sm">
              {group.label || `Categoria ${categoriaId}`}
            </div>

            {/* Tabella categoria */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/10">
                  <th className="px-3 py-2 text-left">Articolo</th>
                  <th className="px-3 py-2 text-center">Seleziona</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2 capitalize">{a.nome}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={value.includes(a.nome)}
                        onChange={() => toggle(a.nome)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};


export const BackgroundSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Nome obbligatorio")
      .max(60, "Max 60 caratteri"),
    cognome: z
      .string()
      .trim()
      .min(1, "Cognome obbligatorio")
      .max(60, "Max 60 caratteri"),
    sesso: z.enum(["M", "F", "Altro"], {
      message: "Seleziona un sesso valido",
    }),

    statoNascita: z
      .string()
      .trim()
      .max(60, "Max 60 caratteri")
      .optional()
      .or(z.literal("")),
    etnia: z
      .string()
      .trim()
      .max(60, "Max 60 caratteri")
      .optional()
      .or(z.literal("")),
    dataNascita: z.string().trim().optional().or(z.literal("")),

    storiaBreve: z
      .string()
      .trim()
      .max(MAX_STORIA, `Massimo ${MAX_STORIA} caratteri`)
      .optional()
      .or(z.literal("")),

    condannePenali: z.array(z.string()).max(10).default([]),

    patologie: z.array(ListItemSchema).default([]),
    dipendenze: z.array(ListItemSchema).default([]),

    segniDistintivi: z
      .string()
      .trim()
      .max(500, "Max 500 caratteri")
      .optional()
      .or(z.literal("")),
    aspettiCaratteriali: z
      .string()
      .trim()
      .max(1000, "Max 1000 caratteri")
      .optional()
      .or(z.literal("")),
  })
  // pulizia array: tengo solo item con nome valorizzato
  .transform((v) => ({
    ...v,
    patologie: (v.patologie ?? []).filter((p) => (p.nome ?? "").trim() !== ""),
    dipendenze: (v.dipendenze ?? []).filter(
      (d) => (d.nome ?? "").trim() !== ""
    ),
  }))
  // valida data YYYY-MM-DD se presente
  .superRefine((v, ctx) => {
    if (v.dataNascita && v.dataNascita.trim() !== "") {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(v.dataNascita);
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataNascita"],
          message: "Formato data non valido (usa YYYY-MM-DD)",
        });
      }
    }
  });

// campi che consideriamo "importanti" (per alert “invia comunque”)
const REQUIRED_FIELDS = [
  { key: "nome", label: "Nome" },
  { key: "cognome", label: "Cognome" },
  { key: "sesso", label: "Sesso" },
];

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
    condannePenali: [],
    patologie: [{ id: 1, nome: "" }],
    dipendenze: [{ id: 1, nome: "" }],
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
        [field]: [...prev[field], { id: nextId, nome: "" }],
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
    setSubmitStatus(null);

    if (loading) {
      await Swal.fire({
        icon: "info",
        title: "Attendi un attimo",
        text: "La sessione utente è ancora in caricamento...",
      });
      return;
    }

    if (!session || !profile) {
      setSubmitStatus("error");
      await Swal.fire({
        icon: "warning",
        title: "Non sei loggato",
        text: "Devi effettuare il login con Discord prima di inviare il background.",
      });
      return;
    }

    // ✅ ZOD VALIDATION
    const parsed = BackgroundSchema.safeParse(form);

    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((i) => `• ${i.message}`)
        .join("<br/>");

      setSubmitStatus("error");
      await Swal.fire({
        icon: "error",
        title: "Dati non validi",
        html: errors,
      });
      return;
    }

    // (rimane il tuo alert “invia comunque” sui campi importanti)
    const missing = REQUIRED_FIELDS.filter((f) => {
      const value = parsed.data[f.key];
      return !value || (typeof value === "string" && value.trim() === "");
    }).map((f) => f.label);

    if (missing.length > 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Alcuni campi non sono compilati",
        html: `
          <p>Non hai compilato i seguenti campi:</p>
          <ul style="text-align:left; margin-top: 8px;">
            ${missing.map((m) => `<li>${m}</li>`).join("")}
          </ul>
          <p style="margin-top:12px;">Vuoi inviare il background lo stesso?</p>
        `,
        showCancelButton: true,
        confirmButtonText: "Sì, invia comunque",
        cancelButtonText: "No, torna al form",
        focusCancel: true,
      });

      if (!result.isConfirmed) return;
    }

    setIsSubmitting(true);

    try {
      const v = parsed.data; // ✅ già “pulito” da transform()

      const payload = {
        user_id: profile.id,
        nome: v.nome,
        cognome: v.cognome,
        sesso: v.sesso,
        stato_nascita: v.statoNascita || null,
        etnia: v.etnia || null,
        data_nascita: v.dataNascita || null,
        storia_breve: v.storiaBreve || null,
        condanne_penali: v.condannePenali || null,
        patologie: v.patologie,
        dipendenze: v.dipendenze,
        segni_distintivi: v.segniDistintivi || null,
        aspetti_caratteriali: v.aspettiCaratteriali || null,
        status: "pending",
        rejection_reason: null,
      };

      const { error } = await supabase.from("characters").insert(payload);

      if (error) {
        console.error("Errore durante l'invio:", error);
        setSubmitStatus("error");
        await Swal.fire({
          icon: "error",
          title: "Errore durante l'invio",
          html: `
            <p>Si è verificato un errore durante il salvataggio del background.</p>
            <p style="margin-top:8px; font-size:12px; opacity:0.8;">
              Messaggio: <code>${error.message}</code><br/>
              Codice: <code>${error.code || "n/a"}</code>
            </p>
          `,
        });
        return;
      }

      setSubmitStatus("ok");
      await Swal.fire({
        icon: "success",
        title: "Background inviato!",
        text: "Il tuo background è stato inviato allo staff per la revisione.",
      });
    } catch (err) {
      console.error("Errore BG:", err);
      setSubmitStatus("error");
      await Swal.fire({
        icon: "error",
        title: "Errore imprevisto",
        text: "Si è verificato un errore imprevisto. Riprova più tardi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Caricamento sessione…
      </p>
    );
  }

  if (!session || !profile) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Devi effettuare il login con Discord.
      </p>
    );
  }

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

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">I. Dati anagrafici</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={form.nome}
              onChange={(v) => handleChange("nome", v)}
            />
            <Input
              label="Cognome"
              value={form.cognome}
              onChange={(v) => handleChange("cognome", v)}
            />

            <Select
              label="Sesso"
              value={form.sesso}
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

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">II. Storia del personaggio</h2>

          <TextArea
            label="Storia in breve"
            max={MAX_STORIA}
            value={form.storiaBreve}
            onChange={(v) => handleChange("storiaBreve", v)}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium">
              Condanne penali (seleziona articoli)
            </label>

            <CondannePenaliTable
              value={form.condannePenali}
              onChange={(v) => handleChange("condannePenali", v)}
            />
          </div>

          <DynamicList
            title="Patologie (In cura)"
            items={form.patologie}
            onAdd={() => handleArrayAdd("patologie")}
            onRemove={(id) => handleArrayRemove("patologie", id)}
            onChange={(id, key, value) =>
              handleArrayChange("patologie", id, key, value)
            }
          />

          <DynamicList
            title="Dipendenze (Attuali)"
            items={form.dipendenze}
            onAdd={() => handleArrayAdd("dipendenze")}
            onRemove={(id) => handleArrayRemove("dipendenze", id)}
            onChange={(id, key, value) =>
              handleArrayChange("dipendenze", id, key, value)
            }
          />
        </section>

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

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-xl px-3 py-2 bg-[#111326] border border-[var(--color-border)]"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <select
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
      <div className="flex justify-between">
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
