import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { fetchFeaturedProperties } from "@/lib/queries/properties";
import { formatPrice, getPrimaryImage, getPropertyWhatsAppURL } from "@/lib/utils";
import type { Property } from "@/lib/types";

function fadeUp(reduced: boolean | null, delay = 0) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 } as { once: boolean; amount: number },
    transition: { delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  };
}

function PropertyCard({
  property,
  delay,
  reduced,
}: {
  property: Property;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <motion.article
      className="h-full flex flex-col overflow-hidden rounded-lg border border-surface-variant bg-surface-container-low"
      {...fadeUp(reduced, delay)}
    >
      <div className="aspect-[16/11] w-full shrink-0 bg-surface-container overflow-hidden">
        <img
          src={getPrimaryImage(property)}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-headline-md text-[clamp(20px,2vw,26px)] leading-tight text-primary mb-1 line-clamp-2 min-h-[3.25rem]">
              {property.title}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
              {property.area}, {property.location}
            </p>
          </div>
          <p className="font-body-md text-body-md text-primary font-medium shrink-0 text-right max-w-[42%] line-clamp-2">
            {formatPrice(property.price, property.currency, property.price_period)}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-surface-variant pt-3">
          {property.category !== "commercial" && (
            <>
              <span className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bed</span>
                {property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Beds`}
              </span>
              <span className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bathtub</span>
                {property.bathrooms} Baths
              </span>
            </>
          )}
          <span className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>square_foot</span>
            {property.area_sqft.toLocaleString()} sqft
          </span>
          <motion.a
            href={getPropertyWhatsAppURL(property)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 font-label-caps text-label-caps text-primary hover:text-secondary uppercase tracking-[0.08em] transition-colors"
            whileHover={reduced ? {} : { x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Enquire <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </motion.a>
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturedProperties() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    fetchFeaturedProperties(6)
      .then(setFeatured)
      .catch((e) => console.error("[FeaturedProperties] error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="w-full max-w-container-max mx-auto px-margin-edge py-12 md:py-16">
        <div className="h-8 bg-surface-container w-64 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 items-stretch">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[16/11] bg-surface-container animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-edge py-12 md:py-16">
      <div className="flex items-end justify-between mb-6">
        <motion.h2 className="font-headline-lg text-headline-lg text-primary" {...fadeUp(reduced)}>
          Signature Collection
        </motion.h2>
        <motion.div {...fadeUp(reduced, 0.1)}>
          <Link
            to="/properties"
            className="hidden md:flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant hover:text-primary border-b border-transparent hover:border-primary pb-0.5 uppercase tracking-[0.1em] transition-colors"
          >
            View All
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </Link>
        </motion.div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${
        featured.length === 1 ? "lg:grid-cols-1 max-w-xl" :
        featured.length === 2 ? "lg:grid-cols-2" : "xl:grid-cols-3"
      } gap-x-6 gap-y-8 items-stretch`}>
        {featured.map((property, i) => (
          <PropertyCard
            key={property.id}
            property={property}
            delay={0.05 + i * 0.1}
            reduced={reduced}
          />
        ))}
      </div>

      <motion.div className="mt-8 md:hidden" {...fadeUp(reduced, 0.2)}>
        <Link
          to="/properties"
          className="flex items-center gap-2 font-label-caps text-label-caps text-primary border-b border-primary pb-1 w-fit uppercase tracking-[0.1em]"
        >
          View All Properties
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
        </Link>
      </motion.div>
    </section>
  );
}

