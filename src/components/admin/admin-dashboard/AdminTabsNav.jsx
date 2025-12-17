import { motion } from "framer-motion";

export default function AdminTabsNav({
  shellCard,
  reduce,
  visibleTabs,
  activeTab,
  onTabClick,
  tabCount,
}) {
  return (
    <nav className={`${shellCard} p-2`}>
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = tabCount(tab.id);

          return (
            <motion.button
              key={tab.id}
              type="button"
              whileTap={{ scale: reduce ? 1 : 0.985 }}
              onClick={() => onTabClick(tab.id)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-2xl border transition inline-flex items-center gap-2 text-xs md:text-sm ${
                isActive
                  ? "bg-white/5 border-[var(--violet-soft)] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.25)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-semibold">{tab.label}</span>

              {typeof count === "number" && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] ${
                    tab.id === "backgrounds"
                      ? "border-yellow-400/40 text-yellow-300 bg-yellow-400/10"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] bg-black/20"
                  }`}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
