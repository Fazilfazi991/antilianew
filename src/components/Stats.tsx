import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";

const STATS = [
  { value: 500,  suffix: "+", label: "Properties Listed" },
  { value: 1200, suffix: "+", label: "Satisfied Clients" },
  { value: 8,    suffix: "+", label: "Years in Business" },
  { value: 24,   suffix: "h", label: "Guaranteed Response" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {displayed}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background video */}
      <video
        src="/doha-skyline.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "saturate(0)" }}
      />

      {/* Gradient overlays */}
      <div className="absolute top-0 inset-x-0 h-[200px] gradient-fade-t z-[1]" />
      <div className="absolute bottom-0 inset-x-0 h-[200px] gradient-fade-b z-[1]" />
      <div className="absolute inset-0 bg-background/60 z-[1]" />

      {/* Content */}
      <div className="relative z-10 px-[var(--gutter)] max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-2xl p-10 md:p-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col"
              >
                <span
                  className="font-display text-foreground"
                  style={{ fontSize: "clamp(48px, 6vw, 88px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </span>
                <span className="font-body text-xs text-foreground/50 mt-4 tracking-[0.15em] uppercase">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
