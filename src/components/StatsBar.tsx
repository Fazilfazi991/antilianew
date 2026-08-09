import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

const STATS = [
  { number: "500+",          label: "Properties Listed"  },
  { number: "Qatar",         label: "Prime Market"        },
  { number: "15+",           label: "Years of Excellence" },
  { number: "98%",           label: "Client Satisfaction" },
];

export function StatsBar() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full bg-surface-container-low border-y border-surface-variant py-8">
      <div className="max-w-container-max mx-auto px-margin-edge">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-surface-variant">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 px-4 py-4 text-center"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="font-headline-lg text-[clamp(21px,2.24vw,29.4px)] leading-[1.15] tracking-[-0.01em] text-primary">{stat.number}</span>
              <span className="font-label-caps text-[8.4px] font-semibold leading-[11px] text-on-surface-variant uppercase tracking-[0.1em]">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

