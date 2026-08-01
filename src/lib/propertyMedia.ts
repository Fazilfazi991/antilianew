export const PROPERTY_MEDIA_LIMITS = {
  maxVideos: 5,
  maxVideoBytes: 250 * 1024 * 1024,
} as const;

export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm'] as const;
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'] as const;

export function validatePropertyVideo(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !VIDEO_EXTENSIONS.includes(extension as typeof VIDEO_EXTENSIONS[number]) || !VIDEO_MIME_TYPES.includes(file.type as typeof VIDEO_MIME_TYPES[number])) {
    return 'Unsupported video format. Upload MP4, MOV, M4V or WebM.';
  }
  if (file.size > PROPERTY_MEDIA_LIMITS.maxVideoBytes) return 'Video exceeds the 250 MB maximum size.';
  return null;
}

export function sanitizeMediaFileName(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase() ?? 'mp4';
  const base = name.slice(0, Math.max(0, name.length - extension.length - 1)).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'video';
  return `${base}.${extension}`;
}

export function formatMediaSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
}
