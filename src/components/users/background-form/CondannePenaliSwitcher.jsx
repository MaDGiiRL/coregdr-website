import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  usePenalCode,
  MAX_CONDANNE,
} from "../../../pages/users/BackgroundForm";

export default function CondannePenaliSwitcher({ value = [], onChange }) {
  const { articoli, categorie, loading, errorMsg } = usePenalCode();

  const filteredCategorie = useMemo(
    () => (categorie || []).filter((c) => Number(c.id) <= 7),
    [categorie]
  );

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

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/5 p-4">
        <p className="text-sm text-rose-300 font-semibold">⚠️ {errorMsg}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Puoi comunque compilare il resto del background.
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
