import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Property } from '@/lib/types';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import { PropertyCardActions } from '@/components/PropertyCardActions';
import { getPropertyCategory, getTransactionType, transactionLabel } from '@/lib/propertyTaxonomy';
import { Play } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

function getStatusLabel(property: Property): string {
  if (property.status === 'rented') return 'Rented';
  if (property.status === 'sold') return 'Sold';
  if (property.status === 'available') return 'Available';
  return transactionLabel(getTransactionType(property), true);
}

function getTypeLabel(type: Property['type']): string {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const images = useMemo(() => {
    const sorted = [...property.images].sort((a, b) => a.order - b.order);
    const urls = sorted.map((image) => image.url).filter(Boolean);
    return urls.length > 0 ? urls : [getPrimaryImage(property)];
  }, [property]);
  const [activeImage, setActiveImage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const image = images[activeImage] ?? images[0];
  const category = getPropertyCategory(property);
  const isResidential = category === 'residential';
  const reduced = useReducedMotion();
  const hasSlider = images.length > 1;
  const hasVideo = property.media?.some(media => media.media_type === 'video') ?? false;

  function showPrevious() {
    setSlideDirection(-1);
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setSlideDirection(1);
    setActiveImage((current) => (current + 1) % images.length);
  }

  function showImage(dotIndex: number) {
    if (dotIndex === activeImage) return;
    setSlideDirection(dotIndex > activeImage ? 1 : -1);
    setActiveImage(dotIndex);
  }
  return (
    <motion.article
      className="group flex h-full min-h-[392px] flex-col"
      initial={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(10px)', y: 22 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ delay: (index % 12) * 0.06, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="sr-only">{getStatusLabel(property)}</span>
      {property.featured && <span className="sr-only">Featured</span>}

      <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-surface-container">
        <Link to={`/properties/${property.slug}`} className="absolute inset-0 block">
          <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
            <motion.div
              key={`${property.id}-${activeImage}-${image}`}
              custom={slideDirection}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: slideDirection * 42, scale: 1.02 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: slideDirection * -42, scale: 1.02 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            ><StorageImage src={image} alt={property.title} loading="lazy" className="h-full w-full object-cover" /></motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
          <img
            src="/logo/fulllogo_transparent.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-5 left-5 h-10 w-auto object-contain opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
          />
        </Link>

        {hasSlider && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous property image"
              className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_left</span>
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next property image"
              className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_right</span>
            </button>
            <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[45%] -translate-x-1/2 items-center justify-center gap-1.5 overflow-hidden">
              {images.slice(0, 12).map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  onClick={() => showImage(dotIndex)}
                  aria-label={`Show property image ${dotIndex + 1}`}
                  className={`size-1.5 shrink-0 rounded-full transition-all duration-300 ${
                    activeImage === dotIndex ? 'scale-125 bg-white' : 'bg-white/35 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {hasVideo && <Link to={`/properties/${property.slug}?media=video`} className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#0b1d36]/85 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur" aria-label={`Watch video tour for ${property.title}`}><Play className="size-3 fill-current" /> Video Tour</Link>}
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <Link to={`/properties/${property.slug}`} className="block">
          <p className="font-body-md text-[21px] leading-7 font-semibold text-primary mb-1 line-clamp-1 min-h-7 group-hover:text-secondary transition-colors">
            {formatPrice(property.price, property.currency, property.price_period)}
          </p>
          <h2 className="font-body-md text-[15px] leading-5 font-semibold uppercase text-primary mb-2.5 line-clamp-1 min-h-5">
            {property.title}
          </h2>
        </Link>

        <p className="flex items-center gap-1.5 font-body-md text-[14px] leading-5 text-on-surface-variant mb-3.5 line-clamp-1 min-h-5">
          <span className="material-symbols-outlined shrink-0 text-outline" style={{ fontSize: 17 }}>location_on</span>
          {property.area}, {property.location}
        </p>

        <div className="mb-3"><PropertyCardActions property={property} /></div>

        <div className="mt-auto flex h-9 items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-3 font-body-md text-[13px] leading-none text-on-primary">
            {transactionLabel(getTransactionType(property), true)} · {category}
          </span>
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 font-body-md text-[14px] leading-none text-primary">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 17 }}>apartment</span>
            {getTypeLabel(property.type)}
          </span>

          {isResidential && (
            <>
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 font-body-md text-[14px] leading-none text-primary">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 17 }}>bed</span>
                {property.bedrooms === 0 ? 'Studio' : property.bedrooms}
              </span>
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 font-body-md text-[14px] leading-none text-primary">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 17 }}>bathtub</span>
                {property.bathrooms}
              </span>
            </>
          )}

          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 font-body-md text-[14px] leading-none text-primary">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 17 }}>square_foot</span>
            {property.area_sqft.toLocaleString()} SQFT
          </span>
        </div>
      </div>
    </motion.article>
  );
}
