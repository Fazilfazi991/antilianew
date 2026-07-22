import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Briefcase, Building2, ClipboardCheck, Home, Shield } from "lucide-react";

const SERVICES = [
  {
    icon: Building2,
    title: "Residential Rentals",
    body: "Curated apartments, villas, and townhouses for rent across Qatar's most sought-after residential addresses.",
    image: "/qatar_real_estate_webp_images/image1_residential_rentals.webp",
    href: "/properties?category=rent",
  },
  {
    icon: Shield,
    title: "Property Management",
    body: "End-to-end landlord services, marketing, tenant screening, rent collection, and maintenance coordination.",
    image: "/qatar_real_estate_webp_images/image2_property_management.webp",
    href: "/about",
  },
  {
    icon: Home,
    title: "Property Purchase",
    body: "Expert guidance from search to keys, matching you with the right buy opportunity in the Qatar market.",
    image: "/qatar_real_estate_webp_images/image3_property_purchase.webp",
    href: "/properties?category=buy",
  },
  {
    icon: Briefcase,
    title: "Commercial Leasing",
    body: "Offices, retail units, and warehouses strategically located in the region's top business districts.",
    image: "/qatar_real_estate_webp_images/image4_commercial_leasing.webp",
    href: "/properties?category=commercial",
  },
  {
    icon: ClipboardCheck,
    title: "Consultancy & Valuation",
    body: "Clear property valuations and market guidance for owners, landlords, and clients planning their next real estate decision.",
    image: "/qatar_real_estate_webp_images/image5_consultancy_valuation.webp",
    href: "/contact",
  },
];

export function ServicesBento() {
  const [active, setActive] = useState(1);
  const reduced = useReducedMotion();

  return (
    <section className="w-full bg-background py-12 md:py-16">
      <div className="mx-auto max-w-container-max px-margin-edge">
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <motion.h2
            className="max-w-[720px] font-body-md text-[40px] font-semibold leading-[1.12] tracking-[0] text-primary sm:text-[52px] lg:text-[60px]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Expert services <span className="text-outline">tailored for your property goals</span>
          </motion.h2>
          <motion.p
            className="max-w-[620px] font-body-md text-[17px] leading-[1.7] text-on-surface-variant lg:pt-1"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Our experienced team combines local expertise with personalized service, delivering reliable property solutions with clear guidance and attentive support.
          </motion.p>
        </div>

        <div className="flex flex-col gap-5 lg:h-[432px] lg:flex-row lg:gap-5">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            const isActive = active === i;

            return (
              <motion.article
                key={service.title}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ delay: i * 0.05, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`group relative min-h-[330px] overflow-hidden rounded-[28px] bg-surface-container text-white transition-[flex-basis,flex-grow] duration-500 ease-out lg:h-full ${
                  isActive ? "lg:flex-[1_1_760px]" : "lg:flex-[0_0_132px]"
                }`}
              >
                <img
                  src={service.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className={`absolute inset-0 transition-colors duration-500 ${isActive ? "bg-[#050808]/45" : "bg-[#050808]/58"}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020303]/90 via-[#020303]/20 to-transparent" />

                <div className={`absolute inset-x-6 top-8 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0 lg:opacity-0"}`}>
                  <h3 className="max-w-[260px] font-body-md text-[28px] font-semibold leading-[1.15] text-white">
                    {service.title}
                  </h3>
                </div>

                <div className={`absolute bottom-7 left-6 right-6 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-100 lg:opacity-0"}`}>
                  <p className="mb-5 max-w-[760px] font-body-md text-[17px] font-medium leading-[1.55] text-white">
                    {service.body}
                  </p>
                  <Link
                    to={service.href}
                    className="inline-flex min-w-[150px] items-center justify-center gap-3 rounded-full bg-[#213d5d] px-6 py-4 font-body-md text-[15px] font-semibold leading-none text-white transition-colors hover:bg-[#2d4f76]"
                  >
                    More
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className={`absolute bottom-7 left-6 flex items-end gap-4 transition-opacity duration-300 ${isActive ? "opacity-0 lg:opacity-0" : "opacity-0 lg:opacity-100"}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-black/25 text-white backdrop-blur-[2px]">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="font-body-md text-[24px] font-semibold leading-[1.05] text-white lg:[writing-mode:vertical-rl] lg:rotate-180">
                    {service.title}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

