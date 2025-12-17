import { LifeBuoy, Users } from "lucide-react";

export default function FinalHelpBox() {
  return (
    <div className="mt-2 text-xs md:text-sm text-[var(--color-text-muted)] p-4 rounded-2xl border border-[var(--color-border)] bg-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative">
      <div className="flex items-start gap-2">
        <LifeBuoy className="h-4 w-4 mt-0.5 text-[var(--color-accent-cool)]" />
        <div>
          Se riscontri problemi di connessione o con la whitelist, apri un
          ticket sul <strong>Discord</strong> e specifica screenshot e orario
          del problema.
        </div>
      </div>

      <a
        href="https://discord.gg/tuo-invite"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 transition"
      >
        <Users className="h-4 w-4" />
        Apri Discord
      </a>
    </div>
  );
}
