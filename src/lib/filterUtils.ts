import type { Property, PropertyFilters } from './types';
import { getPropertyCategory, getTransactionType } from './propertyTaxonomy';

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters
): Property[] {
  return properties.filter(p => {
    if (filters.transactionType !== 'all' && getTransactionType(p) !== filters.transactionType) return false;
    if (filters.category && getPropertyCategory(p) !== filters.category) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.location && p.area !== filters.location) return false;
    if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
    if (filters.priceMax && p.price > Number(filters.priceMax)) return false;
    if (filters.bedrooms !== '' && p.bedrooms !== Number(filters.bedrooms)) return false;
    if (filters.bathrooms !== '' && p.bathrooms < Number(filters.bathrooms)) return false;
    if (filters.areaMin && p.area_sqft < Number(filters.areaMin)) return false;
    if (filters.areaMax && p.area_sqft > Number(filters.areaMax)) return false;
    if (filters.furnishing && p.furnishing !== filters.furnishing) return false;
    return true;
  });
}

export function sortProperties(
  properties: Property[],
  sort: PropertyFilters['sort']
): Property[] {
  const arr = [...properties];
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'featured':
      return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
    case 'newest':
    default:
      return arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function paginateProperties(
  properties: Property[],
  page: number,
  perPage: number = 12
): { items: Property[]; total: number; totalPages: number; page: number } {
  const total = properties.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const items = properties.slice(start, start + perPage);
  return { items, total, totalPages, page };
}
