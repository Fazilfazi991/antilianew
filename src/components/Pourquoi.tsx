import { motion } from "motion/react";
import { ShieldCheck, Clock, BadgeCheck, Award } from "lucide-react";
import { BlurText } from "@/components/BlurText";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    body: "Every transaction is fully insured and handled in strict compliance with UAE and Qatar regulatory standards.",
  },
  {
    icon: Clock,
    title: "24-Hour Response",
    body: "Our team guarantees a response within 24 hours — because your time and decisions cannot wait.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Listings",
    body: "Every property on our platform is physically inspected and verified by our team before it reaches you.",
  },
  {
    icon: Award,
    title: "8+ Years of Expertise",
    body: "Over eight years navigating the UAE and Qatar markets gives our clients an unmatched informational edge.",
  },
];

export function Pourquoi() {
  return (
    <section className="py-24 md:py-32 px-[var(--gutter)] bg-background">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="liquid-glass rounded-full px-4 py-1.5 inline-flex mb-6"
          >
            <span className="text-xs font-body text-foreground/80 tracking-wide uppercase">
              Why Antilia
            </span>
          </motion.div>

          <BlurText
            text="Why clients choose Antilia."
            as="h2"
            className="font-display uppercase text-foreground max-w-[18ch] leading-[0.92] tracking-[-0.02em]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)" } as React.CSSProperties}
          />

          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-body text-base text-foreground/60 max-w-xl"
          >
            Trusted by buyers, renters, tenants, and landlords across the UAE and Qatar since 2017.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="liquid-glass rounded-2xl p-7 flex flex-col"
              >
                <div className="liquid-glass-strong rounded-full w-11 h-11 flex items-center justify-center mb-6">
                  <Icon className="size-5 text-primary" />
                </div>

                <h3 className="font-display uppercase text-xl text-foreground tracking-tight mb-3">
                  {pillar.title}
                </h3>
                <p className="font-body text-sm text-foreground/65 leading-relaxed">
                  {pillar.body}
                </p>

                <div className="mt-auto pt-6 h-px w-10 bg-gradient-to-r from-primary to-transparent" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
