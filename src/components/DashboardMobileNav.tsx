import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, LogOut, type LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

interface DashboardMobileNavProps {
  portalLabel: string;
  navItems: NavItem[];
  profile?: { name: string; subtitle?: string } | null;
  onSignOut: () => void;
}

export function DashboardMobileNav({ portalLabel, navItems, profile, onSignOut }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-[#0e0e0e]">
        <div className="flex items-center gap-3">
          <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-7 w-auto" />
          <span className="font-label-caps text-label-caps text-white/25 uppercase tracking-[0.12em]">
            {portalLabel}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-[#0e0e0e] flex flex-col pt-8 pb-6 px-4"
          >
            <div className="flex items-start justify-between mb-8 px-2">
              <div>
                <img src="/logo/fulllogo_transparent.png" alt="Antilia" className="h-9 w-auto" />
                <p className="font-label-caps text-label-caps text-white/25 mt-2 uppercase tracking-[0.12em]">
                  {portalLabel}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {profile && (
              <div className="mb-6 px-2 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="font-label-caps text-label-caps text-white/60 uppercase">
                      {profile.name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-caps text-label-caps text-white/80 truncate uppercase tracking-[0.06em]">
                      {profile.name}
                    </p>
                    {profile.subtitle && (
                      <p className="font-label-caps text-label-caps text-white/25 truncate uppercase tracking-[0.04em] text-[10px]">
                        {profile.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-0.5 flex-1">
              {navItems.map(item => {
                const active = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 font-label-caps text-label-caps uppercase tracking-[0.08em] transition-colors ${
                      active
                        ? 'text-white border-l-2 border-white pl-[10px]'
                        : 'text-white/40 hover:text-white/70 border-l-2 border-transparent pl-[10px]'
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex items-center gap-3 px-3 py-3 font-label-caps text-label-caps text-white/25 hover:text-white/50 uppercase tracking-[0.08em] transition-colors border-l-2 border-transparent pl-[10px]"
            >
              <LogOut className="size-4 shrink-0" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
