import { motion } from "motion/react";
import { BlurText } from "@/components/BlurText";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Which areas in the UAE and Qatar do you cover?",
    a: "We cover all major residential and commercial areas across Dubai — including Dubai Marina, Downtown, Palm Jumeirah, Business Bay, JVC, and Arabian Ranches — as well as Doha's West Bay and The Pearl.",
  },
  {
    q: "How quickly can I arrange a property viewing?",
    a: "Most viewings can be scheduled within 24–48 hours of your inquiry. For urgent relocations, we prioritise same-day arrangements wherever possible.",
  },
  {
    q: "Do you offer property management services for landlords?",
    a: "Yes. Our full property management service covers tenant sourcing, rent collection, maintenance coordination, and regular reporting — so your investment runs itself.",
  },
  {
    q: "What documents do I need to rent a property in Dubai?",
    a: "Typically a valid passport, UAE residence visa, Emirates ID, and proof of income or employment letter. Our team will walk you through the exact checklist for your situation.",
  },
  {
    q: "Can Antilia assist with commercial property leasing?",
    a: "Absolutely. We specialise in offices, retail units, warehouses, and mixed-use commercial space across the UAE's key business districts. Tell us your requirements and we'll source the best options.",
  },
  {
    q: "Is there a fee for using Antilia's services?",
    a: "Our buyer and tenant advisory services are typically commission-based, covered by the landlord or developer. For property management, packages are quoted based on portfolio size. Contact us for a free consultation.",
  },
];

export function Faq() {
  return (
    <section className="py-24 md:py-32 px-[var(--gutter)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-16 lg:gap-24">
          {/* Left sticky column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="liquid-glass rounded-full px-4 py-1.5 inline-flex mb-6"
            >
              <span className="text-xs font-body text-foreground/80 tracking-wide uppercase">
                FAQ
              </span>
            </motion.div>

            <BlurText
              text="Frequently asked."
              as="h2"
              className="font-display uppercase text-foreground leading-[0.92] tracking-[-0.02em] mb-8"
              style={{ fontSize: "clamp(32px, 4vw, 60px)" } as React.CSSProperties}
            />

            <motion.div
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button variant="heroGlass" asChild>
                <a href="/contact">Contact Us</a>
              </Button>
            </motion.div>
          </div>

          {/* Right accordion */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="font-display uppercase text-lg tracking-tight data-[state=open]:text-primary text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
