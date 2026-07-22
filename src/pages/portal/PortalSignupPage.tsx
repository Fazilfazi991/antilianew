import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { portalSignUp } from '@/lib/queries/portal';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

export function PortalSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await portalSignUp(email, password, fullName);
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setError(
        msg.toLowerCase().includes('rate limit')
          ? 'Too many signup attempts. Please wait a few minutes and try again.'
          : msg
      );
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="size-10 text-primary mx-auto mb-6" />
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Account Created</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            Your account is pending admin approval. You'll be contacted once access has been granted. If email confirmation is required, check your inbox at <strong>{email}</strong> first.
          </p>
          <Link
            to="/portal/login"
            className="inline-block px-8 py-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block mb-10">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-10 w-auto invert" />
        </Link>

        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Property Portal
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-10">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">Full Name</label>
            <input type="text" className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">Email</label>
            <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">Password</label>
            <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" />
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
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          Already have an account?{' '}
          <Link to="/portal/login" className="text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
