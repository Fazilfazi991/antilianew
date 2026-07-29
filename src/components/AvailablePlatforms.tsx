import { ExternalLink } from 'lucide-react';
import { PLATFORM_PROFILES } from '@/lib/platformProfiles';

export function AvailablePlatforms() {
  return (
    <section className="w-full border-b border-surface-variant bg-surface-container-low py-10 md:py-12">
      <div className="mx-auto flex max-w-container-max flex-col gap-5 px-margin-edge md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-label-caps text-label-caps uppercase tracking-[0.14em] text-secondary">Find Antilia online</p>
          <h2 className="mt-1 font-headline-md text-headline-md text-primary">We are available on</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {PLATFORM_PROFILES.map((platform) =>
            platform.url ? (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-surface-variant bg-background px-4 py-3 font-label-caps text-label-caps uppercase tracking-[0.08em] text-primary transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {platform.name}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span
                key={platform.name}
                className="border border-surface-variant bg-background px-4 py-3 font-label-caps text-label-caps uppercase tracking-[0.08em] text-on-surface-variant"
                title="Company profile URL to be supplied"
              >
                {platform.name}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
