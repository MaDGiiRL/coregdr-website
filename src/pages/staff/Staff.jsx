import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { STAFF, FILTERS } from "../../components/staff/data";
import StaffHeader from "../../components/staff/StaffHeader";
import StaffFilters from "../../components/staff/StaffFilters";
import StaffGrid from "../../components/staff/StaffGrid";

export default function Staff() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState("Tutti");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const base =
      active === "Tutti" ? STAFF : STAFF.filter((m) => m.badge === active);

    const query = q.trim().toLowerCase();
    if (!query) return base;

    return base.filter((m) => {
      return (
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        (m.badge || "").toLowerCase().includes(query)
      );
    });
  }, [active, q]);

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: reduce ? 0 : -10, transition: { duration: 0.18 } },
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-10 space-y-6">
      <StaffHeader fadeUp={fadeUp} />

      <StaffFilters
        filters={FILTERS}
        active={active}
        setActive={setActive}
        q={q}
        setQ={setQ}
      />

      <StaffGrid
        active={active}
        q={q}
        members={STAFF}
        filtered={filtered}
        fadeUp={fadeUp}
        container={container}
      />
    </section>
  );
}
