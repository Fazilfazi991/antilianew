import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { CategoryShortcuts } from "@/components/CategoryShortcuts";
import { ServicesBento } from "@/components/ServicesBento";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { AreaHighlights } from "@/components/AreaHighlights";
import { WhyAntilia } from "@/components/WhyAntilia";
import { Testimonials } from "@/components/Testimonials";
import { ListCTABand } from "@/components/ListCTABand";

export function HomePage() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <CategoryShortcuts />
      <ServicesBento />
      <FeaturedProperties />
      <AreaHighlights />
      <WhyAntilia />
      <Testimonials />
      <ListCTABand />
    </main>
  );
}

