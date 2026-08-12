import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, ClipboardList, LogOut, Loader2 } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { adminSignOut } from '@/lib/queries/admin';
import { DashboardMobileNav } from '@/components/DashboardMobileNav';

const NAV = [
  { to: '/admin',            label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { to: '/admin/properties', label: 'Properties',       icon: Building2,       exact: false },
  { to: '/admin/listings',   label: 'Pending Listings', icon: ClipboardList,   exact: false },
];

export function AdminLayout() {
  const { isAuthenticated, isAdmin, loading } = useAdminAccess();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin) && location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  async function handleSignOut() {
    try {
      await adminSignOut();
      navigate('/admin/login', { replace: true });
    } catch {
      // non-fatal
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardMobileNav portalLabel="Admin" navItems={NAV} onSignOut={handleSignOut} />

      {/* Sidebar - stays dark */}
      <aside className="hidden md:flex w-56 shrink-0 bg-[#0e0e0e] flex-col pt-8 pb-6 px-4">
        <div className="mb-10 px-2">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-9 w-auto" />
          <p className="font-label-caps text-label-caps text-white/25 mt-2 uppercase tracking-[0.12em]">
            Admin
          </p>
        </div>

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

      {/* Content — light background */}
      <main className="flex-1 overflow-auto min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  );
}
