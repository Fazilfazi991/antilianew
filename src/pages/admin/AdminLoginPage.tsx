import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { adminSignIn } from '@/lib/queries/admin';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export function AdminLoginPage() {
  const { isAuthenticated, isAdmin, loading } = useAdminAccess();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) navigate('/admin', { replace: true });
  }, [isAuthenticated, isAdmin, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await adminSignIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  const inputClass =
    'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-3 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

  return (
    <div className="min-h-screen bg-[#112a4d] flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-[#d9b780]/55 bg-[#fffdf8] px-6 py-7 shadow-[0_20px_55px_rgba(0,0,0,0.28)] sm:px-8">
        <div className="mb-7 text-center">
          <img src="/logo/fulllogo_color.png" alt="Antilia Real Estate" className="h-24 max-w-[190px] w-auto object-contain mx-auto mb-4" />
          <p className="font-label-caps text-label-caps text-[#9e7b3d] uppercase tracking-[0.15em] mb-2">Secure Staff Access</p>
          <h1 className="font-headline-lg text-[clamp(28px,4vw,34px)] text-primary mb-2">Antilia Admin</h1>
          <p className="font-body-md text-sm text-on-surface-variant">For authorized Antilia admin and staff only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="admin@antiliarealestate.com"
            />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass + ' pr-10'}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-0 top-0 text-outline hover:text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="font-body-md text-body-md text-error border-b border-error pb-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
