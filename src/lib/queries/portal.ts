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
  transaction_type: NonNullable<Property['transaction_type']>;
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
  _userId: string
): Promise<Property> {
  void _userId;
  const slug = slugify(data.title) + '-' + Math.random().toString(36).slice(2, 6);
  const { data: result, error } = await supabase
    .from('properties')
    .insert({
      ...data,
      slug,
      // Ownership and initial draft state are enforced by the database trigger.
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
  await submitListing((result as Property).id);
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  await submitListing(id);
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
    .eq('listing_status', 'pending_review')
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
  if (contacts && Object.keys(contacts).length) {
    const { error } = await supabase.from('properties').update(contacts).eq('id', id);
    if (error) throw error;
  }
  const { error } = await supabase.rpc('admin_transition_listing', { p_property_id: id, p_action: 'approve', p_reason: null });
  if (error) throw error;
  const { error: publishError } = await supabase.rpc('admin_transition_listing', { p_property_id: id, p_action: 'publish', p_reason: null });
  if (publishError) throw publishError;
}

export async function rejectListing(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_transition_listing', { p_property_id: id, p_action: 'reject', p_reason: reason || null });
  if (error) throw error;
}

export async function submitListing(id: string): Promise<void> {
  const { error } = await supabase.rpc('submit_listing', { p_property_id: id });
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
    pending: rows.filter(r => r.listing_status === 'pending_review').length,
    approved: rows.filter(r => r.listing_status === 'published').length,
    rejected: rows.filter(r => r.listing_status === 'rejected').length,
  };
}
