import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfile, updateAgentProfile } from '@/lib/queries/agent';
import type { Profile } from '@/lib/types';

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';

export function AgentProfilePage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    position: '',
    phone: '',
    whatsapp: '',
    bio: '',
  });

  useEffect(() => {
    if (!session?.user.id) return;
    fetchProfile(session.user.id).then(p => {
      if (p) {
        setProfile(p);
        setForm({
          full_name: p.full_name ?? '',
          position: p.position ?? '',
          phone: p.phone ?? '',
          whatsapp: p.whatsapp ?? '',
          bio: p.bio ?? '',
        });
      }
      setLoading(false);
    });
  }, [session?.user.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await updateAgentProfile(session.user.id, form);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl">
      <div className="mb-12 pb-6 border-b border-surface-variant">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          Agent Portal
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">My Profile</h1>
      </div>

      <div className="flex items-center gap-4 mb-10 p-6 border border-surface-variant bg-surface-container-low">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-headline-md text-headline-md text-primary uppercase">
            {form.full_name?.[0] ?? session?.user.email?.[0] ?? '?'}
          </span>
        </div>
        <div>
          <p className="font-headline-md text-headline-md text-primary">{form.full_name || 'Agent'}</p>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em]">
            {form.position || 'Real Estate Agent'} · {session?.user.email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
            Full Name *
          </label>
          <input
            className={inputClass}
            value={form.full_name}
            onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
            required
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
            Position / Title
          </label>
          <input
            className={inputClass}
            value={form.position}
            onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
            placeholder="e.g. Senior Sales Agent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              Phone
            </label>
            <input
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+974 3xxx xxxx"
            />
          </div>
          <div>
            <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
              WhatsApp Number
            </label>
            <input
              className={inputClass}
              type="tel"
              value={form.whatsapp}
              onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="97412345678"
            />
          </div>
        </div>

        <div>
          <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
            Bio
          </label>
          <textarea
            className={inputClass + ' resize-none h-28'}
            value={form.bio}
            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Brief professional bio…"
          />
        </div>

        {error && (
          <p className="font-body-md text-body-md text-error border-b border-error pb-3">{error}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
          {saved && (
            <span className="flex items-center gap-2 font-label-caps text-label-caps text-emerald-600 uppercase tracking-[0.08em]">
              <CheckCircle className="size-4" />
              Saved
            </span>
          )}
        </div>

        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] text-xs border-t border-surface-variant pt-5">
          Your profile information is visible to the Antilia admin team. Your phone and WhatsApp details help the team contact you about your listings.
        </p>
      </form>

      {profile && (
        <div className="mt-10 pt-6 border-t border-surface-variant">
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-3">Account Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body-md text-body-md text-on-surface-variant">
            <div>
              <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] mb-1">Email</p>
              <p>{session?.user.email}</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] mb-1">Role</p>
              <p className="capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.08em] mb-1">Member Since</p>
              <p>{new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
