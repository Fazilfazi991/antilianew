import { useMemo, useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { useFilters } from '@/hooks/useFilters';
import { filterProperties, sortProperties, paginateProperties } from '@/lib/filterUtils';
import { extractLocations } from '@/lib/utils';
import { PropertyCard } from '@/components/PropertyCard';
import { FilterBar } from '@/components/FilterBar';
import { Pagination } from '@/components/Pagination';

const PER_PAGE = 9;

export function PropertiesPage() {
  const { properties, loading, error } = useProperties();
  const { filters, setFilter, resetFilters } = useFilters();
  const [search, setSearch] = useState('');

  const locations = useMemo(() => extractLocations(properties), [properties]);

  const { items, total, totalPages, page } = useMemo(() => {
    let filtered = filterProperties(properties, filters);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }
    const sorted = sortProperties(filtered, filters.sort);
    return paginateProperties(sorted, Number(filters.page) || 1, PER_PAGE);
  }, [properties, filters, search]);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero banner */}
      <section className="relative w-full h-[420px] flex items-center justify-center overflow-hidden">
        <img
          src="/heroes/hero-properties.jpg"
          alt="Luxury architectural building at dusk"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-margin-edge">
          <span className="font-label-caps text-label-caps text-[#A68966] uppercase tracking-[0.2em] block mb-4">
            Our Portfolio
          </span>
          <h1 className="font-display-xl text-display-xl text-white mb-4">
            Curated Properties
          </h1>
          <p className="font-body-md text-body-md text-white/60">
            Residential · Commercial · Investment
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        locations={locations}
        onFilter={setFilter}
        onReset={resetFilters}
        total={total}
        search={search}
        onSearch={setSearch}
      />

      {/* Property grid */}
      <section className="max-w-container-max mx-auto px-margin-edge pb-16 md:pb-24">
        {loading && (
          <div className="grid grid-cols-1 gap-x-7 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-[18px] bg-surface-container mb-4" />
                <div className="px-2 space-y-3">
                  <div className="h-8 bg-surface-container w-3/4" />
                  <div className="h-4 bg-surface-container w-1/2" />
                  <div className="h-8 bg-surface-container w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-headline-md text-headline-md text-on-surface-variant mb-2">
              Failed to load properties
            </p>
            <p className="font-body-md text-body-md text-outline">{error.message}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-headline-lg text-headline-lg text-outline mb-6">
              No properties found
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              Try adjusting your filters
            </p>
            <button
              onClick={() => { resetFilters(); setSearch(''); }}
              className="font-label-caps text-label-caps text-primary border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-colors uppercase tracking-[0.1em]"
            >
              Clear all filters
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-x-7 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
              {items.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => setFilter('page', String(p))}
            />
          </>
        )}
      </section>
    </div>
  );
}






