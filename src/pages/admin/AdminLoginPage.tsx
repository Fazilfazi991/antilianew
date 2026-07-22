import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { adminSignIn } from '@/lib/queries/admin';
import { useAuth } from '@/hooks/useAuth';

export function AdminLoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, loading, navigate]);

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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-12 mx-auto mb-8 invert" />
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Admin Login</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Antilia Real Estate management</p>
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
