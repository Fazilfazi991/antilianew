import { Link } from "react-router-dom";
import { getWhatsAppURL } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Properties", href: "/properties" },
  { label: "Buy",        href: "/properties?category=buy" },
  { label: "Rent",       href: "/properties?category=rent" },
  { label: "Commercial", href: "/properties?category=commercial" },
  { label: "About",              href: "/about" },
  { label: "Contact",            href: "/contact" },
  { label: "List Your Property", href: "/portal/login" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0e0e0e] border-t border-white/8">
      <div className="max-w-container-max mx-auto px-margin-edge py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-gutter">

          {/* Col 1: Logo + tagline + copyright */}
          <div className="md:col-span-5">
            <Link to="/" className="block mb-6">
              <img
                src="/logo/fulllogo_transparent.png"
                alt="Antilia Real Estate"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="font-body-md text-body-md text-white/40 max-w-xs leading-relaxed">
              Premium residential and commercial brokerage across Qatar.
            </p>
            <p className="font-label-caps text-label-caps text-white/20 uppercase mt-10">
              © {year} Antilia Real Estate
            </p>
          </div>

          {/* Col 2: Nav links */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="font-label-caps text-label-caps text-white/30 uppercase tracking-[0.15em] mb-6">
              Explore
            </p>
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="font-label-caps text-label-caps text-white/50 hover:text-white uppercase tracking-[0.08em] transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3: Contact / WhatsApp */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="font-label-caps text-label-caps text-white/30 uppercase tracking-[0.15em] mb-6">
              Contact
            </p>
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-label-caps text-label-caps text-white/50 hover:text-white uppercase tracking-[0.08em] transition-colors mb-4 w-fit"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chat</span>
              WhatsApp Enquiry
            </a>
            <div className="space-y-1 mt-6">
              <p className="font-label-caps text-label-caps text-white/25 uppercase tracking-[0.08em]">
                Qatar
              </p>
              <p className="font-label-caps text-label-caps text-white/25 uppercase tracking-[0.08em]">
                Sun – Thu: 9am – 6pm
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

