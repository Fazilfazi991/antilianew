export type TransactionType = 'buy' | 'rent';
export type PropertyCategory = 'residential' | 'commercial' | 'industrial';
export type LegacyPropertyCategory = TransactionType | 'commercial';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'studio'
  | 'penthouse'
  | 'duplex'
  | 'compound'
  | 'shop'
  | 'office'
  | 'warehouse'
  | 'residential-land'
  | 'showroom'
  | 'business-centre'
  | 'restaurant-space'
  | 'commercial-building'
  | 'commercial-land'
  | 'factory'
  | 'workshop'
  | 'labour-accommodation'
  | 'industrial-land'
  | 'logistics-facility'
  | 'cold-storage';

export type Furnishing = 'furnished' | 'unfurnished' | 'semi-furnished';

export type PropertySegment = 'residential' | 'commercial' | 'industrial';

export type PropertyStatus = 'available' | 'rented' | 'sold';

export type ListingStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'published' | 'rejected' | 'unpublished';

export interface PropertyImage {
  url: string;
  alt: string;
  order: number;
  is_primary: boolean;
}

export type PropertyMediaType = 'image' | 'video';
export type StorageProvider = 'supabase' | 'firebase';

export interface PropertyMedia {
  id: string;
  property_id: string;
  media_type: PropertyMediaType;
  storage_provider: StorageProvider;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  sort_order: number;
  is_primary: boolean;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Optional only while pre-taxonomy records are still being read. New writes must include it. */
  transaction_type?: TransactionType;
  category: PropertyCategory | LegacyPropertyCategory;
  type: PropertyType;
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  lat: number | null;
  lng: number | null;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Furnishing;
  status: PropertyStatus;
  featured: boolean;
  amenities: string[];
  images: PropertyImage[];
  /** Unified media records. Legacy images remain in `images` while media migration is gradual. */
  media?: PropertyMedia[];
  seo_title: string | null;
  seo_description: string | null;
  owner_id: string | null;
  listing_status: ListingStatus;
  rejection_reason: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileRole = 'admin' | 'broker' | 'staff';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Profile {
  id: string;
  full_name: string;
  role: ProfileRole;
  phone: string | null;
  whatsapp: string | null;
  position: string | null;
  bio: string | null;
  approved: boolean;
  account_status: AccountStatus;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  created_at: string;
}


export interface Inquiry {
  id: string;
  type: 'tenant' | 'landlord' | 'general' | 'property';
  property_id: string | null;
  name: string;
  phone: string;
  email: string;
  message: string;
  budget: string | null;
  preferred_location: string | null;
  status: 'new' | 'contacted' | 'closed';
  notes: string | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export interface PropertyFilters {
  transactionType: TransactionType | 'all';
  category: PropertyCategory | '';
  type: PropertyType | '';
  location: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  bathrooms: string;
  areaMin: string;
  areaMax: string;
  furnishing: Furnishing | '';
  sort: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  page: string;
}

export const DEFAULT_FILTERS: PropertyFilters = {
  transactionType: 'all',
  category: '',
  type: '',
  location: '',
  priceMin: '',
  priceMax: '',
  bedrooms: '',
  bathrooms: '',
  areaMin: '',
  areaMax: '',
  furnishing: '',
  sort: 'newest',
  page: '1',
};
