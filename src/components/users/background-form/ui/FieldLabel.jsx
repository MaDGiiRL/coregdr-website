export default function FieldLabel({ label, required, helper }) {
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
