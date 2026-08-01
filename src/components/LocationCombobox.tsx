import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LoaderCircle, MapPin } from 'lucide-react';

interface LocationComboboxProps {
  locations: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LocationCombobox({ locations, value, onChange, className = '' }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);
  const matches = locations.filter((location) => location.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  function select(location: string) { onChange(location); setQuery(location); setOpen(false); }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-[#d9b780]" />
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); onChange(event.target.value); setActiveIndex(0); setOpen(true); setLoading(true); if (debounceRef.current) window.clearTimeout(debounceRef.current); debounceRef.current = window.setTimeout(() => setLoading(false), 180); }}
        onFocus={() => { setOpen(true); setLoading(false); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0))); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); select(matches[activeIndex]); }
        }}
        placeholder="Select location(s)"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className="h-[54px] w-full rounded-xl border border-white/30 bg-black/15 py-2 pl-12 pr-11 font-body-md text-[16px] font-medium text-white placeholder:text-white/60 outline-none transition-colors focus:border-[#d9b780] focus:ring-2 focus:ring-[#d9b780]/30"
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-white/70" />
      {open && (
        <div id={listId} role="listbox" className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/20 bg-[#17191f]/95 p-1 shadow-2xl backdrop-blur-xl">
          {loading ? <p className="flex items-center gap-2 px-3 py-3 text-sm text-white/65"><LoaderCircle className="size-4 animate-spin" /> Finding locations…</p> : matches.length ? matches.map((location, index) => (
            <button key={location} type="button" role="option" aria-selected={value === location} onMouseDown={(event) => event.preventDefault()} onClick={() => select(location)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white transition-colors ${index === activeIndex ? 'bg-[#d9b780]/20 text-white' : 'hover:bg-white/10'}`}>
              <MapPin className="size-4 text-[#d9b780]" />{location}
            </button>
          )) : <p className="px-3 py-3 text-sm text-white/65">No locations found.</p>}
        </div>
      )}
    </div>
  );
}
