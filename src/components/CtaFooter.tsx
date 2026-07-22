import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { BlurText } from "@/components/BlurText";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  { label: "Properties", href: "/properties" },
  { label: "About",      href: "/about" },
  { label: "Privacy",    href: "/privacy" },
  { label: "Contact",    href: "/contact" },
];

export function CtaFooter() {
  return (
    <section className="relative overflow-hidden">
      {/* Background video */}
      <video
        src="/doha-skyline.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.55)" }}
      />

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-[200px] gradient-fade-t z-[1]" />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-[200px] gradient-fade-b z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* CTA */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-[var(--gutter)] py-32">
          <BlurText
            text="Your Next Chapter Starts Here"
            as="h2"
            className="font-display text-white max-w-[16ch] text-center leading-[0.88] tracking-[-0.03em]"
            style={{ fontSize: "clamp(56px, 10vw, 160px)" } as React.CSSProperties}
          />

          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-body text-base md:text-lg text-white/70 max-w-lg"
          >
            One conversation. One plan. Your dream property found.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex items-center gap-3 flex-wrap justify-center"
          >
            <Button variant="hero">
              WhatsApp Us <ArrowUpRight className="ml-1 size-4" />
            </Button>
            <Button variant="heroGlass" asChild>
              <a href="/properties">View Properties</a>
            </Button>
          </motion.div>
        </div>

        {/* Footer bar */}
        <footer className="border-t border-white/10 px-[var(--gutter)] py-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-body text-xs text-white/50">
              &copy; 2025 Antilia Real Estate. All rights reserved.
            </p>
            <nav className="flex items-center gap-6 flex-wrap justify-center">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-xs text-white/50 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </section>
  );
}
