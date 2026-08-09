import { ArrowUpRight, Building2, ChartNoAxesCombined, Home, KeyRound } from 'lucide-react';
import { getWhatsAppURL } from '@/lib/utils';

const SERVICES = [
  {
    icon: Home,
    title: 'Residential Sales',
    body: 'From first apartments to landmark villas, we connect buyers with homes selected for enduring quality and value.',
  },
  {
    icon: KeyRound,
    title: 'Rental Management',
    body: 'A complete tenancy service covering viewings, contracts, maintenance coordination, renewals, and tenant care.',
  },
  {
    icon: Building2,
    title: 'Commercial Leasing',
    body: 'Offices, retail units, and warehouses sourced and negotiated around the operational needs of your business.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Portfolio Advisory',
    body: 'Clear investment strategy, yield analysis, and asset guidance for clients building resilient property portfolios.',
  },
];

const MILESTONES = [
  { value: '2016', label: 'Founded' },
  { value: '2020', label: 'Qatar expansion' },
  { value: '2', label: 'Gulf markets' },
];

export function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate min-h-[620px] overflow-hidden lg:min-h-[700px]">
        <img
          src="/heroes/hero-about.jpg"
          alt="Luxury office overlooking the Gulf skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07182d]/95 via-[#07182d]/68 to-[#07182d]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07182d]/45 via-transparent to-black/10" />

        <div className="relative mx-auto flex min-h-[620px] max-w-container-max items-end px-margin-edge pb-16 pt-28 lg:min-h-[700px] lg:pb-24">
          <div className="max-w-3xl text-white">
            <p className="mb-5 font-label-caps text-label-caps uppercase tracking-[0.22em] text-[#d9b780]">
              About Antilia
            </p>
            <h1 className="max-w-[780px] font-display-xl text-[clamp(44px,6vw,82px)] leading-[0.98] tracking-[-0.035em]">
              Local insight.<br />Lasting value.
            </h1>
            <p className="mt-7 max-w-2xl font-body-md text-[17px] leading-7 text-white/80 sm:text-[19px] sm:leading-8">
              An independent real estate advisory bringing considered guidance, exceptional properties,
              and personal accountability to clients across Qatar and the Gulf.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-surface-variant py-16 md:py-24 lg:py-28">
        <div className="mx-auto grid max-w-container-max grid-cols-1 items-center gap-12 px-margin-edge lg:grid-cols-12 lg:gap-gutter">
          <div className="relative lg:col-span-6">
            <div className="aspect-[4/5] overflow-hidden rounded-[24px] bg-surface-container sm:aspect-[5/4] lg:aspect-[4/5]">
              <img
                src="/qatar_real_estate_webp_images/image5_consultancy_valuation.webp"
                alt="Property advisory workspace overlooking the Doha skyline"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
            <div className="absolute -bottom-6 right-5 max-w-[210px] rounded-2xl border border-white/20 bg-[#102c4f] p-5 text-white shadow-2xl sm:right-8 lg:-right-6">
              <p className="font-headline-md text-[28px] leading-none text-[#d9b780]">10+</p>
              <p className="mt-2 text-sm leading-5 text-white/70">years of market knowledge and trusted relationships</p>
            </div>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <p className="mb-4 font-label-caps text-label-caps uppercase tracking-[0.2em] text-secondary">Our story</p>
            <h2 className="font-headline-lg text-[clamp(34px,4.3vw,56px)] leading-[1.04] tracking-[-0.025em] text-primary">
              Built on advice you can trust.
            </h2>
            <div className="mt-7 space-y-5 font-body-md text-[16px] leading-7 text-on-surface-variant">
              <p>
                Antilia began in 2016 as a boutique advisory serving clients who wanted more than a list of properties.
                They wanted honest context, careful negotiation, and an advisor who remained accountable after the deal.
              </p>
              <p>
                Our expansion into Qatar in 2020 carried that same standard into one of the region&apos;s most dynamic
                markets. Today, we support residential and commercial clients with local intelligence and a carefully
                selected portfolio.
              </p>
              <p>
                We measure our work in long-term relationships: clear recommendations, responsive service, and
                decisions made around each client&apos;s ambitions.
              </p>
            </div>

            <dl className="mt-10 grid grid-cols-3 border-y border-surface-variant py-6">
              {MILESTONES.map((item, index) => (
                <div key={item.label} className={index > 0 ? 'border-l border-surface-variant pl-5 sm:pl-7' : ''}>
                  <dt className="font-headline-md text-[26px] leading-none text-primary sm:text-[30px]">{item.value}</dt>
                  <dd className="mt-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.1em] text-outline sm:text-xs">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-16 md:py-24 lg:py-28">
        <div className="mx-auto max-w-container-max px-margin-edge">
          <div className="grid grid-cols-1 gap-7 border-b border-surface-variant pb-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="mb-4 font-label-caps text-label-caps uppercase tracking-[0.2em] text-secondary">What we do</p>
              <h2 className="font-headline-lg text-[clamp(34px,4.3vw,56px)] leading-[1.04] tracking-[-0.025em] text-primary">
                Property expertise,<br />shaped around you.
              </h2>
            </div>
            <p className="max-w-xl font-body-md text-[16px] leading-7 text-on-surface-variant lg:col-span-4 lg:col-start-9">
              From a single move to a growing portfolio, our team brings one standard of care to every brief:
              thoughtful advice, rigorous execution, and clear communication.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[24px] border border-surface-variant bg-surface-variant md:grid-cols-2">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="group min-h-[285px] bg-background p-7 transition-colors hover:bg-white sm:p-9 lg:p-11">
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#102c4f] text-[#d9b780]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <span className="font-label-caps text-xs tracking-[0.16em] text-outline">0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 font-headline-md text-[clamp(24px,2.5vw,34px)] leading-[1.1] text-primary">{service.title}</h3>
                  <p className="mt-4 max-w-lg font-body-md text-[15px] leading-6 text-on-surface-variant">{service.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-margin-edge py-16 md:py-24">
        <div className="relative mx-auto max-w-container-max overflow-hidden rounded-[28px] bg-[#0b1d36] px-7 py-12 text-white sm:px-12 md:py-16 lg:px-20">
          <div className="absolute -right-20 -top-28 size-80 rounded-full border border-[#d9b780]/20" />
          <div className="absolute -right-8 -top-8 size-44 rounded-full border border-[#d9b780]/25" />
          <div className="relative grid grid-cols-1 gap-9 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="mb-4 font-label-caps text-label-caps uppercase tracking-[0.2em] text-[#d9b780]">Start a conversation</p>
              <h2 className="max-w-3xl font-headline-lg text-[clamp(34px,4.3vw,56px)] leading-[1.04] tracking-[-0.025em]">
                Your next property decision deserves the right perspective.
              </h2>
            </div>
            <div className="lg:col-span-3 lg:col-start-10 lg:text-right">
              <a
                href={getWhatsAppURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-[#d9b780] px-6 py-3.5 text-sm font-semibold text-[#0b1d36] transition-all hover:-translate-y-0.5 hover:bg-[#e7cd9f]"
              >
                Talk to our team
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
