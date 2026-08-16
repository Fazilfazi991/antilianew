import type { AccountStatus, ListingStatus } from '@/lib/types';

const listingLabels: Record<ListingStatus, string> = {
  draft: 'Draft', pending_review: 'Pending review', changes_requested: 'Changes requested',
  approved: 'Approved', published: 'Published', rejected: 'Rejected', unpublished: 'Unpublished',
};

const accountLabels: Record<AccountStatus, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended',
};

const listingColours: Record<ListingStatus, string> = {
  draft: 'bg-slate-100 text-slate-700', pending_review: 'bg-amber-100 text-amber-800',
  changes_requested: 'bg-orange-100 text-orange-800', approved: 'bg-sky-100 text-sky-800',
  published: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800',
  unpublished: 'bg-slate-200 text-slate-700',
};

const accountColours: Record<AccountStatus, string> = {
  pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800', suspended: 'bg-slate-200 text-slate-700',
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${listingColours[status]}`}>{listingLabels[status]}</span>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${accountColours[status]}`}>{accountLabels[status]}</span>;
}
