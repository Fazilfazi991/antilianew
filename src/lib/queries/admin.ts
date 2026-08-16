import { supabase } from '../supabase';
import type { Property, Profile, ProfileRole, SiteSetting, City } from '../types';
import type { PropertyMedia } from '../types';
import { propertyMediaStorage, type StoredPropertyMedia } from '../propertyMediaStorage';

export type PropertyWriteData = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'media'>;
export type MediaOperationStage = 'validating' | 'uploading' | 'saving-media' | 'saving-property' | 'complete' | 'failed';

export class PropertyVideoMetadataError extends Error {
  readonly stage = 'saving-media' as const;
  readonly stored: StoredPropertyMedia;
  readonly file: File;
  override readonly cause: unknown;
  constructor(stored: StoredPropertyMedia, file: File, cause: unknown) {
    super('Could not save video details. Please retry.');
    this.name = 'PropertyVideoMetadataError';
    this.stored = stored;
    this.file = file;
    this.cause = cause;
  }
}

function toPropertyWriteData(data: PropertyWriteData): PropertyWriteData {
  // Runtime guard: relation fields returned by Supabase must never be PATCHed to properties.
  const property = { ...(data as PropertyWriteData & { media?: unknown; property_media?: unknown }) };
  delete property.media;
  delete property.property_media;
  return property as PropertyWriteData;
}

export async function adminSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user.email || !(await isAdminEmail(data.user.email))) {
    await supabase.auth.signOut();
    throw new Error('This account does not have Antilia admin or staff access.');
  }
  return data;
}

export async function isAdminEmail(_email: string): Promise<boolean> {
  void _email;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.from('profiles').select('role, account_status').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin' && data.account_status === 'approved';
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
  data: PropertyWriteData
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .insert(toPropertyWriteData(data))
    .select()
    .single();
  if (error) throw error;
  return result as Property;
}

export async function updateProperty(
  id: string,
  data: Partial<PropertyWriteData>
): Promise<Property> {
  const { data: result, error } = await supabase
    .from('properties')
    .update({ ...toPropertyWriteData(data as PropertyWriteData), updated_at: new Date().toISOString() })
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

export type AccountModerationEvent = {
  id: string;
  user_id: string;
  action: 'approved' | 'rejected' | 'suspended' | 'role_changed';
  actor_id: string | null;
  previous_role: ProfileRole | null;
  new_role: ProfileRole | null;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  created_at: string;
};

export async function moderateAccount(
  userId: string,
  accountStatus: 'approved' | 'rejected' | 'suspended' | 'pending',
  reason: string,
): Promise<void> {
  if (!reason.trim()) throw new Error('A moderation reason is required.');
  const { error } = await supabase.rpc('admin_moderate_account', {
    p_user_id: userId,
    p_role: null,
    p_account_status: accountStatus,
    p_reason: reason.trim(),
  });
  if (error) throw error;
}

export async function fetchAccountModerationEvents(userId: string): Promise<AccountModerationEvent[]> {
  const { data, error } = await supabase
    .from('account_moderation_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AccountModerationEvent[];
}

export async function fetchPendingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('listing_status', 'pending_review');
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
    .eq('role', 'broker')
    .eq('account_status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ── Image upload ──────────────────────────────────────

export async function uploadPropertyImage(
  file: File,
  propertySlug: string
): Promise<string> {
  const ext = file.name.split('.').pop();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const path = `broker/${user.id}/properties/${propertySlug}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('property-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return `storage://property-images/${path}`;
}

export async function savePropertyVideoMetadata(propertyId: string, file: File, stored: StoredPropertyMedia): Promise<PropertyMedia> {
  const { data, error } = await supabase.from('property_media').insert({
    property_id: propertyId, media_type: 'video', storage_provider: stored.provider, storage_bucket: stored.bucket,
    storage_path: stored.path, mime_type: file.type, file_name: file.name, file_size: file.size,
  }).select().single();
  if (error) throw error;
  return data as PropertyMedia;
}

export async function uploadPropertyVideo(propertyId: string, file: File, onProgress?: (progress: number) => void): Promise<PropertyMedia> {
  const stored = await propertyMediaStorage.upload({ propertyId, file, mediaType: 'video', onProgress });
  try {
    return await savePropertyVideoMetadata(propertyId, file, stored);
  } catch (error) {
    // Keep the successfully uploaded object only long enough to retry metadata without a second large upload.
    console.error('Property video save failed', { stage: 'saving-media', error });
    throw new PropertyVideoMetadataError(stored, file, error);
  }
}

export async function retryPropertyVideoMetadata(propertyId: string, file: File, stored: StoredPropertyMedia): Promise<PropertyMedia> {
  try {
    return await savePropertyVideoMetadata(propertyId, file, stored);
  } catch (error) {
    console.error('Property video save failed', { stage: 'saving-media', error });
    throw error;
  }
}

export async function cleanupUnlinkedPropertyVideo(stored: StoredPropertyMedia): Promise<void> {
  await propertyMediaStorage.delete({ bucket: stored.bucket, path: stored.path });
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
