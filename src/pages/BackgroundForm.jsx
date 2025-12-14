// src/pages/BackgroundForm.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

export const MAX_STORIA = 5000;
export const MAX_CONDANNE = 10;

export const usePenalCode = () => {
  const [articoli, setArticoli] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resArticoli = await fetch(
          "http://localhost:3001/api/procura/articoli"
        );
        if (!resArticoli.ok) throw new Error(`HTTP ${resArticoli.status}`);
        const articoliData = await resArticoli.json();

        const resCategorie = await fetch(
          "http://localhost:3001/api/procura/articoli/categorie"
        );
        if (!resCategorie.ok) throw new Error(`HTTP ${resCategorie.status}`);
        const categorieData = await resCategorie.json();

        setArticoli(Array.isArray(articoliData) ? articoliData : []);
        setCategorie(Array.isArray(categorieData) ? categorieData : []);
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

    condannePenali: z.array(z.string()).max(MAX_CONDANNE).default([]),

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
  .transform((v) => ({
    ...v,
    patologie: (v.patologie ?? []).filter((p) => (p.nome ?? "").trim() !== ""),
    dipendenze: (v.dipendenze ?? []).filter(
      (d) => (d.nome ?? "").trim() !== ""
    ),
  }))
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

const REQUIRED_FIELDS = [
  { key: "nome", label: "Nome" },
  { key: "cognome", label: "Cognome" },
  { key: "sesso", label: "Sesso" },
];

/* -----------------------------------------------------
   CONDANNE PENALI: UN SOLO BOX CON NAVIGAZIONE
------------------------------------------------------*/

function CondannePenaliSwitcher({ value = [], onChange }) {
  const { articoli, categorie, loading } = usePenalCode();

  // tieni solo le prime 8 categorie
  const filteredCategorie = useMemo(
    () => (categorie || []).filter((c) => Number(c.id) <= 8),
    [categorie]
  );

  // raggruppo articoli per categoria id
  const grouped = useMemo(() => {
    const out = {};
    for (const cat of filteredCategorie) {
      out[cat.id] = {
        id: cat.id,
        label: cat.nome || `Categoria ${cat.id}`,
        items: (articoli || []).filter((a) => a.categoria === cat.id),
      };
    }
    return out;
  }, [filteredCategorie, articoli]);

  const groupsArr = useMemo(() => {
    return Object.values(grouped).sort((a, b) => Number(a.id) - Number(b.id));
  }, [grouped]);

  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // se cambiano le categorie e l'indice va fuori
    if (idx > groupsArr.length - 1) setIdx(0);
  }, [groupsArr.length, idx]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Caricamento articoli…
        </p>
      </div>
    );
  }

  if (!groupsArr.length) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Nessuna categoria disponibile.
        </p>
      </div>
    );
  }

  const current = groupsArr[idx];
  const selectedCount = value.length;

  const canAddMore = selectedCount < MAX_CONDANNE;

  const toggle = (nome) => {
    if (!nome) return;

    const exists = value.includes(nome);
    if (exists) {
      onChange(value.filter((v) => v !== nome));
      return;
    }

    if (!canAddMore) return;
    onChange([...value, nome]);
  };

  const filteredItems = (current.items || []).filter((a) => {
    const n = (a?.nome || "").toLowerCase();
    return n.includes(query.trim().toLowerCase());
  });

  const goPrev = () =>
    setIdx((p) => (p - 1 + groupsArr.length) % groupsArr.length);
  const goNext = () => setIdx((p) => (p + 1) % groupsArr.length);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/70 shadow-[0_14px_50px_rgba(0,0,0,0.35)] overflow-hidden">
      {/* header */}
      <div className="p-4 border-b border-[var(--color-border)]/70 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Condanne penali
            </p>
            <h3 className="text-base font-semibold">{current.label}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="h-10 w-10 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-white/10 transition grid place-items-center"
              aria-label="Categoria precedente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-10 w-10 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-white/10 transition grid place-items-center"
              aria-label="Categoria successiva"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* tabs indicator */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {groupsArr.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setIdx(i)}
                className={[
                  "px-3 py-1.5 rounded-full border text-xs transition",
                  i === idx
                    ? "bg-[var(--blue)]/15 text-[var(--blue)] border-[var(--blue)]/40"
                    : "bg-white/5 border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/10",
                ].join(" ")}
                aria-current={i === idx ? "page" : "false"}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="text-xs text-[var(--color-text-muted)]">
            Selezionate:{" "}
            <span
              className={
                selectedCount >= MAX_CONDANNE
                  ? "text-amber-300 font-semibold"
                  : "text-[var(--color-text)] font-semibold"
              }
            >
              {selectedCount}/{MAX_CONDANNE}
            </span>
          </div>
        </div>

        {/* search */}
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca articolo…"
            className="w-full rounded-xl px-3 py-2 bg-white/5 border border-[var(--color-border)] outline-none focus:border-[var(--blue)] text-sm"
          />
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="shrink-0 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Svuota
            </button>
          )}
        </div>

        {!canAddMore && (
          <div className="text-xs text-amber-300">
            Hai raggiunto il limite di {MAX_CONDANNE} articoli selezionati.
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-3 md:p-4">
        <div className="max-h-[320px] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-black/20">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f1224]">
              <tr className="border-b border-[var(--color-border)]/70">
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Articolo
                </th>
                <th className="px-3 py-2 text-right text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Seleziona
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? (
                filteredItems.map((a) => {
                  const checked = value.includes(a.nome);
                  const disabled = !checked && !canAddMore;

                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[var(--color-border)]/40 hover:bg-white/5 transition"
                    >
                      <td className="px-3 py-2">
                        <span className="capitalize">{a.nome}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggle(a.nome)}
                            className="h-4 w-4 accent-[var(--blue)]"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-3 py-6 text-sm text-[var(--color-text-muted)]"
                    colSpan={2}
                  >
                    Nessun articolo trovato per questa categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
          Tip: seleziona solo ciò che è rilevante. Puoi cambiare categoria con
          le frecce.
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   PAGINA
------------------------------------------------------*/

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
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));

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
      return { ...prev, [field]: [...prev[field], { id: nextId, nome: "" }] };
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
        background: "#0b0d1b",
        color: "#e5e7eb",
      });
      return;
    }

    if (!session || !profile) {
      setSubmitStatus("error");
      await Swal.fire({
        icon: "warning",
        title: "Non sei loggato",
        text: "Devi effettuare il login con Discord prima di inviare il background.",
        background: "#0b0d1b",
        color: "#e5e7eb",
      });
      return;
    }

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
        background: "#0b0d1b",
        color: "#e5e7eb",
      });
      return;
    }

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
        background: "#0b0d1b",
        color: "#e5e7eb",
      });

      if (!result.isConfirmed) return;
    }

    setIsSubmitting(true);

    try {
      const v = parsed.data;

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
          background: "#0b0d1b",
          color: "#e5e7eb",
        });
        return;
      }

      setSubmitStatus("ok");
      await Swal.fire({
        icon: "success",
        title: "Background inviato!",
        text: "Il tuo background è stato inviato allo staff per la revisione.",
        background: "#0b0d1b",
        color: "#e5e7eb",
        confirmButtonColor: "#22c55e",
      });
    } catch (err) {
      console.error("Errore BG:", err);
      setSubmitStatus("error");
      await Swal.fire({
        icon: "error",
        title: "Errore imprevisto",
        text: "Si è verificato un errore imprevisto. Riprova più tardi.",
        background: "#0b0d1b",
        color: "#e5e7eb",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Caricamento sessione…
          </p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Devi effettuare il login con Discord.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          Character creation
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold">
          Background del personaggio
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Compila il background in modo chiaro. Lo staff lo valuterà e
          aggiornerà il passaporto in città.
        </p>
      </header>

      {/* account card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/60 shadow-[0_14px_50px_rgba(0,0,0,0.35)] p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Account Discord
          </p>
          <p className="text-sm font-medium truncate">
            {profile.discord_username || profile.id}
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded-full bg-[var(--blue)]/15 text-[var(--blue)] border border-[var(--blue)]/30">
          Connesso
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1 */}
        <Card
          title="I. Dati anagrafici"
          subtitle="Informazioni base del personaggio."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <FieldInput
              label="Nome"
              required
              value={form.nome}
              onChange={(v) => handleChange("nome", v)}
              placeholder="Es. Marco"
            />
            <FieldInput
              label="Cognome"
              required
              value={form.cognome}
              onChange={(v) => handleChange("cognome", v)}
              placeholder="Es. Rossi"
            />

            <FieldSelect
              label="Sesso"
              required
              value={form.sesso}
              onChange={(v) => handleChange("sesso", v)}
              options={[
                { label: "Maschio", value: "M" },
                { label: "Femmina", value: "F" },
                { label: "Altro", value: "Altro" },
              ]}
            />

            <FieldInput
              label="Stato di nascita"
              value={form.statoNascita}
              onChange={(v) => handleChange("statoNascita", v)}
              placeholder="Es. Italia"
              helper="Opzionale"
            />

            <FieldInput
              label="Etnia"
              value={form.etnia}
              onChange={(v) => handleChange("etnia", v)}
              placeholder="Opzionale"
              helper="Opzionale"
            />

            <FieldInput
              label="Data di nascita"
              type="date"
              value={form.dataNascita}
              onChange={(v) => handleChange("dataNascita", v)}
              helper="Formato YYYY-MM-DD"
            />
          </div>
        </Card>

        {/* SECTION 2 */}
        <Card
          title="II. Storia del personaggio"
          subtitle="Racconta chi è, da dove viene e perché è qui."
        >
          <FieldTextArea
            label="Storia in breve"
            value={form.storiaBreve}
            onChange={(v) => handleChange("storiaBreve", v)}
            max={MAX_STORIA}
            placeholder="Scrivi una storia coerente e leggibile…"
          />

          <CondannePenaliSwitcher
            value={form.condannePenali}
            onChange={(v) => handleChange("condannePenali", v)}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <DynamicListPro
              title="Patologie (in cura)"
              subtitle="Inserisci solo patologie attuali e rilevanti."
              items={form.patologie}
              onAdd={() => handleArrayAdd("patologie")}
              onRemove={(id) => handleArrayRemove("patologie", id)}
              onChange={(id, key, value) =>
                handleArrayChange("patologie", id, key, value)
              }
              placeholder="Es. Ipertensione"
            />

            <DynamicListPro
              title="Dipendenze (attuali)"
              subtitle="Se presenti, indica solo quelle attive."
              items={form.dipendenze}
              onAdd={() => handleArrayAdd("dipendenze")}
              onRemove={(id) => handleArrayRemove("dipendenze", id)}
              onChange={(id, key, value) =>
                handleArrayChange("dipendenze", id, key, value)
              }
              placeholder="Es. Alcol"
            />
          </div>
        </Card>

        {/* SECTION 3 */}
        <Card
          title="III. Caratteristiche"
          subtitle="Dettagli utili per roleplay e riconoscibilità."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <FieldTextArea
              label="Segni distintivi"
              value={form.segniDistintivi}
              onChange={(v) => handleChange("segniDistintivi", v)}
              placeholder="Es. tatuaggio sul collo, cicatrice sopracciglio…"
              max={500}
            />
            <FieldTextArea
              label="Aspetti caratteriali"
              value={form.aspettiCaratteriali}
              onChange={(v) => handleChange("aspettiCaratteriali", v)}
              placeholder="Es. impulsivo, leale, paranoico…"
              max={1000}
            />
          </div>
        </Card>

        {/* sticky submit bar */}
        <div className="sticky bottom-3 z-10">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/85 backdrop-blur px-4 py-3 shadow-[0_16px_70px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-[var(--color-text-muted)]">
              {submitStatus === "ok" ? (
                <span className="text-green-400 font-semibold">
                  ✅ Inviato correttamente
                </span>
              ) : submitStatus === "error" ? (
                <span className="text-rose-400 font-semibold">
                  ❌ Errore durante l’invio
                </span>
              ) : (
                <span>Controlla i dati prima di inviare.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[var(--violet)] text-white font-semibold disabled:opacity-50 hover:brightness-110 transition"
            >
              {isSubmitting ? "Invio in corso..." : "Invia background"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

/* -----------------------------------------------------
   UI COMPONENTS (puliti / coerenti)
------------------------------------------------------*/

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[#0f1224]/60 shadow-[0_14px_50px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]/70">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ label, required, helper }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label className="text-xs font-semibold">
        {label} {required ? <span className="text-rose-400">*</span> : null}
      </label>
      {helper ? (
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {helper}
        </span>
      ) : null}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  helper,
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} required={required} helper={helper} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 bg-white/5 border border-[var(--color-border)] outline-none focus:border-[var(--blue)] transition text-sm"
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, required = false }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 bg-white/5 border border-[var(--color-border)] outline-none focus:border-[var(--blue)] transition text-sm"
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

function FieldTextArea({ label, value, onChange, max, placeholder }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-semibold">{label}</label>
        {typeof max === "number" ? (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {value.length}/{max}
          </span>
        ) : null}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 bg-white/5 border border-[var(--color-border)] outline-none focus:border-[var(--blue)] transition text-sm min-h-[120px] resize-y"
      />
    </div>
  );
}

function DynamicListPro({
  title,
  subtitle,
  items,
  onAdd,
  onRemove,
  onChange,
  placeholder = "Inserisci…",
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 p-3 md:p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle ? (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-white/10 transition text-sm"
        >
          <Plus className="h-4 w-4" />
          Aggiungi
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={placeholder}
              value={item.nome}
              onChange={(e) => onChange(item.id, "nome", e.target.value)}
              className="flex-1 rounded-xl px-3 py-2.5 bg-white/5 border border-[var(--color-border)] outline-none focus:border-[var(--blue)] transition text-sm"
            />

            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="h-11 w-11 rounded-xl border border-[var(--color-border)] bg-white/5 hover:bg-rose-500/10 hover:border-rose-400/40 transition grid place-items-center"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-4 w-4 text-rose-300" />
              </button>
            ) : (
              <div className="h-11 w-11" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
