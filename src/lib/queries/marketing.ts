import { supabase } from '../supabase';
import type { Property, PropertyImage } from '../types';
import { uploadPropertyImage as adminUploadPropertyImage } from './admin';

export async function marketingSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function marketingSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchAllPropertiesForMedia(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, slug, title, location, area, category, images, listing_status, created_at')
    .eq('listing_status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function addPropertyImage(
  propertyId: string,
  propertySlug: string,
  file: File,
  currentImages: PropertyImage[]
): Promise<PropertyImage[]> {
  const url = await adminUploadPropertyImage(file, propertySlug);
  const newImage: PropertyImage = {
    url,
    alt: file.name,
    order: currentImages.length,
    is_primary: currentImages.length === 0,
  };
  const updatedImages = [...currentImages, newImage];
  const { error } = await supabase
    .from('properties')
    .update({ images: updatedImages, updated_at: new Date().toISOString() })
    .eq('id', propertyId);
  if (error) throw error;
  return updatedImages;
}

export async function removePropertyImage(
  propertyId: string,
  currentImages: PropertyImage[],
  indexToRemove: number
): Promise<PropertyImage[]> {
  const updated = currentImages.filter((_, i) => i !== indexToRemove);
  if (updated.length > 0 && !updated.some(i => i.is_primary)) {
    updated[0] = { ...updated[0], is_primary: true };
  }
  const { error } = await supabase
    .from('properties')
    .update({ images: updated, updated_at: new Date().toISOString() })
    .eq('id', propertyId);
  if (error) throw error;
  return updated;
}

export async function setPrimaryImage(
  propertyId: string,
  currentImages: PropertyImage[],
  primaryIndex: number
): Promise<PropertyImage[]> {
  const updated = currentImages.map((img, i) => ({ ...img, is_primary: i === primaryIndex }));
  const { error } = await supabase
    .from('properties')
    .update({ images: updated, updated_at: new Date().toISOString() })
    .eq('id', propertyId);
  if (error) throw error;
  return updated;
}

export async function reorderPropertyImages(
  propertyId: string,
  images: PropertyImage[]
): Promise<void> {
  const reordered = images.map((img, i) => ({ ...img, order: i }));
  const { error } = await supabase
    .from('properties')
    .update({ images: reordered, updated_at: new Date().toISOString() })
    .eq('id', propertyId);
  if (error) throw error;
}

// ── Property management ───────────────────────────────

export async function fetchAllPropertiesMarketing(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function fetchMarketingPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Property;
}

export async function createMarketingProperty(
  data: Omit<Property, 'id' | 'created_at' | 'updated_at'>,
  _userId: string
): Promise<Property> {
  void _userId;
  const { data: result, error } = await supabase
    .from('properties')
    .insert({ ...data, listing_status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function updateMarketingProperty(
  id: string,
  data: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export { adminUploadPropertyImage as uploadMarketingPropertyImage };
