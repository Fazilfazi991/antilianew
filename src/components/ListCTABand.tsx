import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

export function ListCTABand() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full bg-[#121212] py-10 md:py-12">
      <div className="max-w-container-max mx-auto px-margin-edge">
        <div className="grid grid-cols-12 gap-gutter items-center">
          <div className="col-span-12 lg:col-span-6 mb-6 lg:mb-0">
            <motion.span
              className="font-label-caps text-label-caps text-[#A68966] uppercase tracking-[0.2em] block mb-3"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              For Property Owners
            </motion.span>
            <motion.h2
              className="font-headline-lg text-headline-lg text-[#F9F8F6]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              List Your Property With Us
            </motion.h2>
            <motion.p
              className="font-body-md text-body-md text-[#888] mt-3 max-w-md"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.16, duration: 0.6 }}
            >
              Join our curated portfolio. Our team reviews each submission and handles all enquiries on your behalf.
            </motion.p>
          </div>

          <motion.div
            className="col-span-12 lg:col-span-6 flex flex-col sm:flex-row gap-3 lg:justify-end"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.22, duration: 0.6 }}
          >
            <Link
              to="/portal/login"
              className="inline-block bg-[#F9F8F6] text-[#121212] px-6 py-3 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:bg-[#A68966] hover:text-white transition-colors duration-300 text-center"
            >
              Create Account
            </Link>
            <Link
              to="/portal/login"
              className="inline-block border border-[#A68966] text-[#A68966] px-6 py-3 font-label-caps text-label-caps tracking-[0.1em] uppercase hover:bg-[#A68966] hover:text-white transition-colors duration-300 text-center"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}




