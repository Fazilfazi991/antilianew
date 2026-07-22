import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListFilter, PlusCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { portalSignOut, fetchProfile } from '@/lib/queries/portal';
import type { Profile } from '@/lib/types';
import { DashboardMobileNav } from '@/components/DashboardMobileNav';

const NAV = [
  { to: '/portal',              label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { to: '/portal/listings',     label: 'My Listings',     icon: ListFilter,      exact: true },
  { to: '/portal/listings/new', label: 'Submit Property', icon: PlusCircle,      exact: false },
];

export function PortalLayout() {
  const { isAuthenticated, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile(session.user.id).then(setProfile);
    }
  }, [session?.user.id]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/portal/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleSignOut() {
    try {
      await portalSignOut();
      navigate('/portal/login', { replace: true });
    } catch {
      // non-fatal
    }
  }

  if (profile && profile.role === 'user' && profile.approved === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 border border-amber-300 bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-amber-600 text-lg">⏳</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Access Pending</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8">
            Your account is awaiting admin approval. You'll receive access once a team member has reviewed your request.
          </p>
          <button
            onClick={handleSignOut}
            className="font-label-caps text-label-caps text-on-surface-variant border border-surface-variant px-6 py-3 uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardMobileNav
        portalLabel="List Portal"
        navItems={NAV}
        onSignOut={handleSignOut}
        profile={profile ? { name: profile.full_name || session?.user.email || 'Portal User', subtitle: session?.user.email } : null}
      />

      <aside className="hidden md:flex w-56 shrink-0 bg-[#0e0e0e] flex-col pt-8 pb-6 px-4">
        <div className="mb-10 px-2">
          <Link to="/">
            <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-9 w-auto" />
          </Link>
          <p className="font-label-caps text-label-caps text-white/25 mt-2 uppercase tracking-[0.12em]">
            List Portal
          </p>
        </div>

        {/* User identity */}
        {profile && (
          <div className="mb-6 px-2 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="font-label-caps text-label-caps text-white/60 uppercase">
                  {profile.full_name?.[0] ?? '?'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-label-caps text-label-caps text-white/80 truncate uppercase tracking-[0.06em]">
                  {profile.full_name || session?.user.email}
                </p>
                <p className="font-label-caps text-label-caps text-white/25 truncate uppercase tracking-[0.04em] text-[10px]">
                  {session?.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 font-label-caps text-label-caps uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? 'text-white border-l-2 border-white pl-[10px]'
                    : 'text-white/40 hover:text-white/70 border-l-2 border-transparent pl-[10px]'
                }`}
              >
                <item.icon className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 font-label-caps text-label-caps text-white/25 hover:text-white/50 uppercase tracking-[0.08em] transition-colors border-l-2 border-transparent pl-[10px]"
        >
          <LogOut className="size-3.5 shrink-0" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 overflow-auto min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  );
}
