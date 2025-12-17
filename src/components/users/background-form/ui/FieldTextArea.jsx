export default function FieldTextArea({
  label,
  value,
  onChange,
  max,
  placeholder,
}) {
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
