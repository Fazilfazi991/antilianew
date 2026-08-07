import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Star, Video, Trash2 } from 'lucide-react';
import { cleanupUnlinkedPropertyVideo, createProperty, deletePropertyMedia, fetchPropertyMedia, PropertyVideoMetadataError, retryPropertyVideoMetadata, updateProperty, uploadPropertyImage, uploadPropertyVideo, type MediaOperationStage, type PropertyWriteData } from '@/lib/queries/admin';
import { fetchProperties } from '@/lib/queries/properties';
import { slugify } from '@/lib/utils';
import { useCities } from '@/hooks/useCities';
import { PROPERTY_CATEGORIES, PROPERTY_TYPES_BY_CATEGORY, TRANSACTION_TYPES } from '@/lib/propertyTaxonomy';
import type { PropertyCategory, PropertyType, Furnishing, PropertyStatus, PropertyImage, PropertyMedia, TransactionType } from '@/lib/types';
import { formatMediaSize, PROPERTY_MEDIA_LIMITS, validatePropertyVideo } from '@/lib/propertyMedia';
import { getPublicPropertyMediaUrl, type StoredPropertyMedia } from '@/lib/propertyMediaStorage';

type FormData = PropertyWriteData;
type RetryableVideo = { file: File; stored: StoredPropertyMedia };

const EMPTY: FormData = {
  slug: '',
  title: '',
  description: '',
  transaction_type: 'buy',
  category: 'residential',
  type: 'apartment',
  price: 0,
  price_period: 'per year',
  currency: 'QAR',
  location: 'Doha',
  area: '',
  lat: null,
  lng: null,
  bedrooms: 1,
  bathrooms: 1,
  area_sqft: 0,
  furnishing: 'unfurnished',
  status: 'available',
  featured: false,
  amenities: [],
  images: [],
  seo_title: null,
  seo_description: null,
  owner_id: null,
  listing_status: 'approved',
  rejection_reason: null,
  contact_phone: null,
  contact_email: null,
  contact_whatsapp: null,
};

const inputClass =
  'w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary placeholder:text-outline-variant transition-colors duration-300';
const selectClass =
  'w-full bg-background border-0 border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none pb-2.5 font-body-md text-body-md text-primary appearance-none cursor-pointer transition-colors duration-300';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-label-caps text-label-caps text-outline uppercase tracking-[0.1em] mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-surface-variant p-6 space-y-5">
      <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] pb-4 border-b border-surface-variant">
        {title}
      </p>
      {children}
    </section>
  );
}

export function AdminPropertyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { cities } = useCities();

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoMedia, setVideoMedia] = useState<PropertyMedia[]>([]);
  const [queuedVideos, setQueuedVideos] = useState<File[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [mediaStage, setMediaStage] = useState<MediaOperationStage | null>(null);
  const [retryableVideos, setRetryableVideos] = useState<Record<string, RetryableVideo>>({});
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    Promise.all([fetchProperties(), fetchPropertyMedia(id)]).then(([list, media]) => {
      const found = list.find(p => p.id === id);
      if (found) {
        const editable = { ...found } as Partial<PropertyWriteData> & { id?: string; created_at?: string; updated_at?: string; media?: unknown; property_media?: unknown };
        delete editable.id;
        delete editable.created_at;
        delete editable.updated_at;
        delete editable.media;
        delete editable.property_media;
        setForm(editable as PropertyWriteData);
      }
      setVideoMedia(media.filter(item => item.media_type === 'video'));
      setLoading(false);
    });
  }, [id, isEdit]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !isEdit) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function setCategory(category: PropertyCategory) {
    setForm(prev => ({ ...prev, category, type: PROPERTY_TYPES_BY_CATEGORY[category][0] }));
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    if (!form.slug) {
      setError('Enter a title first so we can name the image folder.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded: PropertyImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPropertyImage(file, form.slug);
        uploaded.push({ url, alt: form.title || file.name, order: form.images.length + uploaded.length, is_primary: false });
      }
      setForm(prev => {
        const newImages = [...prev.images, ...uploaded];
        if (newImages.length > 0 && !newImages.some(i => i.is_primary)) {
          newImages[0] = { ...newImages[0], is_primary: true };
        }
        return { ...prev, images: newImages };
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm(prev => {
      const next = prev.images.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(i => i.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return { ...prev, images: next };
    });
  }

  function queueVideos(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    const errors = selected.map(validatePropertyVideo).filter(Boolean);
    if (errors.length) { setError(errors[0] ?? 'Invalid video'); return; }
    if (videoMedia.length + queuedVideos.length + selected.length > PROPERTY_MEDIA_LIMITS.maxVideos) {
      setError(`A property can have up to ${PROPERTY_MEDIA_LIMITS.maxVideos} videos.`); return;
    }
    setQueuedVideos(prev => [...prev, ...selected]);
    setMediaStage('validating');
    setError('');
  }

  const videoKey = (file: File) => `${file.name}-${file.lastModified}`;

  async function discardRetryableVideo(file: File) {
    const key = videoKey(file);
    const retry = retryableVideos[key];
    if (retry) {
      try { await cleanupUnlinkedPropertyVideo(retry.stored); }
      catch (storageError) { console.error('Property video cleanup failed', { stage: 'failed', error: storageError }); }
      setRetryableVideos(previous => { const next = { ...previous }; delete next[key]; return next; });
    }
    setQueuedVideos(previous => previous.filter(item => videoKey(item) !== key));
  }

  async function removeVideo(media: PropertyMedia) {
    if (!window.confirm(`Remove ${media.file_name ?? 'this video'}?`)) return;
    try { await deletePropertyMedia(media); setVideoMedia(prev => prev.filter(item => item.id !== media.id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Video removal failed. Please retry.'); }
  }

  async function uploadQueuedVideos(propertyId: string) {
    if (!queuedVideos.length) return;
    setUploadingVideos(true);
    const uploaded: PropertyMedia[] = [];
    try {
      for (const file of queuedVideos) {
        const key = videoKey(file);
        if (retryableVideos[key]) continue;
        setMediaStage('uploading');
        try {
          uploaded.push(await uploadPropertyVideo(propertyId, file, progress => { setVideoProgress(prev => ({ ...prev, [key]: progress })); if (progress === 100) setMediaStage('saving-media'); }));
        } catch (error) {
          if (error instanceof PropertyVideoMetadataError) {
            setRetryableVideos(previous => ({ ...previous, [key]: { file, stored: error.stored } }));
          }
          console.error('Property video save failed', { stage: error instanceof PropertyVideoMetadataError ? error.stage : 'uploading', error });
          setMediaStage('failed');
          throw error;
        }
      }
      setVideoMedia(prev => [...prev, ...uploaded]);
      setQueuedVideos(previous => previous.filter(file => !uploaded.some(media => media.file_name === file.name)));
      setMediaStage('complete');
    } finally { setUploadingVideos(false); }
  }

  async function retryVideoMetadata(file: File) {
    const key = videoKey(file);
    const retry = retryableVideos[key];
    const propertyId = id ?? createdPropertyId;
    if (!retry || !propertyId) return;
    setUploadingVideos(true);
    setMediaStage('saving-media');
    setError('');
    try {
      const media = await retryPropertyVideoMetadata(propertyId, retry.file, retry.stored);
      setVideoMedia(previous => [...previous, media]);
      setQueuedVideos(previous => previous.filter(item => videoKey(item) !== key));
      setRetryableVideos(previous => { const next = { ...previous }; delete next[key]; return next; });
      setMediaStage('complete');
    } catch (error) {
      console.error('Property video save failed', { stage: 'saving-media', error });
      setMediaStage('failed');
      setError('Could not save video details. Please retry.');
    } finally { setUploadingVideos(false); }
  }

  function setPrimary(index: number) {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_primary: i === index })),
    }));
  }

  function addAmenity() {
    const trimmed = amenityInput.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      set('amenities', [...form.amenities, trimmed]);
    }
    setAmenityInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const propertyId = id ?? createdPropertyId;
      setMediaStage('saving-property');
      if (propertyId) {
        await updateProperty(propertyId, form);
        await uploadQueuedVideos(propertyId);
      } else {
        const property = await createProperty(form);
        setCreatedPropertyId(property.id);
        await uploadQueuedVideos(property.id);
      }
      navigate('/admin/properties');
    } catch (e: unknown) {
      console.error('Property video save failed', { stage: mediaStage ?? 'saving-property', error: e });
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-5 mb-12 pb-6 border-b border-surface-variant">
        <Link
          to="/admin/properties"
          className="flex items-center justify-center w-9 h-9 border border-surface-variant hover:border-primary transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-on-surface-variant" />
        </Link>
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.15em] mb-1">
            {isEdit ? 'Edit' : 'New'}
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            {isEdit ? 'Edit Property' : 'New Property'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Section title="Basic Info">
          <Field label="Title *">
            <input
              className={inputClass}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              placeholder="e.g. Modern Apartment in The Pearl, Doha"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Slug (auto-generated)">
              <input
                className={inputClass}
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                required
                placeholder="my-property-slug"
              />
            </Field>
            <Field label="Transaction Type *">
              <select className={selectClass} required value={form.transaction_type} onChange={e => set('transaction_type', e.target.value as TransactionType)}>
                {TRANSACTION_TYPES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Property Category *">
              <select className={selectClass} required value={form.category} onChange={e => setCategory(e.target.value as PropertyCategory)}>
                {PROPERTY_CATEGORIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Property Type *">
              <select className={selectClass} value={form.type} onChange={e => set('type', e.target.value as PropertyType)}>
                {PROPERTY_TYPES_BY_CATEGORY[form.category as PropertyCategory].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={selectClass} value={form.status} onChange={e => set('status', e.target.value as PropertyStatus)}>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="sold">Sold</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={inputClass + ' resize-none h-28'}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the property…"
            />
          </Field>

          <div>
            <button
              type="button"
              onClick={() => set('featured', !form.featured)}
              className={`flex items-center gap-2 px-4 py-2 border font-label-caps text-label-caps uppercase tracking-[0.08em] transition-colors ${
                form.featured
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              <Star className="size-3.5" fill={form.featured ? 'currentColor' : 'none'} />
              Featured
            </button>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="Price *">
              <input
                className={inputClass}
                type="number"
                value={form.price || ''}
                onChange={e => set('price', Number(e.target.value))}
                required
                min={0}
              />
            </Field>
            <Field label="Currency">
              <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="QAR">QAR</option>
                <option value="AED">AED</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="Period">
              <select className={selectClass} value={form.price_period} onChange={e => set('price_period', e.target.value)}>
                <option value="per year">Per Year</option>
                <option value="per month">Per Month</option>
                <option value="asking price">Asking Price</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="City *">
              <select className={selectClass} value={form.location} onChange={e => set('location', e.target.value)}>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Area / Neighbourhood *">
              <input
                className={inputClass}
                value={form.area}
                onChange={e => set('area', e.target.value)}
                required
                placeholder="e.g. Downtown, JBR, Pearl"
              />
            </Field>
          </div>
        </Section>

        {/* Specs */}
        <Section title="Specifications">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Field label="Bedrooms">
              <input className={inputClass} type="number" min={0} value={form.bedrooms} onChange={e => set('bedrooms', Number(e.target.value))} />
            </Field>
            <Field label="Bathrooms">
              <input className={inputClass} type="number" min={0} value={form.bathrooms} onChange={e => set('bathrooms', Number(e.target.value))} />
            </Field>
            <Field label="Area (sqft)">
              <input className={inputClass} type="number" min={0} value={form.area_sqft || ''} onChange={e => set('area_sqft', Number(e.target.value))} />
            </Field>
            <Field label="Furnishing">
              <select className={selectClass} value={form.furnishing} onChange={e => set('furnishing', e.target.value as Furnishing)}>
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Amenities */}
        <Section title="Amenities">
          <div className="flex gap-3">
            <input
              className={inputClass + ' flex-1'}
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
              placeholder="e.g. Pool, Gym, Parking…"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-5 py-2 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {form.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.amenities.map(a => (
                <span key={a} className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.06em] px-3 py-1.5 border border-surface-variant">
                  {a}
                  <button
                    type="button"
                    onClick={() => set('amenities', form.amenities.filter(x => x !== a))}
                    className="text-outline hover:text-primary ml-1"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Images */}
        <Section title="Images">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2.5 px-5 py-3 border border-dashed border-outline-variant hover:border-primary font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-[0.08em] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Uploading…' : 'Upload Images'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleImageUpload(e.target.files)}
          />

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt={img.alt}
                    className={`w-full aspect-square object-cover border-2 transition-colors ${img.is_primary ? 'border-primary' : 'border-transparent'}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPrimary(i)}
                      title="Set as primary"
                      className="p-1.5 bg-background text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Star className="size-3.5" fill={img.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      title="Remove"
                      className="p-1.5 bg-background text-on-surface-variant hover:text-error transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Property Videos">
          <p className="font-body-md text-sm text-on-surface-variant">Upload property tours or walkthroughs in MP4, MOV, M4V or WebM format. Maximum {PROPERTY_MEDIA_LIMITS.maxVideos} videos, up to {formatMediaSize(PROPERTY_MEDIA_LIMITS.maxVideoBytes)} each.</p>
          <button type="button" onClick={() => videoRef.current?.click()} disabled={uploadingVideos} className="flex items-center gap-2.5 px-5 py-3 border border-dashed border-outline-variant hover:border-primary font-label-caps text-label-caps text-on-surface-variant hover:text-primary uppercase tracking-[0.08em] transition-colors disabled:opacity-50">
            {uploadingVideos ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}{uploadingVideos ? 'Uploading videos…' : 'Browse videos'}
          </button>
          <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/x-m4v,video/webm,.mp4,.mov,.m4v,.webm" multiple className="hidden" onChange={e => queueVideos(e.target.files)} />
          <div className="grid gap-3 sm:grid-cols-2">
            {videoMedia.map(media => <div key={media.id} className="rounded-lg border border-surface-variant p-3"><video controls preload="metadata" playsInline src={getPublicPropertyMediaUrl(media.storage_bucket, media.storage_path)} className="aspect-video w-full rounded bg-black" /><div className="mt-2 flex items-center justify-between gap-2 text-xs text-on-surface-variant"><span className="truncate">{media.file_name}</span><button type="button" onClick={() => void removeVideo(media)} aria-label={`Remove ${media.file_name ?? 'video'}`} className="text-error"><Trash2 className="size-4" /></button></div></div>)}
            {queuedVideos.map(file => { const key = videoKey(file); const retry = retryableVideos[key]; return <div key={key} className="rounded-lg border border-[#d9b780]/40 p-3"><video controls preload="metadata" playsInline src={URL.createObjectURL(file)} className="aspect-video w-full rounded bg-black" /><div className="mt-2 flex items-center justify-between gap-2 text-xs text-on-surface-variant"><span className="truncate">{file.name} · {formatMediaSize(file.size)}</span><button type="button" onClick={() => void discardRetryableVideo(file)} aria-label={`Remove ${file.name}`} className="text-error"><X className="size-4" /></button></div>{retry && <div className="mt-2 flex items-center justify-between gap-3 text-xs text-error"><span>Video uploaded. Details still need saving.</span><button type="button" onClick={() => void retryVideoMetadata(file)} className="font-semibold text-primary underline">Retry save</button></div>}{uploadingVideos && <div className="mt-2 h-1 rounded bg-surface-container"><div className="h-1 rounded bg-secondary" style={{ width: `${videoProgress[key] ?? 0}%` }} /></div>}</div>; })}
          </div>
          {mediaStage && <p className="text-sm text-on-surface-variant" role="status">{mediaStage === 'validating' ? 'Video ready to upload.' : mediaStage === 'uploading' ? 'Uploading video…' : mediaStage === 'saving-media' ? 'Video uploaded. Saving video details…' : mediaStage === 'saving-property' ? 'Saving listing…' : mediaStage === 'complete' ? 'Video uploaded successfully.' : 'Video save failed. Review the message below or retry.'}</p>}
        </Section>

        {error && (
          <p className="font-body-md text-body-md text-error border-b border-error pb-3">
            {error}
          </p>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving || uploadingVideos}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Property'}
          </button>
          <Link
            to="/admin/properties"
            className="px-8 py-3.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
