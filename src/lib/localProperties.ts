import type { Property } from './types';

export const LOCAL_PROPERTIES: Property[] = [
  {
    id: '8ef40e43-4a72-4cc7-b4ed-6d4e4cf7a9c0',
    slug: 'premium-furnished-2bhk-matar-qadeem',
    title: 'Premium Furnished 2BHK Apartment',
    description: 'Premium fully furnished two-bedroom apartment for rent in Matar Qadeem, Old Airport Area. Includes large closets, a kitchen, bathroom, central air conditioning, elevator access, and a rooftop pool. Water and electricity are included. Internet is not included. Available on an annual contract with one month free. Monthly variants: QAR 6,900, QAR 7,000, and QAR 7,300.',
    category: 'rent',
    type: 'apartment',
    price: 6900,
    price_period: 'per month',
    currency: 'QAR',
    location: 'Old Airport Area, Doha, Qatar',
    area: 'Matar Qadeem',
    lat: null,
    lng: null,
    bedrooms: 2,
    bathrooms: 1,
    area_sqft: 0,
    furnishing: 'furnished',
    status: 'available',
    featured: true,
    amenities: [
      'Fully furnished',
      'Two bedrooms',
      'Large closets',
      'Kitchen',
      'Bathroom',
      'Central AC',
      'Elevator',
      'Rooftop pool',
      'Water and electricity included',
      'Annual contract with one month free',
    ],
    images: [
      { url: '/Properties/property%201/WhatsApp%20Image%202026-07-22%20at%209.33.18%20PM.jpeg', alt: 'Premium furnished 2BHK apartment interior', order: 0, is_primary: true },
      { url: '/Properties/property%201/WhatsApp%20Image%202026-07-22%20at%209.33.19%20PM.jpeg', alt: 'Premium furnished 2BHK apartment living area', order: 1, is_primary: false },
      { url: '/Properties/property%201/WhatsApp%20Image%202026-07-22%20at%209.33.20%20PM.jpeg', alt: 'Premium furnished 2BHK apartment bedroom', order: 2, is_primary: false },
      { url: '/Properties/property%201/WhatsApp%20Image%202026-07-22%20at%209.33.21%20PM.jpeg', alt: 'Premium furnished 2BHK apartment kitchen', order: 3, is_primary: false },
      { url: '/Properties/property%201/WhatsApp%20Image%202026-07-22%20at%209.33.22%20PM.jpeg', alt: 'Premium furnished 2BHK apartment amenity', order: 4, is_primary: false },
    ],
    seo_title: 'Premium Furnished 2BHK Apartment for Rent in Matar Qadeem',
    seo_description: 'Fully furnished 2BHK apartment in Matar Qadeem with central AC, rooftop pool, and one month free on an annual contract.',
    owner_id: null,
    listing_status: 'approved',
    rejection_reason: null,
    contact_phone: null,
    contact_email: null,
    contact_whatsapp: null,
    created_at: '2026-07-22T21:00:00.000Z',
    updated_at: '2026-07-22T21:00:00.000Z',
  },
];

export function mergeLocalProperties(properties: Property[]): Property[] {
  const databaseSlugs = new Set(properties.map((property) => property.slug));
  return [...LOCAL_PROPERTIES.filter((property) => !databaseSlugs.has(property.slug)), ...properties];
}
