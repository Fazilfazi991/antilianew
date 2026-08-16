import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ListingStatusBadge } from '@/components/WorkflowBadge';
import { fetchAdminListings, fetchListingReviewEvents, rejectListing, transitionListing, type ListingReviewEvent } from '@/lib/queries/portal';
import { formatPrice } from '@/lib/utils';
import type { ListingStatus, Property } from '@/lib/types';
import { StorageImage } from '@/components/StorageImage';

const filters: Array<ListingStatus | 'all'> = ['all', 'pending_review', 'changes_requested', 'approved', 'published', 'rejected', 'unpublished'];
type Action = 'changes_requested' | 'approve' | 'publish' | 'unpublish' | 'reject';
type PendingAction = { property: Property; action: Action } | null;

export function AdminPendingListingsPage() {
  const [listings, setListings] = useState<Property[]>([]);
  const [filter, setFilter] = useState<ListingStatus | 'all'>('pending_review');
  const [selected, setSelected] = useState<Property | null>(null);
  const [history, setHistory] = useState<ListingReviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [action, setAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setListings(await fetchAdminListings(filter === 'all' ? undefined : filter)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load listings.'); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { if (selected) fetchListingReviewEvents(selected.id).then(setHistory).catch(() => setHistory([])); }, [selected]);

  async function performAction() {
    if (!action || ((action.action === 'changes_requested' || action.action === 'reject') && !reason.trim())) return;
    setActing(action.property.id); setError('');
    try {
      if (action.action === 'reject') await rejectListing(action.property.id, reason);
      else await transitionListing(action.property.id, action.action, reason);
      const fresh = await fetchAdminListings();
      const updated = fresh.find(listing => listing.id === action.property.id) ?? null;
      setAction(null); setReason(''); setSelected(updated);
      if (updated) setHistory(await fetchListingReviewEvents(updated.id));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Listing action failed.'); }
    finally { setActing(null); }
  }

  return <div className="max-w-6xl space-y-7 px-5 py-6 md:px-10 md:py-10">
    <header className="border-b border-surface-variant pb-6"><p className="mb-2 text-xs uppercase tracking-[.15em] text-outline">Listing moderation</p><h1 className="font-headline-lg text-headline-lg text-primary">Listing queue</h1><p className="mt-2 text-sm text-on-surface-variant">Approval and publication are separately recorded, protected actions.</p></header>
    <div className="flex flex-wrap gap-2">{filters.map(status => <button key={status} onClick={() => setFilter(status)} className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] ${filter === status ? 'border-primary bg-primary text-on-primary' : 'border-surface-variant text-on-surface-variant hover:border-primary'}`}>{status.replaceAll('_', ' ')}</button>)}</div>
    {error && <p role="alert" className="border border-error/30 bg-red-50 p-3 text-sm text-error">{error}</p>}
    {loading ? <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div> : <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-3">{listings.map(property => <article key={property.id} className={`border p-4 ${selected?.id === property.id ? 'border-primary' : 'border-surface-variant'}`}><div className="flex gap-4">{property.images[0] ? <StorageImage src={property.images.find(image => image.is_primary)?.url ?? property.images[0].url} alt="" className="h-20 w-24 shrink-0 object-cover bg-surface-container-low" /> : <div aria-hidden="true" className="h-20 w-24 shrink-0 bg-surface-container-low" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="truncate font-semibold text-primary">{property.title}</h2><ListingStatusBadge status={property.listing_status} /></div><p className="mt-1 text-xs uppercase tracking-[.08em] text-outline">{property.area}, {property.location} · {formatPrice(property.price, property.currency, property.price_period)}</p><p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{property.description}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setSelected(property)} className="border border-surface-variant px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] text-on-surface-variant hover:border-primary">Review details</button><ListingActions property={property} busy={acting === property.id} begin={setAction} /></div></div></div></article>)}{listings.length === 0 && <div className="border border-surface-variant py-16 text-center text-sm text-on-surface-variant">No listings in this queue.</div>}</section>
      <aside className="border border-surface-variant p-5">{selected ? <ListingDetail property={selected} history={history} busy={acting === selected.id} begin={setAction} /> : <p className="py-16 text-center text-sm text-on-surface-variant">Select a listing to see its moderation history.</p>}</aside>
    </div>}
    {action && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5"><div className="w-full max-w-md bg-background p-6 shadow-xl"><h2 className="font-headline-md text-primary">{label(action.action)} listing</h2><p className="mt-2 text-sm text-on-surface-variant">{requiresReason(action.action) ? 'A reason is required and will be included in the broker review record.' : 'This transition will be written to the listing audit trail.'}</p>{requiresReason(action.action) && <textarea value={reason} onChange={event => setReason(event.target.value)} className="mt-5 min-h-24 w-full border border-surface-variant p-3 text-sm outline-none focus:border-primary" placeholder={action.action === 'reject' ? 'Why is this listing rejected?' : 'What needs to change?'} />}<div className="mt-5 flex justify-end gap-3"><button onClick={() => { setAction(null); setReason(''); }} className="border border-surface-variant px-4 py-2 text-xs font-semibold uppercase tracking-[.08em]">Cancel</button><button disabled={acting === action.property.id || (requiresReason(action.action) && !reason.trim())} onClick={() => void performAction()} className="bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[.08em] text-on-primary disabled:opacity-50">{acting === action.property.id ? 'Saving…' : 'Confirm'}</button></div></div></div>}
  </div>;
}

function ListingActions({ property, busy, begin }: { property: Property; busy: boolean; begin: (next: PendingAction) => void }) {
  const buttons: Array<{ action: Action; label: string }> = property.listing_status === 'pending_review' ? [{ action: 'changes_requested', label: 'Request changes' }, { action: 'approve', label: 'Approve' }, { action: 'reject', label: 'Reject' }] : property.listing_status === 'approved' ? [{ action: 'publish', label: 'Publish' }] : property.listing_status === 'published' ? [{ action: 'unpublish', label: 'Unpublish' }] : property.listing_status === 'unpublished' ? [{ action: 'publish', label: 'Republish' }] : [];
  return <>{buttons.map(button => <button key={button.action} disabled={busy} onClick={() => begin({ property, action: button.action })} className="border border-surface-variant px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50">{busy ? 'Working…' : button.label}</button>)}</>;
}

function ListingDetail({ property, history, busy, begin }: { property: Property; history: ListingReviewEvent[]; busy: boolean; begin: (next: PendingAction) => void }) {
  return <><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-headline-md text-primary">{property.title}</h2><p className="mt-1 text-sm text-on-surface-variant">{property.area}, {property.location}</p></div><ListingStatusBadge status={property.listing_status} /></div>{property.rejection_reason && <div className="mt-5 border-l-2 border-orange-500 bg-orange-50 p-3 text-sm text-orange-900"><strong>Broker action required:</strong> {property.rejection_reason}</div>}<p className="mt-5 whitespace-pre-wrap text-sm text-on-surface-variant">{property.description}</p><div className="mt-5 grid grid-cols-2 gap-3 border-y border-surface-variant py-4 text-sm"><span className="text-on-surface-variant">Price</span><strong className="text-right text-primary">{formatPrice(property.price, property.currency, property.price_period)}</strong><span className="text-on-surface-variant">Bedrooms / baths</span><strong className="text-right text-primary">{property.bedrooms} / {property.bathrooms}</strong></div><div className="mt-5 flex flex-wrap gap-2"><ListingActions property={property} busy={busy} begin={begin} /></div><h3 className="mt-7 border-b border-surface-variant pb-2 text-xs font-semibold uppercase tracking-[.1em] text-outline">Audit history</h3><ol className="mt-3 space-y-3 text-sm">{history.map(event => <li key={event.id}><p className="font-medium capitalize text-primary">{event.action.replaceAll('_', ' ')}</p><p className="text-on-surface-variant">{event.previous_status || '—'} → {event.new_status} · {new Date(event.created_at).toLocaleString()}</p>{event.reason && <p className="mt-1 text-on-surface-variant">{event.reason}</p>}</li>)}{history.length === 0 && <li className="text-on-surface-variant">No review events yet.</li>}</ol></>;
}

function label(action: Action) { return action === 'changes_requested' ? 'Request changes to' : action === 'unpublish' ? 'Unpublish' : action[0].toUpperCase() + action.slice(1); }
function requiresReason(action: Action) { return action === 'changes_requested' || action === 'reject'; }
