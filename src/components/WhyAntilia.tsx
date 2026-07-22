import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

const FEATURES = [
  {
    eyebrow: "Portfolio",
    title: "Curated Excellence",
    body: "Every listing is personally vetted for architectural merit, location value, and investment potential. We present only what meets our exacting standard.",
  },
  {
    eyebrow: "Advisory",
    title: "Expert Guidance",
    body: "Dedicated advisors with deep market intelligence across Qatar. From first enquiry to final handover, your interests come first.",
  },
  {
    eyebrow: "Management",
    title: "Total Service",
    body: "End-to-end portfolio management — tenant curation, preventative maintenance, and rent collection — handled with the precision of a family office.",
  },
];

export function WhyAntilia() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-edge py-12 md:py-16">
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-5 mb-6 lg:mb-0">
          <motion.span
            className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            Why Antilia
          </motion.span>
          <motion.h2
            className="font-headline-lg text-headline-lg text-primary"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            The Antilia Standard
          </motion.h2>
        </div>

        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.eyebrow}
              className="flex flex-col gap-3 pt-5 border-t-2 border-secondary"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.15em]">
                {f.eyebrow}
              </span>
              <h3 className="font-headline-md text-headline-md text-primary">{f.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



