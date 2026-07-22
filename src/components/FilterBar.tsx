import { useState, useRef, useEffect } from 'react';
import type { PropertyFilters, PropertyType, Furnishing } from '@/lib/types';

interface FilterBarProps {
  filters: PropertyFilters;
  locations: string[];
  onFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  onReset: () => void;
  total: number;
  search: string;
  onSearch: (v: string) => void;
}

const CATEGORIES = [
  { value: 'all',        label: 'All' },
  { value: 'rent',       label: 'Rent' },
  { value: 'buy',        label: 'Buy' },
  { value: 'commercial', label: 'Commercial' },
] as const;

const TYPE_OPTIONS = [
  { value: '',            label: 'Any Type' },
  { value: 'apartment',   label: 'Apartment' },
  { value: 'villa',       label: 'Villa' },
  { value: 'penthouse',   label: 'Penthouse' },
  { value: 'duplex',      label: 'Duplex' },
  { value: 'townhouse',   label: 'Townhouse' },
  { value: 'studio',      label: 'Studio' },
  { value: 'compound',    label: 'Compound' },
  { value: 'office',      label: 'Office' },
  { value: 'shop',        label: 'Shop' },
  { value: 'warehouse',   label: 'Warehouse' },
];

const PRICE_MAX_OPTIONS = [
  { value: '',          label: 'Any Max' },
  { value: '250000',    label: 'Up to 250K' },
  { value: '500000',    label: 'Up to 500K' },
  { value: '1000000',   label: 'Up to 1M' },
  { value: '3000000',   label: 'Up to 3M' },
  { value: '5000000',   label: 'Up to 5M' },
  { value: '10000000',  label: 'Up to 10M' },
];

const PRICE_MIN_OPTIONS = [
  { value: '',         label: 'Any Min' },
  { value: '50000',    label: 'From 50K' },
  { value: '100000',   label: 'From 100K' },
  { value: '250000',   label: 'From 250K' },
  { value: '500000',   label: 'From 500K' },
  { value: '1000000',  label: 'From 1M' },
  { value: '3000000',  label: 'From 3M' },
];

const RENT_PRICE_MAX_OPTIONS = [
  { value: '',      label: 'Any Monthly Rent' },
  { value: '7000',  label: 'Up to QAR 7,000' },
  { value: '7500',  label: 'Up to QAR 7,500' },
  { value: '10000', label: 'Up to QAR 10,000' },
  { value: '15000', label: 'Up to QAR 15,000' },
  { value: '20000', label: 'Up to QAR 20,000' },
];

const RENT_PRICE_MIN_OPTIONS = [
  { value: '',      label: 'Any Monthly Rent' },
  { value: '5000',  label: 'From QAR 5,000' },
  { value: '7000',  label: 'From QAR 7,000' },
  { value: '10000', label: 'From QAR 10,000' },
  { value: '15000', label: 'From QAR 15,000' },
  { value: '20000', label: 'From QAR 20,000' },
];

const BED_OPTIONS = [
  { value: '', label: 'Any Beds' },
  { value: '0', label: 'Studio' },
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3 Beds' },
  { value: '4', label: '4 Beds' },
  { value: '5', label: '5+ Beds' },
];

const BATH_OPTIONS = [
  { value: '', label: 'Any Baths' },
  { value: '1', label: '1+ Bath' },
  { value: '2', label: '2+ Baths' },
  { value: '3', label: '3+ Baths' },
  { value: '4', label: '4+ Baths' },
];

const FURNISHING_OPTIONS = [
  { value: '',               label: 'Any Furnishing' },
  { value: 'furnished',      label: 'Furnished' },
  { value: 'unfurnished',    label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'featured',   label: 'Featured' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

const AREA_MIN_OPTIONS = [
  { value: '',      label: 'Any Min' },
  { value: '300',   label: 'From 300 sqft' },
  { value: '500',   label: 'From 500 sqft' },
  { value: '1000',  label: 'From 1,000 sqft' },
  { value: '2000',  label: 'From 2,000 sqft' },
  { value: '5000',  label: 'From 5,000 sqft' },
];

const AREA_MAX_OPTIONS = [
  { value: '',      label: 'Any Max' },
  { value: '500',   label: 'Up to 500 sqft' },
  { value: '1000',  label: 'Up to 1,000 sqft' },
  { value: '2000',  label: 'Up to 2,000 sqft' },
  { value: '5000',  label: 'Up to 5,000 sqft' },
  { value: '10000', label: 'Up to 10,000 sqft' },
];

function DropdownFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center font-label-caps text-label-caps text-primary pb-1 border-b transition-colors whitespace-nowrap ${
          value ? 'border-primary' : 'border-transparent hover:border-outline-variant'
        }`}
      >
        {active && value ? active.label : label}
        <span className="material-symbols-outlined ml-1" style={{ fontSize: 14 }}>
          keyboard_arrow_down
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-surface-container-lowest border border-surface-variant shadow-sm min-w-[180px] max-h-64 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 font-label-caps text-label-caps uppercase hover:bg-surface-container transition-colors ${
                value === o.value ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({ filters, locations, onFilter, onReset, total, search, onSearch }: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);
  const priceMaxOptions = filters.category === 'rent' ? RENT_PRICE_MAX_OPTIONS : PRICE_MAX_OPTIONS;
  const priceMinOptions = filters.category === 'rent' ? RENT_PRICE_MIN_OPTIONS : PRICE_MIN_OPTIONS;

  const locationOptions = [
    { value: '', label: 'Any Location' },
    ...locations.map((l) => ({ value: l, label: l })),
  ];

  const hasActive =
    filters.category !== 'all' ||
    filters.type !== '' ||
    filters.location !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.bedrooms !== '' ||
    filters.bathrooms !== '' ||
    filters.areaMin !== '' ||
    filters.areaMax !== '' ||
    filters.furnishing !== '' ||
    filters.sort !== 'newest' ||
    search !== '';

  const hasMoreActive =
    filters.type !== '' ||
    filters.bathrooms !== '' ||
    filters.priceMin !== '' ||
    filters.areaMin !== '' ||
    filters.areaMax !== '' ||
    filters.furnishing !== '';

  return (
    <section className="bg-background border-b border-surface-variant py-4 mb-10">
      <div className="max-w-container-max mx-auto px-margin-edge">

        {/* Search */}
        <div className="mb-5 relative w-full md:w-2/3 lg:w-1/2">
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by location, building, or keyword..."
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 focus:outline-none pl-8 pb-2 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300"
          />
        </div>

        {/* Row 1: category tabs + sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex space-x-6 overflow-x-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onFilter('category', cat.value as PropertyFilters['category'])}
                className={`font-label-caps text-label-caps whitespace-nowrap pb-1 transition-colors ${
                  filters.category === cat.value
                    ? 'text-primary border-b border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sort</span>
            <select
              value={filters.sort}
              onChange={(e) => onFilter('sort', e.target.value as PropertyFilters['sort'])}
              className="bg-transparent border-none outline-none cursor-pointer font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: primary filters */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <DropdownFilter
            label="Location"
            value={filters.location}
            options={locationOptions}
            onChange={(v) => onFilter('location', v)}
          />
          <DropdownFilter
            label="Max Price"
            value={filters.priceMax}
            options={priceMaxOptions}
            onChange={(v) => onFilter('priceMax', v)}
          />
          <DropdownFilter
            label="Beds"
            value={filters.bedrooms}
            options={BED_OPTIONS}
            onChange={(v) => onFilter('bedrooms', v)}
          />

          {/* More filters toggle */}
          <button
            onClick={() => setShowMore((v) => !v)}
            className={`flex items-center font-label-caps text-label-caps pb-1 border-b transition-colors ${
              hasMoreActive ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-outline-variant hover:text-primary'
            }`}
          >
            {hasMoreActive ? 'More Filters •' : 'More Filters'}
            <span className="material-symbols-outlined ml-1" style={{ fontSize: 14 }}>
              {showMore ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {hasActive && (
            <button
              onClick={() => { onReset(); onSearch(''); setShowMore(false); }}
              className="font-label-caps text-label-caps text-outline-variant hover:text-primary transition-colors uppercase ml-auto"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Row 3: expanded filters */}
        {showMore && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 pt-4 border-t border-surface-variant">
            <DropdownFilter
              label="Type"
              value={filters.type}
              options={TYPE_OPTIONS}
              onChange={(v) => onFilter('type', v as PropertyType | '')}
            />
            <DropdownFilter
              label="Baths"
              value={filters.bathrooms}
              options={BATH_OPTIONS}
              onChange={(v) => onFilter('bathrooms', v)}
            />
            <DropdownFilter
              label="Min Price"
              value={filters.priceMin}
              options={priceMinOptions}
              onChange={(v) => onFilter('priceMin', v)}
            />
            <DropdownFilter
              label="Min Area"
              value={filters.areaMin}
              options={AREA_MIN_OPTIONS}
              onChange={(v) => onFilter('areaMin', v)}
            />
            <DropdownFilter
              label="Max Area"
              value={filters.areaMax}
              options={AREA_MAX_OPTIONS}
              onChange={(v) => onFilter('areaMax', v)}
            />
            <DropdownFilter
              label="Furnishing"
              value={filters.furnishing}
              options={FURNISHING_OPTIONS}
              onChange={(v) => onFilter('furnishing', v as Furnishing | '')}
            />
          </div>
        )}

        {/* Result count */}
        <p className="font-label-caps text-label-caps text-outline mt-4">
          {total} {total === 1 ? 'property' : 'properties'}
        </p>
      </div>
    </section>
  );
}
