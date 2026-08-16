import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserCheck, Ban, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { AccountStatusBadge } from '@/components/WorkflowBadge';
import { fetchAccountModerationEvents, fetchAllUsers, moderateAccount, type AccountModerationEvent } from '@/lib/queries/admin';
import { fetchAdminListings } from '@/lib/queries/portal';
import type { AccountStatus, Profile, Property } from '@/lib/types';

const states: Array<AccountStatus | 'all'> = ['all', 'pending', 'approved', 'rejected', 'suspended'];
type ModerationTarget = { profile: Profile; status: AccountStatus } | null;

export function AdminBrokerManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<AccountStatus | 'all'>('all');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [events, setEvents] = useState<AccountModerationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<ModerationTarget>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [allUsers, allProperties] = await Promise.all([fetchAllUsers(), fetchAdminListings()]);
      setUsers(allUsers.filter(user => user.role === 'broker'));
      setProfilesById(Object.fromEntries(allUsers.map(user => [user.id, user])));
      setProperties(allProperties);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load broker accounts.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);
  useEffect(() => {
    if (!selected) return;
    fetchAccountModerationEvents(selected.id).then(setEvents).catch(() => setEvents([]));
  }, [selected]);

  const visible = useMemo(() => users.filter(user => filter === 'all' || user.account_status === filter), [users, filter]);
  const counts = useMemo(() => Object.fromEntries(states.map(state => [state, state === 'all' ? users.length : users.filter(user => user.account_status === state).length])), [users]);
  const owned = selected ? properties.filter(property => property.owner_id === selected.id) : [];

  async function confirmModeration() {
    if (!target) return;
    setSaving(true); setError('');
    try {
      await moderateAccount(target.profile.id, target.status, reason);
      setUsers(previous => previous.map(user => user.id === target.profile.id ? { ...user, account_status: target.status, approved: target.status === 'approved' } : user));
      setSelected(previous => previous?.id === target.profile.id ? { ...previous, account_status: target.status, approved: target.status === 'approved' } : previous);
      setTarget(null); setReason('');
      if (selected?.id === target.profile.id) setEvents(await fetchAccountModerationEvents(target.profile.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Account update failed.'); }
    finally { setSaving(false); }
  }

  return <div className="max-w-6xl space-y-7 px-5 py-6 md:px-10 md:py-10">
    <header className="border-b border-surface-variant pb-6"><p className="mb-2 text-xs uppercase tracking-[.15em] text-outline">Account moderation</p><h1 className="font-headline-lg text-headline-lg text-primary">Broker accounts</h1><p className="mt-2 text-sm text-on-surface-variant">Approve access, suspend accounts, and keep a server-recorded moderation history.</p></header>
    <div className="flex flex-wrap gap-2">{states.map(state => <button key={state} onClick={() => setFilter(state)} className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] ${filter === state ? 'border-primary bg-primary text-on-primary' : 'border-surface-variant text-on-surface-variant hover:border-primary'}`}>{state.replace('_', ' ')} ({counts[state]})</button>)}</div>
    {error && <p role="alert" className="border border-error/30 bg-red-50 p-3 text-sm text-error">{error}</p>}
    {loading ? <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div> : <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="overflow-hidden border border-surface-variant"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-[.08em] text-outline"><tr><th className="p-4">Broker</th><th className="p-4">Status</th><th className="p-4">Listings</th><th className="p-4">Joined</th><th className="p-4" /></tr></thead><tbody>{visible.map(user => <tr key={user.id} className="border-t border-surface-variant"><td className="p-4"><p className="font-medium text-primary">{user.full_name || 'Unnamed broker'}</p><p className="mt-1 font-mono text-[10px] text-outline">{user.id.slice(0, 8)}…</p></td><td className="p-4"><AccountStatusBadge status={user.account_status} /></td><td className="p-4 text-on-surface-variant">{properties.filter(property => property.owner_id === user.id).length}</td><td className="p-4 text-on-surface-variant">{new Date(user.created_at).toLocaleDateString()}</td><td className="p-4"><button onClick={() => setSelected(user)} className="text-xs font-semibold uppercase tracking-[.08em] text-primary underline">Details</button></td></tr>)}{visible.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-on-surface-variant">No broker accounts in this state.</td></tr>}</tbody></table></div></div>
      <aside className="border border-surface-variant p-5">{selected ? <><div className="mb-5 flex justify-between gap-3"><div><h2 className="font-semibold text-primary">{selected.full_name || 'Unnamed broker'}</h2><p className="mt-1 font-mono text-xs text-outline">{selected.id}</p></div><button onClick={() => setSelected(null)} aria-label="Close details"><X className="size-4" /></button></div><AccountStatusBadge status={selected.account_status} /><div className="mt-6 grid grid-cols-2 gap-3 border-y border-surface-variant py-4 text-sm"><span className="text-on-surface-variant">Listings</span><strong className="text-right text-primary">{owned.length}</strong><span className="text-on-surface-variant">Published</span><strong className="text-right text-primary">{owned.filter(p => p.listing_status === 'published').length}</strong></div><div className="mt-5 flex flex-wrap gap-2">{selected.account_status !== 'approved' && <Action icon={UserCheck} label="Approve" onClick={() => setTarget({ profile: selected, status: 'approved' })} />}{selected.account_status !== 'suspended' && <Action icon={Ban} label="Suspend" onClick={() => setTarget({ profile: selected, status: 'suspended' })} />}{selected.account_status !== 'rejected' && <Action icon={Ban} label="Reject" onClick={() => setTarget({ profile: selected, status: 'rejected' })} />}{selected.account_status !== 'pending' && <Action icon={RotateCcw} label="Set pending" onClick={() => setTarget({ profile: selected, status: 'pending' })} />}</div><h3 className="mt-7 border-b border-surface-variant pb-2 text-xs font-semibold uppercase tracking-[.1em] text-outline">Moderation history</h3><ul className="mt-3 space-y-3 text-sm">{events.map(event => <ModerationHistoryItem key={event.id} event={event} actor={event.actor_id ? profilesById[event.actor_id] : undefined} />)}{events.length === 0 && <li className="text-on-surface-variant">No recorded moderation events.</li>}</ul></> : <p className="py-12 text-center text-sm text-on-surface-variant">Select a broker to review their account and moderation history.</p>}</aside>
    </div>}
    {target && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5"><div className="w-full max-w-md bg-background p-6 shadow-xl"><h2 className="font-headline-md text-primary">{target.status === 'approved' ? 'Approve broker' : `${target.status === 'pending' ? 'Set broker pending' : `${target.status[0].toUpperCase()}${target.status.slice(1)} broker`}`}</h2><p className="mt-2 text-sm text-on-surface-variant">A reason is required and will be saved in the account moderation audit trail.</p><textarea value={reason} onChange={event => setReason(event.target.value)} className="mt-5 min-h-24 w-full border border-surface-variant p-3 text-sm outline-none focus:border-primary" placeholder="Reason for this account action" /><div className="mt-5 flex justify-end gap-3"><button onClick={() => { setTarget(null); setReason(''); }} className="border border-surface-variant px-4 py-2 text-xs font-semibold uppercase tracking-[.08em]">Cancel</button><button disabled={!reason.trim() || saving} onClick={() => void confirmModeration()} className="bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[.08em] text-on-primary disabled:opacity-50">{saving ? 'Saving…' : 'Confirm'}</button></div></div></div>}
  </div>;
}

function Action({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) { return <button onClick={onClick} className="inline-flex items-center gap-2 border border-surface-variant px-3 py-2 text-xs font-semibold uppercase tracking-[.08em] text-on-surface-variant hover:border-primary hover:text-primary"><Icon className="size-3.5" />{label}</button>; }

function ModerationHistoryItem({ event, actor }: { event: AccountModerationEvent; actor?: Profile }) {
  const action = event.action.replaceAll('_', ' ');
  const actorLabel = actor?.full_name || (actor?.role === 'admin' ? 'Antilia Admin' : null) || (event.actor_id ? 'Administrator' : 'System');
  const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at));

  return <li className="border-b border-surface-variant pb-3 last:border-0">
    <p className="font-medium capitalize text-primary">{action}</p>
    <p className="mt-1 break-words text-on-surface-variant">{event.previous_status || '—'} → {event.new_status || '—'}</p>
    {event.reason && <p className="mt-1 break-words text-on-surface-variant">{event.reason}</p>}
    <p className="mt-1 text-xs text-outline">By {actorLabel} · {timestamp}</p>
  </li>;
}
