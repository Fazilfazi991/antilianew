import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

const CATEGORIES = [
  {
    label: 'Rent',
    eyebrow: 'Find your next home',
    description: 'Apartments, villas, townhouses, studios, and more rental options across Qatar.',
    href: '/properties?category=rent',
    image: '/qatar_real_estate_webp_images/image1_residential_rentals.webp',
  },
  {
    label: 'Buy',
    eyebrow: 'Invest with confidence',
    description: 'Explore apartments, villas, townhouses, and other opportunities available to buy.',
    href: '/properties?category=buy',
    image: '/qatar_real_estate_webp_images/image3_property_purchase.webp',
  },
  {
    label: 'Residential',
    eyebrow: 'Homes across Qatar',
    description: 'Browse apartments, villas, townhouses, studios, and other residential properties.',
    href: '/properties?segment=residential',
    image: '/heroes/hero-properties.jpg',
  },
  {
    label: 'Commercial',
    eyebrow: 'Space for business',
    description: 'Discover offices, shops, retail units, and other commercial spaces in Qatar.',
    href: '/properties?segment=commercial',
    image: '/qatar_real_estate_webp_images/image4_commercial_leasing.webp',
  },
  {
    label: 'Industrial',
    eyebrow: 'Built for operations',
    description: 'Explore the current industrial inventory while the dedicated industrial experience is prepared.',
    href: '/properties?segment=industrial',
    image: '/heroes/hero-home.jpg',
  },
] as const;

const AUTOPLAY_INTERVAL = 3000;

export function CategoryShortcuts() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  const goTo = (index: number) => {
    setActiveIndex((index + CATEGORIES.length) % CATEGORIES.length);
  };

  const goNext = () => goTo(activeIndex + 1);
  const goPrevious = () => goTo(activeIndex - 1);

  useEffect(() => {
    if (paused || reducedMotion) return;

    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % CATEGORIES.length),
      AUTOPLAY_INTERVAL,
    );
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <section className="w-full border-b border-surface-variant bg-background py-12 md:py-16">
      <div className="mx-auto max-w-container-max px-margin-edge">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-label-caps text-label-caps uppercase tracking-[0.14em] text-secondary">Explore Antilia</p>
            <h2 className="font-headline-lg text-headline-lg text-primary">Find the right property path</h2>
          </div>
          <div className="flex gap-2" aria-label="Category slider controls">
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex size-11 items-center justify-center rounded-full border border-surface-variant text-primary transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Previous category"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex size-11 items-center justify-center rounded-full border border-surface-variant text-primary transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Next category"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[24px]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Property categories"
          tabIndex={0}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              goPrevious();
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              goNext();
            }
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const distance = event.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(distance) > 40) {
              if (distance > 0) goPrevious();
              else goNext();
            }
            touchStartX.current = null;
          }}
        >
          <div
            className="flex will-change-transform"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
              transition: reducedMotion ? 'none' : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {CATEGORIES.map((category, index) => (
              <Link
                key={category.label}
                to={category.href}
                aria-label={`Browse ${category.label} properties`}
                aria-current={activeIndex === index ? 'true' : undefined}
                className="group relative min-w-full overflow-hidden bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
              >
                <img
                  src={category.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071312]/90 via-[#071312]/65 to-[#071312]/25" />
                <div className="relative flex min-h-[340px] max-w-2xl flex-col justify-end p-7 text-white sm:min-h-[400px] sm:p-10">
                  <p className="mb-3 font-label-caps text-label-caps uppercase tracking-[0.14em] text-white/70">{category.eyebrow}</p>
                  <h3 className="mb-3 font-display-lg text-display-lg">{category.label}</h3>
                  <p className="max-w-xl font-body-md text-body-md text-white/85">{category.description}</p>
                  <span className="mt-7 inline-flex w-fit items-center gap-2 border-b border-white pb-1 font-label-caps text-label-caps uppercase tracking-[0.1em]">
                    Explore {category.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2" aria-label="Choose a property category">
          {CATEGORIES.map((category, index) => (
            <button
              key={category.label}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                activeIndex === index ? 'w-8 bg-primary' : 'w-2 bg-outline-variant hover:bg-outline'
              }`}
              aria-label={`Show ${category.label}`}
              aria-current={activeIndex === index ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
