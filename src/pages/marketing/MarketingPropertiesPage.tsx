import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, PlusCircle, Pencil } from 'lucide-react';
import { fetchAllPropertiesMarketing } from '@/lib/queries/marketing';
import type { Property } from '@/lib/types';

function StatusBadge({ status }: { status: Property['listing_status'] }) {
  const map = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 border font-label-caps text-[10px] uppercase tracking-[0.1em] ${map[status]}`}>
      {status}
    </span>
  );
}

export function MarketingPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPropertiesMarketing()
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Marketing
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Properties</h1>
        </div>
        <Link
          to="/marketing/properties/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
        >
          <PlusCircle className="size-4" />
          New Property
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            No properties yet.
          </p>
          <Link
            to="/marketing/properties/new"
            className="font-label-caps text-label-caps text-primary border-b border-primary pb-0.5 uppercase tracking-[0.08em]"
          >
            Add the first one →
          </Link>
        </div>
      ) : (
        <div className="border border-surface-variant overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-variant">
                {['Title', 'Location', 'Category', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id} className="border-b border-surface-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body-md text-body-md text-primary truncate max-w-[240px]">{p.title}</p>
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-[0.06em] mt-0.5">{p.type}</p>
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant">{p.location}</td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant capitalize">{p.category}</td>
                  <td className="px-4 py-3 font-body-md text-body-md text-primary whitespace-nowrap">
                    {p.currency} {p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.listing_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/marketing/properties/${p.id}/edit`}
                      className="inline-flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-[0.08em] transition-colors"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
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
