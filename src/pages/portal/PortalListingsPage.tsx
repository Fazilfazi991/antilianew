import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListings, deletePortalListing } from '@/lib/queries/portal';
import { formatPrice } from '@/lib/utils';
import type { Property, ListingStatus } from '@/lib/types';

const STATUS_LABEL: Record<ListingStatus, string> = {
  pending:  'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};
const STATUS_COLOR: Record<ListingStatus, string> = {
  pending:  'text-amber-600',
  approved: 'text-emerald-600',
  rejected: 'text-red-500',
};

export function PortalListingsPage() {
  const { session } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
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

      {!loading && listings.length > 0 && (
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
              {listings.map(p => (
                <tr key={p.id} className="border-b border-surface-variant hover:bg-surface-container-low transition-colors last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.images[0] && (
                        <img
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
                      <span className={`font-label-caps text-label-caps uppercase tracking-[0.06em] ${STATUS_COLOR[p.listing_status]}`}>
                        {STATUS_LABEL[p.listing_status]}
                      </span>
                      {p.listing_status === 'rejected' && p.rejection_reason && (
                        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.04em] mt-0.5 text-xs">
                          {p.rejection_reason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/portal/listings/${p.id}/edit`}
                        className="p-2 text-outline hover:text-primary transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={deleting === p.id}
                        className="p-2 text-outline hover:text-error transition-colors disabled:opacity-30"
                        aria-label="Delete"
                      >
                        {deleting === p.id
                          ? <Loader2 className="size-4 animate-spin" />
                          : <Trash2 className="size-4" />
                        }
                      </button>
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
