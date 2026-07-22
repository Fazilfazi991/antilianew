import { useEffect, useState, useRef } from 'react';
import { Loader2, Upload, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import {
  fetchAllPropertiesForMedia,
  addPropertyImage,
  removePropertyImage,
  setPrimaryImage,
} from '@/lib/queries/marketing';
import type { Property, PropertyImage } from '@/lib/types';

export function MarketingMediaPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchAllPropertiesForMedia()
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function updatePropertyImages(id: string, images: PropertyImage[]) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, images } : p));
  }

  function setPropertyError(id: string, msg: string) {
    setError(prev => ({ ...prev, [id]: msg }));
  }

  async function handleUpload(property: Property, files: FileList | null) {
    if (!files?.length) return;
    setUploading(property.id);
    setPropertyError(property.id, '');
    try {
      let currentImages = [...property.images];
      for (const file of Array.from(files)) {
        currentImages = await addPropertyImage(property.id, property.slug, file, currentImages);
      }
      updatePropertyImages(property.id, currentImages);
    } catch (e: unknown) {
      setPropertyError(property.id, e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(property: Property, index: number) {
    if (!window.confirm('Remove this image?')) return;
    setRemoving(`${property.id}-${index}`);
    try {
      const updated = await removePropertyImage(property.id, property.images, index);
      updatePropertyImages(property.id, updated);
    } catch (e: unknown) {
      setPropertyError(property.id, e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setRemoving(null);
    }
  }

  async function handleSetPrimary(property: Property, index: number) {
    try {
      const updated = await setPrimaryImage(property.id, property.images, index);
      updatePropertyImages(property.id, updated);
    } catch (e: unknown) {
      setPropertyError(property.id, e instanceof Error ? e.message : 'Update failed');
    }
  }

  const coverageColor = (count: number) => {
    if (count === 0) return 'text-red-500';
    if (count < 4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl">
      <div className="mb-12 pb-6 border-b border-surface-variant">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-2">
          {loading ? '…' : `${properties.length} live properties`}
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">Media Manager</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && properties.length === 0 && (
        <div className="text-center py-20 border border-surface-variant">
          <p className="font-body-md text-body-md text-on-surface-variant">
            No approved properties found.
          </p>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div className="space-y-3">
          {properties.map(p => {
            const isExpanded = expanded === p.id;
            const isUploading = uploading === p.id;
            const err = error[p.id];

            return (
              <div key={p.id} className="border border-surface-variant overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-container-low transition-colors"
                >
                  {p.images[0] ? (
                    <img
                      src={p.images.find(i => i.is_primary)?.url ?? p.images[0].url}
                      alt=""
                      className="w-16 h-12 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-surface-variant shrink-0 flex items-center justify-center">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.04em] text-xs">No img</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-primary truncate">{p.title}</p>
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em]">
                      {p.area}, {p.location} · {p.category}
                    </p>
                  </div>
                  <span className={`font-label-caps text-label-caps uppercase tracking-[0.08em] shrink-0 ${coverageColor(p.images.length)}`}>
                    {p.images.length} image{p.images.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? <ChevronUp className="size-4 text-outline shrink-0" /> : <ChevronDown className="size-4 text-outline shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-surface-variant p-5 bg-surface-container-low space-y-4">
                    {err && (
                      <p className="font-body-md text-body-md text-error">{err}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => fileRefs.current[p.id]?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-outline-variant hover:border-primary font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-[0.08em] transition-colors disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                        {isUploading ? 'Uploading…' : 'Upload Images'}
                      </button>
                      <input
                        ref={el => { fileRefs.current[p.id] = el; }}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => handleUpload(p, e.target.files)}
                      />
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.06em] text-xs">
                        Recommended: at least 4 images, 1200×800px or larger
                      </span>
                    </div>

                    {p.images.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {p.images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={img.url}
                              alt={img.alt}
                              className={`w-full aspect-square object-cover border-2 transition-colors ${img.is_primary ? 'border-primary' : 'border-transparent'}`}
                            />
                            {img.is_primary && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-on-primary font-label-caps uppercase tracking-[0.04em] text-[9px]">
                                Primary
                              </span>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                              {!img.is_primary && (
                                <button
                                  onClick={() => handleSetPrimary(p, i)}
                                  className="p-1.5 bg-background text-on-surface-variant hover:text-primary transition-colors"
                                  title="Set as primary"
                                >
                                  <Star className="size-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemove(p, i)}
                                disabled={removing === `${p.id}-${i}`}
                                className="p-1.5 bg-background text-on-surface-variant hover:text-error transition-colors disabled:opacity-30"
                                title="Remove image"
                              >
                                {removing === `${p.id}-${i}` ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        No images yet. Upload at least 4 high-quality images.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
