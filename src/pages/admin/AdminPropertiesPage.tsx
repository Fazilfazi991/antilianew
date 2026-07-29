import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { deleteProperty, toggleFeatured, toggleStatus } from '@/lib/queries/admin';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/lib/types';
import { getPropertyCategory, getTransactionType } from '@/lib/propertyTaxonomy';

const STATUS_OPTIONS = ['available', 'rented', 'sold'] as const;
const STATUS_COLORS: Record<string, string> = {
  available: 'text-emerald-600',
  rented: 'text-amber-600',
  sold: 'text-red-500',
};

export function AdminPropertiesPage() {
  const { properties, loading, error } = useProperties();
  const [items, setItems] = useState<Property[] | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'buy' | 'rent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'residential' | 'commercial' | 'industrial'>('all');

  const displayed = (items ?? properties).filter(property =>
    (transactionFilter === 'all' || getTransactionType(property) === transactionFilter) &&
    (categoryFilter === 'all' || getPropertyCategory(property) === categoryFilter)
  );

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProperty(id);
      setItems(prev => (prev ?? properties).filter(p => p.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleFeatured(p: Property) {
    const next = !p.featured;
    setItems(prev =>
      (prev ?? properties).map(item => item.id === p.id ? { ...item, featured: next } : item)
    );
    try {
      await toggleFeatured(p.id, next);
    } catch (e: unknown) {
      setItems(prev =>
        (prev ?? properties).map(item => item.id === p.id ? { ...item, featured: p.featured } : item)
      );
      alert('Failed to update featured: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleStatusChange(p: Property, status: typeof STATUS_OPTIONS[number]) {
    setItems(prev =>
      (prev ?? properties).map(item => item.id === p.id ? { ...item, status } : item)
    );
    try {
      await toggleStatus(p.id, status);
    } catch {
      setItems(prev =>
        (prev ?? properties).map(item => item.id === p.id ? { ...item, status: p.status } : item)
      );
    }
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            {loading ? '…' : `${displayed.length} listings`}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Properties</h1>
        </div>
        <Link
          to="/admin/properties/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          Add Property
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select value={transactionFilter} onChange={e => setTransactionFilter(e.target.value as typeof transactionFilter)} className="border border-surface-variant bg-background px-3 py-2 font-label-caps text-label-caps text-primary">
          <option value="all">All transactions</option><option value="buy">Buy</option><option value="rent">Rent</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as typeof categoryFilter)} className="border border-surface-variant bg-background px-3 py-2 font-label-caps text-label-caps text-primary">
          <option value="all">All categories</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <p className="font-body-md text-body-md text-error border-b border-error pb-3">
          {error.message}
        </p>
      )}

      {!loading && !error && (
        <div className="border border-surface-variant overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-low">
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Property</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden lg:table-cell">Transaction</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden lg:table-cell">Category</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden md:table-cell">Price</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden lg:table-cell">Status</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3 hidden lg:table-cell">Featured</th>
                <th className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => (
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
                  <td className="px-5 py-4 hidden lg:table-cell capitalize">{getTransactionType(p)}</td>
                  <td className="px-5 py-4 hidden lg:table-cell capitalize">{getPropertyCategory(p)}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {formatPrice(p.price, p.currency, p.price_period)}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <select
                      value={p.status}
                      onChange={e => handleStatusChange(p, e.target.value as typeof STATUS_OPTIONS[number])}
                      className={`bg-transparent border-none font-label-caps text-label-caps uppercase tracking-[0.06em] focus:outline-none cursor-pointer ${STATUS_COLORS[p.status] ?? ''}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-background text-primary">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      aria-label={p.featured ? 'Remove from featured' : 'Add to featured'}
                      className={`transition-colors ${p.featured ? 'text-primary' : 'text-outline hover:text-on-surface-variant'}`}
                    >
                      <Star className="size-4" fill={p.featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/admin/properties/${p.id}/edit`}
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

          {displayed.length === 0 && (
            <div className="text-center py-20">
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">No properties yet.</p>
              <Link
                to="/admin/properties/new"
                className="font-label-caps text-label-caps text-primary border-b border-primary pb-0.5 uppercase tracking-[0.08em] hover:text-secondary hover:border-secondary transition-colors"
              >
                Add your first property →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
