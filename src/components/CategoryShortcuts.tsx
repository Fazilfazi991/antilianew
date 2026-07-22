import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { useReducedMotion } from "motion/react";

const CATEGORIES = [
  {
    label: "Rent",
    href: "/properties?category=rent",
    icon: "key",
    description: "Furnished studios to family villas — flexible tenancy terms across Qatar.",
  },
  {
    label: "Buy",
    href: "/properties?category=buy",
    icon: "sell",
    description: "Freehold and leasehold investments in Qatar's most sought-after addresses.",
  },
  {
    label: "Commercial",
    href: "/properties?category=commercial",
    icon: "domain",
    description: "Grade A offices, retail units, and industrial space in Doha's prime business districts.",
  },
];

export function CategoryShortcuts() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-edge py-8 border-b border-surface-variant">
      <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {CATEGORIES.map(({ label, href, icon, description }, i) => (
          <motion.div
            key={label}
            initial={reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y: 28 }}
            animate={inView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
            transition={{ delay: i * 0.09, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link to={href} className="group flex flex-col gap-4 p-5 border border-transparent hover:border-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[24px] text-outline group-hover:text-primary transition-colors">
                {icon}
              </span>
              <div className="flex flex-col gap-3">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.12em]">
                  {label}
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {description}
                </p>
              </div>
              <span className="flex items-center gap-1.5 font-label-caps text-label-caps text-secondary uppercase tracking-[0.08em] group-hover:gap-2.5 transition-all mt-auto">
                Browse
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}



