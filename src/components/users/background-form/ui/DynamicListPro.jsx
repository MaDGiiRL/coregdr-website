import { Plus, Trash2 } from "lucide-react";

export default function DynamicListPro({
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
