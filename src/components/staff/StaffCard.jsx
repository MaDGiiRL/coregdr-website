import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function StaffCard({ member, fadeUp }) {
  const Icon = member.icon || Shield;

  return (
    <motion.article
      variants={fadeUp}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/5 border border-[var(--color-border)] grid place-items-center">
            <Icon className="w-5 h-5 text-[var(--color-accent-cool)]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{member.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {member.role}
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
          {member.badge}
        </span>
      </div>

      <p className="mt-3 text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
        {member.description}
      </p>
    </motion.article>
  );
}
