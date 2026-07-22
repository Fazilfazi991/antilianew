import { supabase } from '../supabase';
import { LOCAL_PROPERTIES, mergeLocalProperties } from '../localProperties';
import type { Property } from '../types';

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('listing_status', 'approved')
    .order('created_at', { ascending: false });
  if (error) return LOCAL_PROPERTIES;
  return mergeLocalProperties((data ?? []) as Property[]);
}

export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const localProperty = LOCAL_PROPERTIES.find((property) => property.slug === slug);
  if (localProperty) return localProperty;

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .eq('listing_status', 'approved')
    .single();
  if (error) return null;
  return data as Property;
}

export async function fetchFeaturedProperties(limit = 6): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('listing_status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) return LOCAL_PROPERTIES.filter((property) => property.featured).slice(0, limit);
  return mergeLocalProperties((data ?? []) as Property[])
    .filter((property) => property.featured)
    .slice(0, limit);
}
