import { describe, expect, it } from 'vitest';
import { toPropertyWriteData, type PropertyWriteData } from '@/lib/queries/admin';

const editableProperty: PropertyWriteData = {
  slug: 'qa-admin-property', title: 'QA Admin Property', description: 'Safe test data',
  transaction_type: 'rent', category: 'residential', type: 'apartment',
  price: 5000, price_period: 'per month', currency: 'QAR',
  location: 'Doha', area: 'QA Area', lat: null, lng: null,
  bedrooms: 1, bathrooms: 1, area_sqft: 100, furnishing: 'furnished',
  status: 'available', featured: false, amenities: [], images: [],
  seo_title: null, seo_description: null,
  contact_phone: null, contact_email: null, contact_whatsapp: null,
};

describe('admin property write payload', () => {
  it('contains normal editable fields but never workflow or ownership fields', () => {
    const payload = toPropertyWriteData(editableProperty);

    expect(payload).toMatchObject({ title: 'QA Admin Property', price: 5000, images: [] });
    expect(payload).not.toHaveProperty('owner_id');
    expect(payload).not.toHaveProperty('listing_status');
    expect(payload).not.toHaveProperty('approved_by');
    expect(payload).not.toHaveProperty('approved_at');
    expect(payload).not.toHaveProperty('rejection_reason');
    expect(payload).not.toHaveProperty('published_at');
  });

  it('supports a no-image property payload', () => {
    expect(toPropertyWriteData(editableProperty).images).toEqual([]);
  });
});
