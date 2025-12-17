import { motion } from "framer-motion";

export default function AdminDashboardHeader({
  shellCard,
  reduce,
  isAdmin,
  staffRole,
  profile,
  Badge,
  roleVariant,
  icons,
  onRefresh,
  onGotoBackgrounds,
}) {
  const { Shield, Crown, BadgeCheck, RefreshCw, FileText } = icons;

  return (
    <header className={`${shellCard} p-5 md:p-6`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl border border-[var(--color-border)] bg-black/20 grid place-items-center">
              <Shield className="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold truncate">
                {isAdmin ? "Admin Dashboard" : "Area Whitelister"}
              </h1>
              <p className="text-xs md:text-sm text-[var(--color-text-muted)] truncate">
                {isAdmin
                  ? "Controllo completo su utenti, background e log."
                  : "Moderazione background (commenti + job sempre)."}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant={roleVariant(staffRole)}
              icon={staffRole === "Admin" ? Crown : BadgeCheck}
            >
              {staffRole}
            </Badge>

            <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-black/20 text-[var(--color-text-muted)]">
              Staff ID:{" "}
              <span className="font-mono">
                {profile.discord_id ?? profile.id}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-start lg:justify-end flex-nowrap overflow-x-auto">
          {isAdmin && (
            <motion.button
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.97 }}
              onClick={onRefresh}
              className="shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl border border-[var(--color-border)] bg-black/20 hover:bg-white/5 text-xs md:text-sm font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna dati
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: reduce ? 1 : 0.97 }}
            onClick={onGotoBackgrounds}
            className="shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl bg-[var(--violet)] text-white text-xs md:text-sm font-semibold shadow-md hover:brightness-110 inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Vai ai background
          </motion.button>
        </div>
      </div>
    </header>
  );
}
