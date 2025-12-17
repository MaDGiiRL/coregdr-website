import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MessageCircle, Globe, Instagram, Music2, Youtube } from "lucide-react";

const socialLinks = [
  {
    id: "discord",
    name: "Discord",
    href: "https://discord.gg/tuo-invite",
    Icon: MessageCircle,
  },
  { id: "website", name: "Sito", href: "https://tuo-sito.it", Icon: Globe },
  {
    id: "instagram",
    name: "Instagram",
    href: "https://instagram.com/tuo-profilo",
    Icon: Instagram,
  },
  {
    id: "tiktok",
    name: "TikTok",
    href: "https://www.tiktok.com/@tuo-profilo",
    Icon: Music2,
  },
  {
    id: "youtube",
    name: "YouTube",
    href: "https://youtube.com/@tuo-canale",
    Icon: Youtube,
  },
];

export default function SocialContacts() {
  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            contatti
          </p>
          <h3 className="text-lg md:text-xl font-semibold">
            Seguici e contattaci
          </h3>
        </div>

        <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-xl">
          Per supporto veloce usa Discord. Per novità e contenuti, seguici sui
          social.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {socialLinks.map(({ id, name, href, Icon }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="
              group relative overflow-hidden
              rounded-2xl border border-[var(--color-border)]
              bg-white/5
              px-4 py-3
              transition-colors duration-300
              hover:border-[rgba(53,210,255,0.45)]
              hover:bg-white/[0.07]
            "
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(120deg, rgba(111,47,217,0.0), rgba(53,210,255,0.35), rgba(111,47,217,0.0))",
                filter: "blur(10px)",
              }}
              animate={{ x: ["-30%", "30%", "-30%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex items-center gap-3">
              <div
                className="
                  h-10 w-10 rounded-xl
                  border border-white/10
                  bg-[linear-gradient(135deg,rgba(111,47,217,0.22),rgba(53,210,255,0.18))]
                  flex items-center justify-center
                  text-white
                "
              >
                <Icon className="h-5 w-5 text-[var(--color-accent-cool)]" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {name}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                  Apri link esterno
                </p>
              </div>

              <ArrowRight className="ml-auto h-4 w-4 text-[var(--color-text-muted)] group-hover:text-white/80 transition-colors" />
            </div>

            <div className="relative z-10 mt-3 h-px w-full bg-white/10">
              <div className="h-px w-0 bg-[var(--color-accent-cool)]/60 group-hover:w-full transition-all duration-500" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
