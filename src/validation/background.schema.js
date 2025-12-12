import { z } from "zod";

export const MAX_STORIA = 5000;
export const MAX_CONDANNE = 300;

export const ListItemSchema = z.object({
    id: z.number(),
    nome: z
        .string()
        .trim()
        .max(120, "Massimo 120 caratteri")
        .optional()
        .or(z.literal("")),
    inCura: z.boolean(),
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
        sesso: z.enum(["M", "F", "Altro"], { message: "Seleziona un sesso valido" }),

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
        condannePenali: z
            .string()
            .trim()
            .max(MAX_CONDANNE, `Massimo ${MAX_CONDANNE} caratteri`)
            .optional()
            .or(z.literal("")),

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
        dipendenze: (v.dipendenze ?? []).filter((d) => (d.nome ?? "").trim() !== ""),
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
