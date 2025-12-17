// pages/users/BackgroundForm.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { z } from "zod";

import BackgroundFormHeader from "../../components/users/background-form/BackgroundFormHeader";
import DiscordAccountCard from "../../components/users/background-form/DiscordAccountCard";
import StickySubmitBar from "../../components/users/background-form/StickySubmitBar";

import Card from "../../components/users/background-form/ui/Card";
import FieldInput from "../../components/users/background-form/ui/FieldInput";
import FieldSelect from "../../components/users/background-form/ui/FieldSelect";
import FieldTextArea from "../../components/users/background-form/ui/FieldTextArea";
import DynamicListPro from "../../components/users/background-form/ui/DynamicListPro";
import CondannePenaliSwitcher from "../../components/users/background-form/CondannePenaliSwitcher";
import SessionGate from "../../components/users/background-form/SessionGate";

export const MAX_STORIA = 5000;
export const MAX_CONDANNE = 10;

/* ---------------------------------------------
   ✅ LOG HELPER
---------------------------------------------- */
const safeMeta = (obj) => {
  try {
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
};

const writeLog = async (type, message, meta = {}) => {
  try {
    await supabase.from("logs").insert({
      type,
      message,
      meta: safeMeta(meta),
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.debug("[LOG]", e?.message || e);
  }
};

/* ---------------------------------------------
   ✅ HOOK PROCURA (con error handling + env base)
---------------------------------------------- */
export const usePenalCode = () => {
  const [articoli, setArticoli] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const API_URL = import.meta.env.VITE_API_URL || "";

        const [resArticoli, resCategorie] = await Promise.all([
          fetch(`${API_URL}/api/procura/articoli`, { signal: ctrl.signal }),
          fetch(`${API_URL}/api/procura/articoli/categorie`, {
            signal: ctrl.signal,
          }),
        ]);

        if (!resArticoli.ok)
          throw new Error(`Articoli HTTP ${resArticoli.status}`);
        if (!resCategorie.ok)
          throw new Error(`Categorie HTTP ${resCategorie.status}`);

        const articoliData = await resArticoli.json();
        const categorieData = await resCategorie.json();

        setArticoli(Array.isArray(articoliData) ? articoliData : []);
        setCategorie(Array.isArray(categorieData) ? categorieData : []);
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Fetch error:", err);
        setArticoli([]);
        setCategorie([]);
        setErrorMsg(
          "Servizio Procura non disponibile (errore server). Riprova più tardi."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => ctrl.abort();
  }, []);

  return { articoli, categorie, loading, errorMsg };
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

// ✅ factory: oggetto sempre NUOVO (reset reale)
const getInitialForm = () => ({
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

/* -----------------------------------------------------
   PAGINA
------------------------------------------------------*/
export default function BackgroundForm() {
  const { profile, session, loading } = useAuth();

  const [form, setForm] = useState(getInitialForm); // ✅ init via factory
  const [formResetKey, setFormResetKey] = useState(0); // ✅ reset switcher interno

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

  // ✅ LOG: apertura pagina form
  useEffect(() => {
    if (profile) {
      writeLog("BG_FORM_OPEN", "Apertura form background", {
        user_id: profile.id,
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    // ✅ LOG: tentativo submit
    if (profile?.id) {
      await writeLog("BG_SUBMIT_ATTEMPT", "Tentativo invio background", {
        user_id: profile.id,
      });
    }

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

      // ✅ LOG: submit senza sessione
      await writeLog("BG_SUBMIT_NO_SESSION", "Invio BG senza sessione", {});

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

      // ✅ LOG: invalid
      await writeLog("BG_SUBMIT_INVALID", "Invio background con errori", {
        user_id: profile.id,
        errors: parsed.error.issues.map((i) => ({
          path: i.path?.join("."),
          message: i.message,
        })),
      });

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

      if (!result.isConfirmed) {
        // ✅ LOG: annullato dopo warning
        await writeLog("BG_SUBMIT_CANCEL", "Invio annullato dall'utente", {
          user_id: profile.id,
          missing,
        });
        return;
      }

      // ✅ LOG: confermato nonostante missing
      await writeLog("BG_SUBMIT_FORCE", "Invio confermato con campi mancanti", {
        user_id: profile.id,
        missing,
      });
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

        // ✅ LOG: errore insert
        await writeLog("BG_SUBMIT_ERROR", "Errore invio background", {
          user_id: profile.id,
          error: error.message,
          code: error.code || "n/a",
        });

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

      // ✅ LOG: success
      await writeLog("BG_SUBMIT_SUCCESS", "Background inviato", {
        user_id: profile.id,
        nome: `${payload.nome} ${payload.cognome}`,
        status: "pending",
        condanne_count: (payload.condanne_penali || []).length,
      });

      await Swal.fire({
        icon: "success",
        title: "Background inviato!",
        text: "Il tuo background è stato inviato allo staff per la revisione.",
        background: "#0b0d1b",
        color: "#e5e7eb",
        confirmButtonColor: "#22c55e",
      });

      // ✅ RESET TOTALE (campi + componenti con state interno)
      setForm(getInitialForm());
      setFormResetKey((k) => k + 1);
    } catch (err) {
      console.error("Errore BG:", err);
      setSubmitStatus("error");

      // ✅ LOG: catch generico
      await writeLog("BG_SUBMIT_ERROR", "Errore imprevisto invio background", {
        user_id: profile?.id,
        error: err?.message || String(err),
      });

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

  return (
    <SessionGate loading={loading} session={session} profile={profile}>
      <section className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <BackgroundFormHeader />

        <DiscordAccountCard profile={profile} />

        <form onSubmit={handleSubmit} className="space-y-8">
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
              key={formResetKey} // ✅ reset idx/query interni
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

          <StickySubmitBar
            submitStatus={submitStatus}
            isSubmitting={isSubmitting}
          />
        </form>
      </section>
    </SessionGate>
  );
}
