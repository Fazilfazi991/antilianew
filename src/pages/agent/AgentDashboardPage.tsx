import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyListingCounts } from '@/lib/queries/agent';

type Counts = { total: number; pending: number; approved: number; rejected: number };

export function AgentDashboardPage() {
  const { session } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) return;
    fetchMyListingCounts(session.user.id)
      .then(setCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12 pb-6 border-b border-surface-variant">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
            Agent Portal
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
        </div>
        <Link
          to="/agent/listings/new"
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
              { label: 'Total Submitted', value: counts.total,    color: 'text-primary' },
              { label: 'Pending Review',  value: counts.pending,  color: 'text-amber-600' },
              { label: 'Approved',        value: counts.approved, color: 'text-emerald-600' },
              { label: 'Rejected',        value: counts.rejected, color: 'text-red-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-background p-6">
                <p className={`font-headline-lg text-headline-lg ${stat.color} mb-1`}>{stat.value}</p>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {counts.approved > 0 && (
            <div className="border border-emerald-200 bg-emerald-50 p-6 mb-6">
              <p className="font-label-caps text-label-caps text-emerald-700 uppercase tracking-[0.1em]">
                {counts.approved} listing{counts.approved !== 1 ? 's' : ''} live on the website
              </p>
            </div>
          )}

          {counts.rejected > 0 && (
            <div className="border border-red-200 bg-red-50 p-6 mb-6">
              <p className="font-label-caps text-label-caps text-red-700 uppercase tracking-[0.1em] mb-1">
                {counts.rejected} listing{counts.rejected !== 1 ? 's' : ''} need attention
              </p>
              <Link
                to="/agent/listings"
                className="font-label-caps text-label-caps text-red-600 border-b border-red-300 pb-0.5 uppercase tracking-[0.06em] hover:text-red-800 transition-colors"
              >
                Review rejection reasons →
              </Link>
            </div>
          )}

          <div className="border border-surface-variant p-6">
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-4">
              Submission Process
            </p>
            <ol className="space-y-3">
              {[
                'Submit a property — the Antilia admin team reviews it within 1–2 business days.',
                'Once approved, your listing goes live on the Antilia properties page.',
                'All client enquiries are handled by Antilia — you\'ll be notified on deals.',
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
