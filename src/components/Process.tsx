import { motion } from "motion/react";
import { BlurText } from "@/components/BlurText";

const STEPS = [
  {
    n: "1",
    title: "Discover",
    body: "Browse our curated listings or share your requirements — we build a shortlist matched to your lifestyle and budget.",
  },
  {
    n: "2",
    title: "Consult",
    body: "A private consultation with your dedicated Antilia advisor to refine the brief and map the right areas.",
  },
  {
    n: "3",
    title: "View",
    body: "Private, unhurried viewings at times that suit you — no pressure, just the right information to decide.",
  },
  {
    n: "4",
    title: "Move In",
    body: "We handle every document, negotiation, and formality from accepted offer to the moment you receive the keys.",
  },
];

export function Process() {
  return (
    <section className="py-24 md:py-32 px-[var(--gutter)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="liquid-glass rounded-full px-4 py-1.5 inline-flex mb-6"
          >
            <span className="text-xs font-body text-foreground/80 tracking-wide uppercase">
              How It Works
            </span>
          </motion.div>

          <BlurText
            text="How it works."
            as="h2"
            className="font-display uppercase text-foreground leading-[0.92] tracking-[-0.02em]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)" } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative md:pr-8"
            >
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-[72px] right-0 w-8 h-px bg-gradient-to-r from-primary/40 to-transparent z-10" />
              )}

              <div className="select-none font-display leading-none text-primary/20 -mb-4"
                style={{ fontSize: "clamp(72px, 10vw, 140px)" }}>
                {step.n}
              </div>

              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="font-display uppercase text-xl text-foreground tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-foreground/65 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
