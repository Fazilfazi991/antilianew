import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Star } from 'lucide-react';
import { createProperty, updateProperty, uploadPropertyImage } from '@/lib/queries/admin';
import { fetchProperties } from '@/lib/queries/properties';
import { slugify } from '@/lib/utils';
import { useCities } from '@/hooks/useCities';
import type { Property, PropertyCategory, PropertyType, Furnishing, PropertyStatus, PropertyImage } from '@/lib/types';

type FormData = Omit<Property, 'id' | 'created_at' | 'updated_at'>;

const EMPTY: FormData = {
  slug: '',
  title: '',
  description: '',
  category: 'rent',
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
  const [amenityInput, setAmenityInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    fetchProperties().then(list => {
      const found = list.find(p => p.id === id);
      if (found) {
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = found;
        setForm(rest);
      }
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
      if (isEdit && id) {
        await updateProperty(id, form);
      } else {
        await createProperty(form);
      }
      navigate('/admin/properties');
    } catch (e: unknown) {
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
            <Field label="Category *">
              <select className={selectClass} value={form.category} onChange={e => set('category', e.target.value as PropertyCategory)}>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
                <option value="commercial">Commercial</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Property Type *">
              <select className={selectClass} value={form.type} onChange={e => set('type', e.target.value as PropertyType)}>
                {['apartment','villa','townhouse','studio','penthouse','duplex','compound','shop','office','warehouse'].map(t => (
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

        {error && (
          <p className="font-body-md text-body-md text-error border-b border-error pb-3">
            {error}
          </p>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
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
