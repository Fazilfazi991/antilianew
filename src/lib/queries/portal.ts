import { supabase } from '../supabase';
import type { Property, Profile, PropertyImage, ListingStatus } from '../types';
import { slugify } from '../utils';
export { uploadPropertyImage } from './admin';

// ── Auth ──────────────────────────────────────────────

export async function portalSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function portalSignUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function portalSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Profile ───────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

// ── User listings ─────────────────────────────────────

export async function fetchMyListings(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function fetchMyListingById(id: string, userId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();
  if (error) return null;
  return data as Property;
}

// ── Create / update / delete ──────────────────────────

type PortalFormData = {
  title: string;
  description: string;
  category: Property['category'];
  type: Property['type'];
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Property['furnishing'];
  amenities: string[];
  images: PropertyImage[];
};

export async function createPortalListing(
  data: PortalFormData,
  userId: string
): Promise<Property> {
  const slug = slugify(data.title) + '-' + Math.random().toString(36).slice(2, 6);
  const { data: result, error } = await supabase
    .from('properties')
    .insert({
      ...data,
      slug,
      owner_id: userId,
      listing_status: 'pending',
      featured: false,
      status: 'available',
      lat: null,
      lng: null,
      seo_title: null,
      seo_description: null,
    })
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function updatePortalListing(
  id: string,
  data: Partial<PortalFormData>
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .update({
      ...data,
      listing_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function deletePortalListing(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

// ── Admin: pending queue ──────────────────────────────

export async function fetchPendingListings(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('listing_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export type ContactOverrides = {
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
};

export async function approveListing(id: string, contacts?: ContactOverrides): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({
      listing_status: 'approved',
      rejection_reason: null,
      updated_at: new Date().toISOString(),
      ...(contacts ?? {}),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectListing(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ listing_status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── Listing counts for dashboard ─────────────────────

export async function fetchMyListingCounts(userId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const { data, error } = await supabase
    .from('properties')
    .select('listing_status')
    .eq('owner_id', userId);
  if (error) throw error;
  const rows = (data ?? []) as { listing_status: ListingStatus }[];
  return {
    total: rows.length,
    pending: rows.filter(r => r.listing_status === 'pending').length,
    approved: rows.filter(r => r.listing_status === 'approved').length,
    rejected: rows.filter(r => r.listing_status === 'rejected').length,
  };
}
