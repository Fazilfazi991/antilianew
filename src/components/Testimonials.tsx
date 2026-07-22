import { useRef } from "react";
import { motion } from "motion/react";
import { BlurText } from "@/components/BlurText";

const TESTIMONIALS = [
  {
    quote: "Antilia helped me find the perfect investment property in The Pearl within two weeks. Their team was professional, knowledgeable, and went above and beyond.",
    name: "Sarah Al Mansoori",
    role: "Property Investor",
  },
  {
    quote: "Relocating from London, I needed an apartment fast. Antilia's team understood exactly what I needed and found me a stunning place in West Bay. Truly five-star service.",
    name: "James Thornton",
    role: "Expat Tenant",
  },
  {
    quote: "I've entrusted Antilia with managing three of my properties in Lusail for five years. Zero vacancy issues and flawless rent collection every month.",
    name: "Mohammed Al Rashid",
    role: "Landlord",
  },
  {
    quote: "As a first-time buyer in Qatar, I was overwhelmed. Antilia's advisor walked me through every step — I couldn't have done it without them.",
    name: "Priya Sharma",
    role: "First-Time Buyer",
  },
  {
    quote: "We needed office space in West Bay on short notice. Antilia secured us a fully fitted floor within 10 days. Exceptional network.",
    name: "David Chen",
    role: "CEO, Tech Startup",
  },
  {
    quote: "Searched for months on my own with no luck. One call to Antilia and I had three perfect options the following week. Should have called sooner.",
    name: "Layla Al Farsi",
    role: "Renter, The Pearl",
  },
];

function TestimonialCard({ item }: { item: (typeof TESTIMONIALS)[0] }) {
  return (
    <div className="bg-surface-container border border-outline-variant p-5 w-[300px] md:w-[340px] shrink-0 flex flex-col gap-4">
      <p className="font-body-md text-body-md text-on-surface leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="size-9 bg-surface-container-high shrink-0" />
        <div>
          <p className="font-label-caps text-label-caps text-primary uppercase tracking-[0.08em]">{item.name}</p>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: (typeof TESTIMONIALS)[0][];
  reverse?: boolean;
}) {
  const row = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex overflow-hidden relative"
      onMouseEnter={() => { if (row.current) row.current.style.animationPlayState = "paused"; }}
      onMouseLeave={() => { if (row.current) row.current.style.animationPlayState = "running"; }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #fbf9f8, transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #fbf9f8, transparent)" }}
      />
      <div
        ref={row}
        className="flex gap-4"
        style={{
          animation: reverse
            ? "marquee-rev 32s linear infinite"
            : "marquee 28s linear infinite",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <TestimonialCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-12 md:py-16 overflow-hidden">
      <div className="px-margin-edge max-w-container-max mx-auto mb-6">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.15em] block mb-6"
        >
          Client Stories
        </motion.span>
        <BlurText
          text="Don't take our word for it."
          as="h2"
          className="font-headline-lg text-headline-lg text-primary max-w-[18ch]"
        />
      </div>

      <div className="flex flex-col gap-4">
        <MarqueeRow items={TESTIMONIALS} />
        <MarqueeRow items={[...TESTIMONIALS].reverse()} reverse />
      </div>
    </section>
  );
}



