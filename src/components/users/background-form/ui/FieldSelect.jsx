import FieldLabel from "./FieldLabel";

export default function FieldSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}) {
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
