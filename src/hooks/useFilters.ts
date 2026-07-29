import { useSearchParams } from 'react-router-dom';
import type { PropertyFilters } from '@/lib/types';
import { DEFAULT_FILTERS } from '@/lib/types';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: PropertyFilters = {
    transactionType: (searchParams.get('transactionType') as PropertyFilters['transactionType']) || (searchParams.get('category') === 'buy' || searchParams.get('purpose') === 'sale' ? 'buy' : searchParams.get('category') === 'rent' ? 'rent' : DEFAULT_FILTERS.transactionType),
    category: (searchParams.get('category') as PropertyFilters['category']) || (searchParams.get('segment') as PropertyFilters['category']) || DEFAULT_FILTERS.category,
    type: (searchParams.get('type') as PropertyFilters['type']) || DEFAULT_FILTERS.type,
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
      if (key === 'transactionType' || key === 'category') {
        next.delete('segment');
        next.delete('purpose');
      }
      return next;
    });
  }

  function resetFilters() {
    setSearchParams({});
  }

  return { filters, setFilter, resetFilters };
}
