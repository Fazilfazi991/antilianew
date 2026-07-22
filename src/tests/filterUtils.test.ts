import { describe, it, expect } from 'vitest';
import { filterProperties, sortProperties, paginateProperties } from '@/lib/filterUtils';
import type { Property } from '@/lib/types';
import { DEFAULT_FILTERS } from '@/lib/types';

const makeProperty = (overrides: Partial<Property>): Property => ({
  id: '1',
  slug: 'test-property',
  title: 'Test Property',
  description: '',
  category: 'rent',
  type: 'apartment',
  price: 50000,
  price_period: 'per year',
  currency: 'AED',
  location: 'Dubai Marina, Dubai',
  area: 'Dubai Marina',
  lat: null,
  lng: null,
  bedrooms: 2,
  bathrooms: 2,
  area_sqft: 1200,
  furnishing: 'furnished',
  status: 'available',
  featured: false,
  amenities: [],
  images: [],
  seo_title: null,
  seo_description: null,
  owner_id: null,
  listing_status: 'approved',
  rejection_reason: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const properties: Property[] = [
  makeProperty({ id: '1', category: 'rent', type: 'apartment', price: 50000, bedrooms: 2, bathrooms: 2, area_sqft: 1200, furnishing: 'furnished', area: 'Dubai Marina' }),
  makeProperty({ id: '2', category: 'buy', type: 'villa', price: 2000000, bedrooms: 4, bathrooms: 4, area_sqft: 5000, furnishing: 'unfurnished', area: 'Emirates Hills' }),
  makeProperty({ id: '3', category: 'commercial', type: 'office', price: 120000, bedrooms: 0, bathrooms: 2, area_sqft: 2000, furnishing: 'unfurnished', area: 'DIFC' }),
  makeProperty({ id: '4', category: 'rent', type: 'studio', price: 30000, bedrooms: 0, bathrooms: 1, area_sqft: 500, furnishing: 'furnished', area: 'Jumeirah Lake Towers' }),
  makeProperty({ id: '5', category: 'buy', type: 'apartment', price: 800000, bedrooms: 3, bathrooms: 3, area_sqft: 2000, furnishing: 'semi-furnished', area: 'Downtown Dubai', featured: true }),
];

describe('filterProperties', () => {
  it('returns all when filters are default', () => {
    expect(filterProperties(properties, DEFAULT_FILTERS)).toHaveLength(5);
  });

  it('filters by category rent', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, category: 'rent' });
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.category).toBe('rent'));
  });

  it('filters by type villa', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, type: 'villa' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by location', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, location: 'Dubai Marina' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by priceMin', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, priceMin: '100000' });
    expect(result).toHaveLength(3);
  });

  it('filters by priceMax', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, priceMax: '50000' });
    expect(result).toHaveLength(2);
  });

  it('filters by exact bedrooms', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, bedrooms: '2' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters studios (bedrooms=0)', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, bedrooms: '0' });
    expect(result).toHaveLength(2);
  });

  it('filters by furnishing', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, furnishing: 'furnished' });
    expect(result).toHaveLength(2);
  });

  it('filters by areaMin sqft', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, areaMin: '2000' });
    expect(result).toHaveLength(3);
  });

  it('filters by areaMax sqft', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, areaMax: '1000' });
    expect(result).toHaveLength(1); // only id:4 has area_sqft=500 <= 1000
  });

  it('combines multiple filters', () => {
    const result = filterProperties(properties, { ...DEFAULT_FILTERS, category: 'rent', furnishing: 'furnished' });
    expect(result).toHaveLength(2);
  });
});

describe('sortProperties', () => {
  it('sorts by price ascending', () => {
    const result = sortProperties([...properties], 'price_asc');
    expect(result[0].price).toBe(30000);
    expect(result[result.length - 1].price).toBe(2000000);
  });

  it('sorts by price descending', () => {
    const result = sortProperties([...properties], 'price_desc');
    expect(result[0].price).toBe(2000000);
  });

  it('sorts featured first', () => {
    const result = sortProperties([...properties], 'featured');
    expect(result[0].featured).toBe(true);
  });

  it('sorts newest by created_at', () => {
    const withDates = [
      makeProperty({ id: 'a', created_at: '2026-01-01T00:00:00Z' }),
      makeProperty({ id: 'b', created_at: '2026-03-01T00:00:00Z' }),
    ];
    const result = sortProperties(withDates, 'newest');
    expect(result[0].id).toBe('b');
  });
});

describe('paginateProperties', () => {
  const items = Array.from({ length: 25 }, (_, i) =>
    makeProperty({ id: String(i + 1) })
  );

  it('returns first 12 on page 1', () => {
    const result = paginateProperties(items, 1, 12);
    expect(result.items).toHaveLength(12);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('returns 1 item on page 3', () => {
    const result = paginateProperties(items, 3, 12);
    expect(result.items).toHaveLength(1);
  });
});
