import { supabase } from './supabase';
import { sanitizeMediaFileName } from './propertyMedia';
import type { PropertyMediaType, StorageProvider } from './types';

export interface StoredPropertyMedia {
  provider: StorageProvider;
  bucket: string;
  path: string;
  playbackUrl: string;
}

export interface PropertyMediaStorageProvider {
  upload(input: { propertyId: string; file: File; mediaType: PropertyMediaType; onProgress?: (progress: number) => void }): Promise<StoredPropertyMedia>;
  delete(input: { bucket: string; path: string }): Promise<void>;
  getPlaybackUrl(input: { bucket: string; path: string }): Promise<string>;
}

const PROPERTY_MEDIA_BUCKET = 'property-media';
const STORAGE_URI_PREFIX = 'storage://';

function parseStorageReference(url: string): { bucket: string; path: string } | null {
  if (url.startsWith(STORAGE_URI_PREFIX)) {
    const [bucket, ...parts] = url.slice(STORAGE_URI_PREFIX.length).split('/');
    return bucket && parts.length ? { bucket, path: parts.join('/') } : null;
  }
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  return match ? { bucket: decodeURIComponent(match[1]), path: match[2] } : null;
}

/** Returns an expiring URL for a private Supabase object, or leaves external URLs untouched. */
export async function resolveStorageUrl(url: string): Promise<string> {
  const reference = parseStorageReference(url);
  if (!reference) return url;
  const { data, error } = await supabase.storage.from(reference.bucket).createSignedUrl(reference.path, 60 * 60);
  if (error || !data?.signedUrl) throw error ?? new Error('Unable to create a media URL');
  return data.signedUrl;
}

export class SupabasePropertyMediaStorageProvider implements PropertyMediaStorageProvider {
  async upload({ propertyId, file, mediaType, onProgress }: Parameters<PropertyMediaStorageProvider['upload']>[0]): Promise<StoredPropertyMedia> {
    const path = `properties/${propertyId}/${mediaType === 'video' ? 'videos' : 'images'}/${crypto.randomUUID()}-${sanitizeMediaFileName(file.name)}`;
    onProgress?.(5);
    const { error } = await supabase.storage.from(PROPERTY_MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    onProgress?.(100);
    return { provider: 'supabase', bucket: PROPERTY_MEDIA_BUCKET, path, playbackUrl: await this.getPlaybackUrl({ bucket: PROPERTY_MEDIA_BUCKET, path }) };
  }
  async delete({ bucket, path }: { bucket: string; path: string }) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }
  async getPlaybackUrl({ bucket, path }: { bucket: string; path: string }) {
    return resolveStorageUrl(`${STORAGE_URI_PREFIX}${bucket}/${path}`);
  }
}

export const propertyMediaStorage: PropertyMediaStorageProvider = new SupabasePropertyMediaStorageProvider();
export function getPropertyMediaUrl(bucket: string, path: string) {
  return propertyMediaStorage.getPlaybackUrl({ bucket, path });
}

export function getPublicPropertyMediaUrl(bucket: string, path: string) {
  return `${STORAGE_URI_PREFIX}${bucket}/${path}`;
}
// FirebasePropertyMediaStorageProvider can implement the same interface during the planned migration.
