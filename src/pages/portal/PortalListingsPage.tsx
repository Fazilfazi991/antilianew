import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { ListingStatusBadge } from '@/components/WorkflowBadge';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListings, deletePortalListing } from '@/lib/queries/portal';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/lib/types';
import { StorageImage } from '@/components/StorageImage';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Live' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export function PortalListingsPage() {
  const { session } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  useEffect(() => {
    if (!session?.user.id) return;
    fetchMyListings(session.user.id)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deletePortalListing(id);
      setListings(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  const visibleListings = filter === 'all'
    ? listings
    : listings.filter(listing => listing.listing_status === filter);

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${visibleListings.length} listing${visibleListings.length !== 1 ? 's' : ''}`}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">My Listings</h1>
        </div>
        <Link
          to="/portal/listings/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Submit Property
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter listings by status">
          {FILTERS.map(option => {
            const count = option.value === 'all'
              ? listings.length
              : listings.filter(listing => listing.listing_status === option.value).length;
            return <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] transition-colors ${filter === option.value ? 'border-primary bg-primary text-on-primary' : 'border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}
            >
              {option.label} ({count})
            </button>;
          })}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="text-center py-20 border border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            You haven't submitted any properties yet.
          </p>
          <Link
            to="/portal/listings/new"
            className="font-label-caps text-label-caps text-primary border-b border-primary pb-0.5 uppercase tracking-[0.08em]"
          >
            Submit your first property →
          </Link>
        </div>
      )}

      {!loading && listings.length > 0 && visibleListings.length === 0 && (
        <div className="border border-surface-variant py-14 text-center text-sm text-on-surface-variant">
          No listings match this status.
        </div>
      )}

      {!loading && visibleListings.length > 0 && (
        <div className="border border-surface-variant overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Property</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden md:table-cell">Price</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Status</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleListings.map(p => (
                <tr key={p.id} className="border-b border-surface-variant hover:bg-surface-container-low transition-colors last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.images[0] && (
                        <StorageImage
                          src={p.images.find(i => i.is_primary)?.url ?? p.images[0].url}
                          alt=""
                          className="size-10 object-cover shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-body-md text-body-md text-primary line-clamp-1">{p.title}</p>
                        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em]">
                          {p.area}, {p.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {formatPrice(p.price, p.currency, p.price_period)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <ListingStatusBadge status={p.listing_status} />
                      {(p.listing_status === 'rejected' || p.listing_status === 'changes_requested') && p.rejection_reason && (
                        <p className="mt-2 max-w-xs text-xs text-on-surface-variant">{p.rejection_reason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {['draft', 'changes_requested'].includes(p.listing_status) ? <>
                        <Link to={`/portal/listings/${p.id}/edit`} className="p-2 text-outline hover:text-primary transition-colors" aria-label="Edit"><Pencil className="size-4" /></Link>
                        {p.listing_status === 'draft' && <button onClick={() => handleDelete(p.id, p.title)} disabled={deleting === p.id} className="p-2 text-outline hover:text-error transition-colors disabled:opacity-30" aria-label="Delete">{deleting === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>}
                      </> : <span className="text-xs text-outline">Locked while under review</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
