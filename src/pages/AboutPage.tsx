import { getWhatsAppURL } from '@/lib/utils';

const SERVICES = [
  {
    title: 'Residential Sales',
    body: 'From first apartments to trophy villas — we match discerning buyers with properties that hold their value.',
  },
  {
    title: 'Rental Management',
    body: 'Full-service tenancy management. We handle viewings, contracts, maintenance coordination, and renewals.',
  },
  {
    title: 'Commercial Leasing',
    body: 'Office space, retail units, and warehouses across Dubai and Qatar — sourced and negotiated for your business.',
  },
  {
    title: 'Portfolio Advisory',
    body: 'Investment strategy, yield analysis, and asset management for private clients building real estate portfolios.',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen pt-20">

      {/* Hero — split image + text */}
      <section className="border-b border-surface-variant">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Photo */}
          <div className="lg:col-span-7 relative h-[380px] lg:h-[520px] overflow-hidden">
            <img
              src="/heroes/hero-about.jpg"
              alt="Luxury office interior overlooking Dubai skyline"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Text */}
          <div className="lg:col-span-5 flex flex-col justify-center px-margin-edge py-16 lg:py-24">
            <span className="font-label-caps text-label-caps text-[#A68966] uppercase tracking-[0.2em] block mb-6">
              About Us
            </span>
            <div className="w-8 h-px bg-[#A68966] mb-8" />
            <h1 className="font-headline-lg text-headline-lg text-primary mb-8">
              Premium Brokerage, Gulf Expertise
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Antilia Real Estate is an independent brokerage specialising in residential and commercial
              property across the Gulf. We connect discerning clients with exceptional properties —
              and stay with you long after the keys are handed over.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are — split layout */}
      <section className="max-w-container-max mx-auto px-margin-edge py-section-gap border-b border-surface-variant">
        <div className="grid grid-cols-12 gap-gutter items-start">
          <div className="col-span-12 lg:col-span-5">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6">
              Our Story
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">
              Who We Are
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="space-y-6 font-body-md text-body-md text-on-surface-variant">
              <p>
                Founded in 2016, Antilia began as a boutique advisory focused exclusively on Dubai
                Marina and Downtown Dubai. Word of mouth grew us into a full-service brokerage trusted
                by relocating families, investors, and corporate tenants alike.
              </p>
              <p>
                In 2020, we expanded into Qatar, helping businesses and expats navigate Doha's
                fast-moving residential and commercial landscape. Today we manage a portfolio of
                active listings across both markets — all handpicked by our team.
              </p>
              <p>
                What hasn't changed: a handshake-level of accountability, and a refusal to rush any
                client into a deal that doesn't suit them perfectly.
              </p>
            </div>
            <div className="mt-12 aspect-[4/3] w-full bg-surface-container overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80"
                alt="Dubai skyline"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services — divider list */}
      <section className="max-w-container-max mx-auto px-margin-edge py-section-gap border-b border-surface-variant">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6">
          Services
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-16">
          What We Offer
        </h2>
        <div>
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className={`grid grid-cols-12 gap-gutter py-10 ${
                i < SERVICES.length - 1 ? 'border-b border-surface-variant' : ''
              }`}
            >
              <div className="col-span-12 md:col-span-4">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">
                  0{i + 1}
                </span>
                <h3 className="font-headline-md text-headline-md text-primary mt-2">
                  {s.title}
                </h3>
              </div>
              <div className="col-span-12 md:col-span-7 md:col-start-6">
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="max-w-container-max mx-auto px-margin-edge py-section-gap">
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 md:col-span-8">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6">
              Get in Touch
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">
              Ready to Find Your Place?
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-lg">
              Whether you're renting, buying, or managing a portfolio — we're here to help.
              Most enquiries receive a response within the hour.
            </p>
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat</span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
