import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getWhatsAppURL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Properties", href: "/properties" },
  { label: "About",      href: "/about" },
  { label: "Contact",    href: "/contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="fixed top-0 w-full z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
        <div className="flex justify-between items-center h-20 px-8 md:px-16 w-full max-w-container-max mx-auto">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img
              src="/logo/fulllogo_color.png"
              alt="Antilia Real Estate"
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`font-serif tracking-tight text-sm uppercase pb-1 transition-all hover:opacity-80 ${
                    active
                      ? "text-stone-900 border-b border-stone-900"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* WhatsApp + Portal icon + Hamburger */}
          <div className="flex items-center gap-4">
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 font-serif tracking-tight text-sm uppercase text-stone-900 hover:opacity-80 transition-all"
            >
              WhatsApp
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </a>
            <Link
              to={isAuthenticated ? "/portal" : "/portal/login"}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 hover:border-stone-900 transition-colors"
              aria-label="Portal"
              title={isAuthenticated ? "My Portal" : "List Your Property"}
            >
              <span className="material-symbols-outlined text-stone-600" style={{ fontSize: 16 }}>
                {isAuthenticated ? "person" : "person"}
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-stone-900"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-stone-50 flex flex-col px-8 py-6"
          >
            <div className="flex items-center justify-between mb-16">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <img
                  src="/logo/fulllogo_color.png"
                  alt="Antilia Real Estate"
                  className="h-12 w-auto"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-stone-900"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-8">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={item.href}
                    className="font-serif text-4xl font-light text-stone-900 hover:text-stone-400 transition-colors block"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto">
              <a
                href={getWhatsAppURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-stone-900 text-white font-label-caps text-label-caps uppercase tracking-[0.1em]"
              >
                WhatsApp Us
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
