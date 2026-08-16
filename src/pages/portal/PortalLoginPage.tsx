import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { portalSignIn } from '@/lib/queries/portal';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

export function PortalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await portalSignIn(email, password);
      navigate('/portal', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] px-6 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-[#d9b780]/35 bg-white px-6 py-7 shadow-[0_18px_50px_rgba(17,42,77,0.12)] sm:px-8">
        <Link to="/" className="mb-5 flex justify-center">
          <img src="/logo/fulllogo_color.png" alt="Antilia Real Estate" className="h-24 w-auto max-w-[185px] object-contain" />
        </Link>

        <p className="font-label-caps text-label-caps text-[#9e7b3d] uppercase tracking-[0.15em] mb-2 text-center">
          Property Portal
        </p>
        <h1 className="font-headline-lg text-[clamp(28px,4vw,34px)] text-primary mb-7 text-center">List Your Property</h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Email
            </label>
            <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Password
            </label>
            <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            <div className="mt-3 text-right"><Link to="/forgot-password" className="text-xs text-primary underline">Forgot password?</Link></div>
          </div>

          {error && (
            <p className="font-body-md text-body-md text-error border-b border-error pb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          No account?{' '}
          <Link to="/portal/signup" className="text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
