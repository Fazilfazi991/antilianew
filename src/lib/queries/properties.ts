import { supabase } from '../supabase';
import { LOCAL_PROPERTIES, mergeLocalProperties } from '../localProperties';
import type { Property } from '../types';

// Client requested this record to stay in the catalogue but not appear in the homepage collection.
export const HOMEPAGE_EXCLUDED_PROPERTY = {
  id: '8ef40e43-4a72-4cc7-b4ed-6d4e4cf7a9c0',
  slug: 'premium-furnished-2bhk-matar-qadeem',
} as const;

export function isHomepageExcludedProperty(property: Pick<Property, 'id' | 'slug'>) {
  return property.id === HOMEPAGE_EXCLUDED_PROPERTY.id || property.slug === HOMEPAGE_EXCLUDED_PROPERTY.slug;
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*)')
    .eq('listing_status', 'approved')
    .order('created_at', { ascending: false });
  if (error) return LOCAL_PROPERTIES;
  return mergeLocalProperties((data ?? []).map(({ property_media, ...property }) => ({ ...property, media: property_media ?? [] })) as Property[]);
}

export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const localProperty = LOCAL_PROPERTIES.find((property) => property.slug === slug);
  if (localProperty) return localProperty;

  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*)')
    .eq('slug', slug)
    .eq('listing_status', 'approved')
    .single();
  if (error) return null;
  const { property_media, ...property } = data;
  return { ...property, media: property_media ?? [] } as Property;
}

export async function fetchFeaturedProperties(limit = 6): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('listing_status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) return LOCAL_PROPERTIES.filter((property) => property.featured && !isHomepageExcludedProperty(property)).slice(0, limit);
  return mergeLocalProperties((data ?? []) as Property[])
    .filter((property) => property.featured && !isHomepageExcludedProperty(property))
    .slice(0, limit);
}
