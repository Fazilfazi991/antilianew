import { describe, expect, it } from 'vitest';
import { sanitizeMediaFileName, validatePropertyVideo } from '@/lib/propertyMedia';

describe('property video validation', () => {
  it('accepts supported video containers with matching MIME types', () => {
    const file = new File(['video'], 'living-room-tour.mp4', { type: 'video/mp4' });
    expect(validatePropertyVideo(file)).toBeNull();
  });

  it('rejects unsupported formats and mismatched MIME types', () => {
    expect(validatePropertyVideo(new File(['x'], 'tour.avi', { type: 'video/x-msvideo' }))).toContain('Unsupported');
    expect(validatePropertyVideo(new File(['x'], 'tour.mp4', { type: 'application/octet-stream' }))).toContain('Unsupported');
  });

  it('builds safe collision-resistant filename suffixes', () => {
    expect(sanitizeMediaFileName('../../Antilia Tour (Final).MP4')).toBe('antilia-tour-final.mp4');
  });
});
