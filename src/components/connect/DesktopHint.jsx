import { ArrowLeftRight } from "lucide-react";

export default function DesktopHint() {
  return (
    <p className="mt-2 text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
      <ArrowLeftRight className="h-4 w-4" />
      Trascina il carosello con il mouse (o trackpad) per scorrere.
    </p>
  );
}
