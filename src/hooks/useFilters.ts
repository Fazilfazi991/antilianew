import { useSearchParams } from 'react-router-dom';
import type { PropertyFilters } from '@/lib/types';
import { DEFAULT_FILTERS } from '@/lib/types';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: PropertyFilters = {
    category: (searchParams.get('category') as PropertyFilters['category']) || DEFAULT_FILTERS.category,
    type: (searchParams.get('type') as PropertyFilters['type']) || DEFAULT_FILTERS.type,
    segment: (searchParams.get('segment') as PropertyFilters['segment']) || DEFAULT_FILTERS.segment,
    location: searchParams.get('location') || DEFAULT_FILTERS.location,
    priceMin: searchParams.get('priceMin') || DEFAULT_FILTERS.priceMin,
    priceMax: searchParams.get('priceMax') || DEFAULT_FILTERS.priceMax,
    bedrooms: searchParams.get('bedrooms') || DEFAULT_FILTERS.bedrooms,
    bathrooms: searchParams.get('bathrooms') || DEFAULT_FILTERS.bathrooms,
    areaMin: searchParams.get('areaMin') || DEFAULT_FILTERS.areaMin,
    areaMax: searchParams.get('areaMax') || DEFAULT_FILTERS.areaMax,
    furnishing: (searchParams.get('furnishing') as PropertyFilters['furnishing']) || DEFAULT_FILTERS.furnishing,
    sort: (searchParams.get('sort') as PropertyFilters['sort']) || DEFAULT_FILTERS.sort,
    page: searchParams.get('page') || DEFAULT_FILTERS.page,
  };

  function setFilter<K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const defaultVal = DEFAULT_FILTERS[key];
      if (!value || value === defaultVal) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      if (key !== 'page') next.delete('page');
      return next;
    });
  }

  function resetFilters() {
    setSearchParams({});
  }

  return { filters, setFilter, resetFilters };
}

