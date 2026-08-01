import { supabase } from '../supabase';
import type { Property, Profile, ProfileRole, SiteSetting, City } from '../types';
import type { PropertyMedia } from '../types';
import { propertyMediaStorage } from '../propertyMediaStorage';

export async function adminSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function adminSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function createProperty(
  data: Omit<Property, 'id' | 'created_at' | 'updated_at'>
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function updateProperty(
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

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function toggleStatus(
  id: string,
  status: 'available' | 'rented' | 'sold'
): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── User role management ──────────────────────────────

export async function fetchUsersByRole(role: ProfileRole): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setUserRole(userId: string, role: ProfileRole): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  if (error) throw error;
}

export async function fetchPendingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('listing_status', 'pending');
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ── Site settings ─────────────────────────────────────

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');
  if (error) throw error;
  const settings: Record<string, string> = {};
  (data as SiteSetting[]).forEach(s => { settings[s.key] = s.value; });
  return settings;
}

export async function upsertSiteSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

// ── Cities management ─────────────────────────────────

export async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as City[];
}

export async function addCity(name: string): Promise<void> {
  const { error } = await supabase.from('cities').insert({ name });
  if (error) throw error;
}

export async function deleteCity(id: string): Promise<void> {
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw error;
}

// ── Marketing account creation (via Edge Function) ────

export async function createMarketingAccount(
  fullName: string,
  email: string,
  password: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-marketing-user`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ full_name: fullName, email, password }),
  });

  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to create account');
}

// ── Portal user approval ──────────────────────────────

export async function fetchPendingPortalUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function approvePortalUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('id', userId);
  if (error) throw error;
}

// ── Image upload ──────────────────────────────────────

export async function uploadPropertyImage(
  file: File,
  propertySlug: string
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `properties/${propertySlug}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('property-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('property-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPropertyVideo(propertyId: string, file: File, onProgress?: (progress: number) => void): Promise<PropertyMedia> {
  const stored = await propertyMediaStorage.upload({ propertyId, file, mediaType: 'video', onProgress });
  const { data, error } = await supabase.from('property_media').insert({
    property_id: propertyId, media_type: 'video', storage_provider: stored.provider, storage_bucket: stored.bucket,
    storage_path: stored.path, mime_type: file.type, file_name: file.name, file_size: file.size,
  }).select().single();
  if (error) {
    await propertyMediaStorage.delete({ bucket: stored.bucket, path: stored.path }).catch(() => undefined);
    throw error;
  }
  return data as PropertyMedia;
}

export async function fetchPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
  const { data, error } = await supabase.from('property_media').select('*').eq('property_id', propertyId).order('sort_order');
  if (error) throw error;
  return (data ?? []) as PropertyMedia[];
}

export async function deletePropertyMedia(media: PropertyMedia): Promise<void> {
  const { error } = await supabase.from('property_media').delete().eq('id', media.id);
  if (error) throw error;
  try { await propertyMediaStorage.delete({ bucket: media.storage_bucket, path: media.storage_path }); }
  catch (storageError) {
    // Restore metadata so the object remains manageable rather than silently orphaning it.
    await supabase.from('property_media').insert(media);
    throw storageError;
  }
}
