import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

const AREAS = [
  { name: "The Pearl",      city: "Doha",  count: 54, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80" },
  { name: "West Bay",       city: "Doha",  count: 38, image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80" },
  { name: "Lusail City",    city: "Qatar", count: 31, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80" },
  { name: "Msheireb",       city: "Doha",  count: 19, image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80" },
];

export function AreaHighlights() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full bg-surface-container-low py-section-gap">
      <div className="max-w-container-max mx-auto px-margin-edge">
        <div className="mb-16">
          <motion.span
            className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.2em] block mb-4"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            Qatar
          </motion.span>
          <motion.h2
            className="font-headline-lg text-headline-lg text-primary"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Prime Locations
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.name}
              initial={reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(8px)", y: 24 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="group relative aspect-[4/5] max-h-[460px] overflow-hidden rounded-[24px] bg-surface-container">
                <img
                  src={area.image}
                  alt={area.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071312]/90 via-[#071312]/30 to-transparent" />
                <div className="absolute bottom-6 left-5 right-5 transition-transform duration-300 ease-out group-hover:-translate-y-16 group-focus-within:-translate-y-16">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-[#071312]/45 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>apartment</span>
                  </div>
                  <p className="font-body-md text-[24px] font-semibold leading-none text-white sm:text-[27px]">{area.name}</p>
                  <p className="mt-2 font-body-md text-[17px] leading-none text-white sm:text-[18px]">
                    {area.count} properties
                  </p>
                </div>
                <div className="absolute inset-x-5 bottom-6 z-10 grid grid-cols-2 gap-3 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <Link
                    to={`/properties?category=rent&area=${encodeURIComponent(area.name)}`}
                    className="rounded-full bg-[#f2f7fd] px-4 py-3 text-center font-body-md text-[15px] font-semibold leading-none text-[#163352] transition-colors hover:bg-white"
                  >
                    Rent
                  </Link>
                  <Link
                    to={`/properties?category=buy&area=${encodeURIComponent(area.name)}`}
                    className="rounded-full bg-[#f2f7fd] px-4 py-3 text-center font-body-md text-[15px] font-semibold leading-none text-[#163352] transition-colors hover:bg-white"
                  >
                    Sale
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
