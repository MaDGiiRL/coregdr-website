import FieldLabel from "./FieldLabel";

export default function FieldInput({
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
