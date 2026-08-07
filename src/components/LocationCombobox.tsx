import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LoaderCircle, MapPin } from 'lucide-react';

interface LocationComboboxProps {
  locations: string[];
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function HighlightedLocation({ location, query }: { location: string; query: string }) {
  const index = location.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1 || !query) return <>{location}</>;
  return <>{location.slice(0, index)}<mark className="bg-transparent font-semibold text-[#e8c98e]">{location.slice(index, index + query.length)}</mark>{location.slice(index + query.length)}</>;
}

export function LocationCombobox({ locations, value, onChange, onOpenChange, className = '' }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) { setOpen(false); onOpenChange?.(false); }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);
  const normalizedLocations = [...new Set(locations.map((location) => location.trim()).filter(Boolean))];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? normalizedLocations.filter((location) => location.toLowerCase().includes(normalizedQuery)).sort((a, b) => {
      const aPrefix = a.toLowerCase().startsWith(normalizedQuery);
      const bPrefix = b.toLowerCase().startsWith(normalizedQuery);
      return Number(bPrefix) - Number(aPrefix) || a.localeCompare(b);
    }).slice(0, 8)
    : [];
  function select(location: string) { onChange(location); setQuery(location); setOpen(false); onOpenChange?.(false); }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-[#d9b780]" />
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); onChange(event.target.value); setActiveIndex(0); setOpen(true); onOpenChange?.(true); setLoading(true); if (debounceRef.current) window.clearTimeout(debounceRef.current); debounceRef.current = window.setTimeout(() => setLoading(false), 180); }}
        onFocus={() => { setOpen(true); onOpenChange?.(true); setLoading(false); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setOpen(false); onOpenChange?.(false); }
          if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0))); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); select(matches[activeIndex]); }
        }}
        placeholder="Select location(s)"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className="h-11 w-full rounded-lg border border-white/30 bg-black/15 py-2 pl-12 pr-11 font-body-md text-[15px] font-medium text-white placeholder:text-white/60 outline-none transition-colors focus:border-[#d9b780] focus:ring-2 focus:ring-[#d9b780]/30"
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-white/70" />
      {open && normalizedQuery && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[280px] overflow-y-auto rounded-xl border border-[#d9b780]/45 bg-[#17191f]/95 p-1 shadow-[0_16px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          {loading ? <p className="flex items-center gap-2 px-3 py-3 text-sm text-white/65"><LoaderCircle className="size-4 animate-spin" /> Finding locations…</p> : matches.length ? matches.map((location, index) => (
            <button key={location} type="button" role="option" aria-selected={value === location} onMouseDown={(event) => event.preventDefault()} onClick={() => select(location)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white transition-colors ${index === activeIndex ? 'bg-[#d9b780]/20 text-white' : 'hover:bg-white/10'}`}>
              <MapPin className="size-4 shrink-0 text-[#d9b780]" /><HighlightedLocation location={location} query={query} />
            </button>
          )) : <p className="px-3 py-3 text-sm text-white/65">No locations found.</p>}
        </div>
      )}
    </div>
  );
}
