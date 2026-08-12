import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, MessageCircle, X } from 'lucide-react';
import { getWhatsAppURL } from '@/lib/utils';

const services = ['Property Management', 'Leasing', 'Sales', 'Property Acquisition', 'Investment Advisory'];
const properties = [{ label: 'Buy', href: '/properties?transactionType=buy' }, { label: 'Rent', href: '/properties?transactionType=rent' }, { label: 'All Properties', href: '/properties' }];

function Dropdown({ label, children }: { label: string; children: ReactNode }) {
  return <div className="group relative"><button className="flex items-center gap-1 py-2 font-body-md text-sm font-medium text-white/90 hover:text-[#d9b780]" aria-haspopup="true">{label}<ChevronDown className="size-3.5" /></button><div className="invisible absolute left-0 top-full w-56 rounded-xl border border-[#d9b780]/40 bg-[#112a4d] p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">{children}</div></div>;
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProperties, setMobileProperties] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const { pathname } = useLocation();
  const linkStyle = (href: string) => `font-body-md text-sm font-medium transition-colors ${pathname === href ? 'text-[#d9b780]' : 'text-white/90 hover:text-[#d9b780]'}`;

  return <>
    <header className="sticky top-0 z-50 border-b border-[#d9b780]/30 bg-[#112a4d] shadow-[0_4px_20px_rgba(6,20,40,0.34)]">
      <div className="mx-auto flex h-[84px] max-w-container-max items-center justify-between gap-5 px-margin-edge">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3"><img src="/logo/fulllogo_color.png" alt="Antilia Real Estate" className="h-[4.2rem] w-auto max-w-[160px] object-contain sm:max-w-[185px]" /><span className="hidden border-l border-[#d9b780]/45 pl-3 font-brand-script text-[18px] leading-[.82] text-[#ead19d] sm:block">Crafting Spaces,<br />Creating Value</span></Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary navigation">
          <Link to="/" className={linkStyle('/')}>Home</Link>
          <Dropdown label="Properties">{properties.map((item) => <Link key={item.label} to={item.href} className="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#d9b780]">{item.label}</Link>)}</Dropdown>
          <Dropdown label="Services">{services.map((service) => <Link key={service} to="/contact" className="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-[#d9b780]">{service}</Link>)}</Dropdown>
          <Link to="/about" className={linkStyle('/about')}>About</Link><Link to="/contact" className={linkStyle('/contact')}>Contact</Link>
        </nav>
        <div className="hidden items-center gap-2 lg:flex"><Link to="/portal/login" className="rounded-lg bg-[#d9b780] px-3 py-2 text-xs font-semibold text-[#112a4d] transition-colors hover:bg-[#f1d49e]">List Your Property</Link><a href={getWhatsAppURL()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-white/65 px-3 py-2 text-xs font-semibold text-white hover:border-[#d9b780] hover:text-[#d9b780]"><MessageCircle className="size-4" />WhatsApp</a></div>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-white lg:hidden"><Menu className="size-6" /></button>
      </div>
    </header>
    {mobileOpen && <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#112a4d] px-5 py-5 text-white lg:hidden"><div className="flex items-center justify-between"><img src="/logo/fulllogo_color.png" alt="Antilia Real Estate" className="h-14 w-auto" /><button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 text-white"><X /></button></div><p className="mt-2 font-brand-script text-[25px] leading-none text-[#ead19d]">Crafting Spaces, Creating Value</p><nav className="mt-8 space-y-2"><Link to="/" onClick={() => setMobileOpen(false)} className="block py-3 text-xl">Home</Link><button onClick={() => setMobileProperties(!mobileProperties)} className="flex w-full items-center justify-between py-3 text-xl">Properties <ChevronDown className={`transition-transform ${mobileProperties ? 'rotate-180' : ''}`} /></button>{mobileProperties && <div className="space-y-2 pl-4">{properties.map((item) => <Link key={item.label} to={item.href} onClick={() => setMobileOpen(false)} className="block py-2 text-white/75">{item.label}</Link>)}</div>}<button onClick={() => setMobileServices(!mobileServices)} className="flex w-full items-center justify-between py-3 text-xl">Services <ChevronDown className={`transition-transform ${mobileServices ? 'rotate-180' : ''}`} /></button>{mobileServices && <div className="space-y-2 pl-4">{services.map((service) => <Link key={service} to="/contact" onClick={() => setMobileOpen(false)} className="block py-2 text-white/75">{service}</Link>)}</div>}<Link to="/about" onClick={() => setMobileOpen(false)} className="block py-3 text-xl">About</Link><Link to="/contact" onClick={() => setMobileOpen(false)} className="block py-3 text-xl">Contact</Link></nav><div className="mt-8 grid grid-cols-2 gap-3"><Link to="/portal/login" className="rounded-lg bg-[#d9b780] p-3 text-center text-sm font-semibold text-[#112a4d]">List Your Property</Link><a href={getWhatsAppURL()} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/65 p-3 text-center text-sm font-semibold text-white">WhatsApp</a></div></div>}
  </>;
}
