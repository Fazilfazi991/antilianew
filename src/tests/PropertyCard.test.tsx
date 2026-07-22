import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyCard } from '@/components/PropertyCard';
import type { Property } from '@/lib/types';

const baseProperty: Property = {
  id: '1',
  slug: 'test-villa-dubai',
  title: 'Luxury Villa Dubai',
  description: 'A beautiful villa',
  category: 'buy',
  type: 'villa',
  price: 5000000,
  price_period: 'asking price',
  currency: 'AED',
  location: 'Dubai',
  area: 'Palm Jumeirah',
  lat: null,
  lng: null,
  bedrooms: 4,
  bathrooms: 5,
  area_sqft: 6000,
  furnishing: 'furnished',
  status: 'available',
  featured: true,
  amenities: ['Pool', 'Gym'],
  images: [{ url: 'https://example.com/img.jpg', alt: 'villa', order: 0, is_primary: true }],
  seo_title: null,
  seo_description: null,
  owner_id: null,
  listing_status: 'approved',
  rejection_reason: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function renderCard(props: Partial<Property> = {}) {
  return render(
    <MemoryRouter>
      <PropertyCard property={{ ...baseProperty, ...props }} />
    </MemoryRouter>
  );
}

describe('PropertyCard', () => {
  it('renders title', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: /Luxury Villa Dubai/i })).toBeTruthy();
  });

  it('renders formatted price', () => {
    renderCard();
    expect(screen.getByText(/AED/)).toBeTruthy();
  });

  it('shows Featured badge when featured=true', () => {
    renderCard({ featured: true });
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('does not show Featured badge when featured=false', () => {
    renderCard({ featured: false });
    expect(screen.queryByText('Featured')).toBeNull();
  });

  it('shows Studio instead of 0 beds for studios', () => {
    renderCard({ bedrooms: 0, type: 'studio' });
    expect(screen.getAllByText('Studio').length).toBeGreaterThanOrEqual(1);
  });

  it('links to correct slug URL', () => {
    renderCard({ slug: 'my-villa' });
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/properties/my-villa')).toBe(true);
  });

  it('shows location', () => {
    renderCard();
    expect(screen.getByText(/Palm Jumeirah/)).toBeTruthy();
  });

  it('shows available status badge', () => {
    renderCard({ status: 'available' });
    expect(screen.getByText('Available')).toBeTruthy();
  });

  it('shows rented status badge', () => {
    renderCard({ status: 'rented' });
    expect(screen.getByText('Rented')).toBeTruthy();
  });

  it('hides bed/bath stats for commercial properties', () => {
    renderCard({ category: 'commercial', type: 'office' });
    expect(screen.queryByText(/Bed/)).toBeNull();
    expect(screen.queryByText(/Bath/)).toBeNull();
  });
});
