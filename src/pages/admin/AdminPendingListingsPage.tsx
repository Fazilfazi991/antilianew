import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { fetchPendingListings, approveListing, rejectListing } from '@/lib/queries/portal';
import type { ContactOverrides } from '@/lib/queries/portal';
import { formatPrice, getPrimaryImage } from '@/lib/utils';
import type { Property } from '@/lib/types';

type ContactState = Record<string, ContactOverrides>;

export function AdminPendingListingsPage() {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectForm, setRejectForm] = useState<{ id: string; reason: string } | null>(null);
  const [contacts, setContacts] = useState<ContactState>({});
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingListings()
      .then(data => {
        setListings(data);
        const init: ContactState = {};
        data.forEach(p => {
          init[p.id] = {
            contact_phone: p.contact_phone ?? '',
            contact_email: p.contact_email ?? '',
            contact_whatsapp: p.contact_whatsapp ?? '',
          };
        });
        setContacts(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function setContact(id: string, field: keyof ContactOverrides, value: string) {
    setContacts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleApprove(id: string) {
    setActing(id);
    try {
      const c = contacts[id] ?? {};
      const overrides: ContactOverrides = {};
      if (c.contact_phone?.trim()) overrides.contact_phone = c.contact_phone.trim();
      if (c.contact_email?.trim()) overrides.contact_email = c.contact_email.trim();
      if (c.contact_whatsapp?.trim()) overrides.contact_whatsapp = c.contact_whatsapp.trim();
      await approveListing(id, Object.keys(overrides).length ? overrides : undefined);
      setListings(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    if (!rejectForm) return;
    setActing(rejectForm.id);
    try {
      await rejectListing(rejectForm.id, rejectForm.reason);
      setListings(prev => prev.filter(p => p.id !== rejectForm.id));
      setRejectForm(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-6xl">
      <div className="flex items-end justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${listings.length} pending`}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Pending Listings</h1>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="text-center py-20 border border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant">
            No pending listings. You're all caught up.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="space-y-4">
          {listings.map(p => {
            const c = contacts[p.id] ?? {};
            const isContactExpanded = expandedContact === p.id;
            return (
              <div key={p.id} className="border border-surface-variant overflow-hidden">
                <div className="flex gap-5 p-5">
                  {p.images.length > 0 && (
                    <img src={getPrimaryImage(p)} alt="" className="w-28 h-20 object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-md text-headline-md text-primary mb-1 truncate">{p.title}</h3>
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] mb-2">
                      {p.area}, {p.location} · {p.category} · {p.type}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-3 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-outline font-label-caps text-label-caps uppercase tracking-[0.06em]">
                      <span>{formatPrice(p.price, p.currency, p.price_period)}</span>
                      {p.category !== 'commercial' && (
                        <>
                          <span>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} Beds`}</span>
                          <span>{p.bathrooms} Baths</span>
                        </>
                      )}
                      <span>{p.area_sqft.toLocaleString()} sqft</span>
                      <span>{p.furnishing}</span>
                    </div>
                    {p.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.amenities.map(a => (
                          <span key={a} className="px-2 py-0.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.04em] text-xs">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact overrides panel */}
                <div className="border-t border-surface-variant">
                  <button
                    onClick={() => setExpandedContact(isContactExpanded ? null : p.id)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-surface-container-low transition-colors"
                  >
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.08em]">
                      Edit Contact Details Before Approving
                    </span>
                    <span className="text-outline font-label-caps text-label-caps text-xs uppercase tracking-[0.06em]">
                      {isContactExpanded ? '▲ Hide' : '▼ Show'}
                    </span>
                  </button>

                  {isContactExpanded && (
                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low">
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-xs">
                          <Phone className="size-3" /> Phone
                        </label>
                        <input
                          type="text"
                          value={c.contact_phone ?? ''}
                          onChange={e => setContact(p.id, 'contact_phone', e.target.value)}
                          placeholder="+974 3xxx xxxx"
                          className="bg-transparent border border-outline-variant focus:border-primary focus:outline-none px-3 py-2 font-body-md text-body-md text-primary placeholder:text-outline-variant text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-xs">
                          <Mail className="size-3" /> Email
                        </label>
                        <input
                          type="email"
                          value={c.contact_email ?? ''}
                          onChange={e => setContact(p.id, 'contact_email', e.target.value)}
                          placeholder="contact@antilia.qa"
                          className="bg-transparent border border-outline-variant focus:border-primary focus:outline-none px-3 py-2 font-body-md text-body-md text-primary placeholder:text-outline-variant text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] text-xs">
                          <MessageCircle className="size-3" /> WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={c.contact_whatsapp ?? ''}
                          onChange={e => setContact(p.id, 'contact_whatsapp', e.target.value)}
                          placeholder="97412345678"
                          className="bg-transparent border border-outline-variant focus:border-primary focus:outline-none px-3 py-2 font-body-md text-body-md text-primary placeholder:text-outline-variant text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 px-5 py-4 border-t border-surface-variant bg-surface-container-low">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={acting === p.id}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    {acting === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectForm({ id: p.id, reason: '' })}
                    disabled={acting === p.id}
                    className="flex items-center gap-2 px-5 py-2.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-error hover:text-error disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="size-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-background w-full max-w-md p-8 space-y-5">
            <h2 className="font-headline-md text-headline-md text-primary">Reject Listing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Optionally provide a reason. The user will see this in their portal.
            </p>
            <textarea
              className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 focus:outline-none p-3 font-body-md text-body-md text-primary resize-none h-24 placeholder:text-outline-variant"
              placeholder="e.g. Images are too low resolution…"
              value={rejectForm.reason}
              onChange={e => setRejectForm(prev => prev ? { ...prev, reason: e.target.value } : null)}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!!acting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.08em] hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                {acting ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirm Reject
              </button>
              <button
                onClick={() => setRejectForm(null)}
                className="px-6 py-3 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
