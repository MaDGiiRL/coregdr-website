import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { RULES_DATA } from "../../components/rules/data";
import { buildRulesMotion } from "../../components/rules/motion";

import RulesHeader from "../../components/rules/RulesHeader";
import RulesTopNav from "../../components/rules/RulesTopNav";
import RulesSidebar from "../../components/rules/RulesSidebar";
import RulesContent from "../../components/rules/RulesContent";

export default function Rules() {
  const DATA = RULES_DATA;

  const types = Object.keys(DATA);
  const [activeType, setActiveType] = useState(types[0]);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(DATA[types[0]])[0]
  );

  const categories = useMemo(() => Object.keys(DATA[activeType]), [activeType]);
  const derivedCategory = categories.includes(activeCategory)
    ? activeCategory
    : categories[0];

  const rules = DATA[activeType][derivedCategory] ?? [];

  const reduce = useReducedMotion();
  const variants = buildRulesMotion(reduce);

  return (
    <section className="max-w-6xl mx-auto pt-6 pb-10 space-y-6">
      <RulesHeader variants={variants} />

      <RulesTopNav
        types={types}
        activeType={activeType}
        variants={variants}
        reduce={reduce}
        onPickType={(t) => {
          setActiveType(t);
          setActiveCategory(Object.keys(DATA[t])[0]);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <RulesSidebar
          activeType={activeType}
          categories={categories}
          derivedCategory={derivedCategory}
          variants={variants}
          onPickCategory={(cat) => setActiveCategory(cat)}
          getCount={(cat) => DATA[activeType][cat].length}
        />

        <RulesContent
          activeType={activeType}
          derivedCategory={derivedCategory}
          rules={rules}
          variants={variants}
        />
      </div>
    </section>
  );
}
