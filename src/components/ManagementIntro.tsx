import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

export function ManagementIntro() {
  const reduced = useReducedMotion();

  function fadeUp(delay = 0) {
    return {
      initial: reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y: 28 },
      whileInView: { opacity: 1, filter: "blur(0px)", y: 0 },
      viewport: { once: true, amount: 0.1 } as { once: boolean; amount: number },
      transition: { delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    };
  }

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-edge py-12 md:py-16">
      <div className="grid grid-cols-12 gap-gutter items-center">

        {/* Text — left */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
          <motion.span
            className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em]"
            {...fadeUp(0)}
          >
            Service
          </motion.span>
          <motion.h2
            className="font-headline-lg text-headline-lg text-primary"
            {...fadeUp(0.08)}
          >
            Impeccable Management
          </motion.h2>
          <motion.p
            className="font-body-md text-body-md text-on-surface-variant max-w-md"
            {...fadeUp(0.16)}
          >
            Our property management service operates with the precision of a family office.
            We handle every detail of your portfolio — from high-level tenant curation to
            preventative structural maintenance — ensuring your assets appreciate quietly
            and effortlessly.
          </motion.p>
          <motion.div className="mt-4" {...fadeUp(0.22)}>
            <motion.div
              whileHover={reduced ? {} : { scale: 1.02 }}
              whileTap={reduced ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-block"
            >
              <Link
                to="/about"
                className="inline-block px-6 py-3 border border-outline-variant text-primary font-label-caps text-label-caps tracking-[0.1em] uppercase hover:text-secondary hover:border-secondary transition-colors"
              >
                Discover Services
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Image — right */}
        <motion.div
          className="col-span-12 lg:col-span-6 lg:col-start-7 order-1 lg:order-2 mb-6 lg:mb-0"
          initial={reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y: 28 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="aspect-[4/3] max-h-[460px] w-full bg-surface-container overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
              alt="Luxury property interior detail"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}



