import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Images, Building2, PlusCircle } from 'lucide-react';
import { fetchAllPropertiesMarketing } from '@/lib/queries/marketing';
import type { Property } from '@/lib/types';

export function MarketingDashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPropertiesMarketing()
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const approved = properties.filter(p => p.listing_status === 'published');
  const pending = properties.filter(p => p.listing_status === 'pending_review');
  const totalImages = properties.reduce((sum, p) => sum + p.images.length, 0);
  const noImages = approved.filter(p => p.images.length === 0).length;
  const oneImage = approved.filter(p => p.images.length === 1).length;

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl">
      <div className="mb-12 pb-6 border-b border-surface-variant">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Marketing Team
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-variant mb-12">
            {[
              { label: 'Live Properties',  value: approved.length,  color: 'text-primary' },
              { label: 'Pending Review',   value: pending.length,   color: pending.length > 0 ? 'text-amber-600' : 'text-primary' },
              { label: 'Total Images',     value: totalImages,      color: 'text-primary' },
              { label: 'Missing Images',   value: noImages,         color: noImages > 0 ? 'text-red-500' : 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="bg-background p-6">
                <p className={`font-headline-lg text-headline-lg ${stat.color} mb-1`}>{stat.value}</p>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {(noImages > 0 || oneImage > 0) && (
            <div className="border border-amber-200 bg-amber-50 p-6 mb-8">
              <p className="font-label-caps text-label-caps text-amber-700 uppercase tracking-[0.1em] mb-2">
                Media Attention Needed
              </p>
              <p className="font-body-md text-body-md text-amber-700 mb-4">
                {noImages > 0 && `${noImages} propert${noImages !== 1 ? 'ies' : 'y'} have no images. `}
                {oneImage > 0 && `${oneImage} propert${oneImage !== 1 ? 'ies' : 'y'} have only 1 image. `}
                Listings with 4+ images perform significantly better.
              </p>
              <Link
                to="/marketing/media"
                className="inline-flex items-center gap-2 font-label-caps text-label-caps text-amber-700 border-b border-amber-400 pb-0.5 uppercase tracking-[0.08em] hover:text-amber-900 transition-colors"
              >
                <Images className="size-3.5" />
                Go to Media Manager →
              </Link>
            </div>
          )}

          <div className="border border-surface-variant p-6">
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-4">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/marketing/properties/new"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
              >
                <PlusCircle className="size-4" />
                Add New Property
              </Link>
              <Link
                to="/marketing/properties"
                className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] hover:border-primary hover:text-primary transition-colors"
              >
                <Building2 className="size-4" />
                Manage Properties
              </Link>
              <Link
                to="/marketing/media"
                className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] hover:border-primary hover:text-primary transition-colors"
              >
                <Images className="size-4" />
                Media Manager
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
