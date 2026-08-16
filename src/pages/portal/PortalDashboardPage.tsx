import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListingCounts, fetchMyListings } from '@/lib/queries/portal';
import { ListingStatusBadge } from '@/components/WorkflowBadge';
import type { Property } from '@/lib/types';

type Counts = { total: number; draft: number; pending: number; changesRequested: number; approved: number; published: number; rejected: number };

export function PortalDashboardPage() {
  const { session } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) return;
    Promise.all([fetchMyListingCounts(session.user.id), fetchMyListings(session.user.id)])
      .then(([nextCounts, nextListings]) => { setCounts(nextCounts); setListings(nextListings); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Property Portal
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
        </div>
        <Link
          to="/portal/listings/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Submit Property
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : counts && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-variant mb-12">
            {[
              { label: 'Total listings', value: counts.total,     color: 'text-primary' },
              { label: 'Drafts',          value: counts.draft,     color: 'text-slate-600' },
              { label: 'Pending Review',  value: counts.pending,  color: 'text-amber-600' },
              { label: 'Changes needed',  value: counts.changesRequested, color: 'text-orange-600' },
              { label: 'Approved',        value: counts.approved, color: 'text-sky-600' },
              { label: 'Published',       value: counts.published, color: 'text-emerald-600' },
              { label: 'Rejected',        value: counts.rejected, color: 'text-red-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-background p-6">
                <p className={`font-headline-lg text-headline-lg ${stat.color} mb-1`}>{stat.value}</p>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {listings.filter(listing => ['changes_requested', 'rejected'].includes(listing.listing_status)).length > 0 && (
            <section className="mb-8 border border-orange-200 bg-orange-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-orange-800">Needs attention</p>
              <div className="mt-3 space-y-3">
                {listings.filter(listing => ['changes_requested', 'rejected'].includes(listing.listing_status)).slice(0, 3).map(listing => (
                  <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-orange-200 pt-3 first:border-t-0 first:pt-0">
                    <div><p className="font-medium text-primary">{listing.title}</p>{listing.rejection_reason && <p className="mt-1 text-sm text-on-surface-variant">{listing.rejection_reason}</p>}</div>
                    <div className="flex items-center gap-3"><ListingStatusBadge status={listing.listing_status} />{listing.listing_status === 'changes_requested' && <Link to={`/portal/listings/${listing.id}/edit`} className="text-xs font-semibold uppercase tracking-[.08em] text-primary underline">Update</Link>}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {listings.length > 0 && (
            <section className="mb-8 border border-surface-variant p-5">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[.12em] text-outline">Recent listings</p><Link to="/portal/listings" className="text-xs font-semibold uppercase tracking-[.08em] text-primary underline">View all</Link></div>
              <div className="mt-3 space-y-3">{listings.slice(0, 4).map(listing => <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant pt-3 first:border-t-0 first:pt-0"><div><p className="font-medium text-primary">{listing.title}</p><p className="mt-1 text-xs text-outline">{listing.area}, {listing.location}</p></div><ListingStatusBadge status={listing.listing_status} /></div>)}</div>
            </section>
          )}

          <div className="border border-surface-variant p-6">
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-4">
              How It Works
            </p>
            <ol className="space-y-3">
              {[
                'Submit your property — our team reviews it within 1–2 business days.',
                'Once approved, your listing appears on the Antilia properties page.',
                'All enquiries come through Antilia — we handle negotiations and close the deal.',
              ].map((step, i) => (
                <li key={i} className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                  <span className="font-label-caps text-label-caps text-outline shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
