import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { resolveStorageUrl } from '@/lib/propertyMediaStorage';

type StorageImageProps = ImgHTMLAttributes<HTMLImageElement> & { src: string };

/** Resolves private Supabase object references without exposing draft media publicly. */
export function StorageImage({ src, ...props }: StorageImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let active = true;
    void resolveStorageUrl(src)
      .then(url => { if (active) setResolvedSrc(url); })
      .catch(() => { if (active) setResolvedSrc(''); });
    return () => { active = false; };
  }, [src]);

  if (!resolvedSrc) return <div aria-hidden="true" className="h-full w-full bg-surface-container" />;
  return <img src={resolvedSrc} {...props} />;
}
