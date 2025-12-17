import {
  Info,
  ArrowRight,
  Sparkles,
  TerminalSquare,
  PlugZap,
} from "lucide-react";
import { stepIcon } from "./stepIcon";

export default function StepCard({ step }) {
  const Icon = stepIcon(step.id);

  return (
    <article
      className="
        h-[380px] md:h-[400px] lg:h-[420px]
        rounded-3xl border border-[var(--color-border)]
        bg-[var(--color-surface)]/90
        px-6 py-6 md:px-7 md:py-7
        flex flex-col
        transition-colors duration-300
        hover:border-[var(--color-accent-cool)]
        hover:bg-[rgba(31,33,64,0.98)]
        hover:shadow-[0_0_10px_rgba(53,210,255,0.35)]
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="
              h-10 w-10 md:h-11 md:w-11
              rounded-full flex items-center justify-center shrink-0
              bg-[radial-gradient(circle_at_top,var(--violet-light),var(--violet))]
              text-white shadow-[0_0_18px_rgba(111,47,217,0.6)]
            "
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 mt-4">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              <Sparkles className="h-3.5 w-3.5 opacity-80" />
              Step {step.id}
            </p>
          </div>
        </div>

        <a
          href={step.buttonHref}
          target={step.buttonHref.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="
            hidden sm:inline-flex items-center gap-2
            px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold
            bg-[linear-gradient(135deg,var(--violet),var(--blue))]
            text-white shadow-md hover:brightness-110 active:scale-95
            whitespace-nowrap
          "
        >
          <ArrowRight className="h-4 w-4" />
          {step.buttonLabel}
        </a>
      </div>

      <h2 className="mt-4 pl-1 text-base md:text-lg font-semibold leading-snug flex items-start gap-2">
        <Info className="h-5 w-5 mt-[2px] text-[var(--color-text-muted)]" />
        <span className="min-w-0">{step.title}</span>
      </h2>

      <div className="mt-5 h-px w-full bg-white/10" />

      <div className="mt-5 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1 space-y-4">
          <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
            {step.description}
          </p>

          {step.code && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                <TerminalSquare className="h-4 w-4" />
                Comando console
              </p>
              <pre className="p-3 rounded-2xl bg-black/40 text-[11px] md:text-xs text-[var(--color-accent-cool)] overflow-x-auto border border-white/10">
                {step.code}
              </pre>
              <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                <PlugZap className="h-4 w-4 opacity-80" />
                Suggerimento: apri FiveM → premi{" "}
                <span className="font-semibold">F8</span> → incolla → invio.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-5">
        <a
          href={step.buttonHref}
          target={step.buttonHref.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="
            sm:hidden inline-flex items-center gap-2
            px-5 py-2.5 rounded-full text-sm font-semibold
            bg-[linear-gradient(135deg,var(--violet),var(--blue))]
            text-white shadow-md hover:brightness-110 active:scale-95
          "
        >
          <ArrowRight className="h-4 w-4" />
          {step.buttonLabel}
        </a>
      </div>
    </article>
  );
}
