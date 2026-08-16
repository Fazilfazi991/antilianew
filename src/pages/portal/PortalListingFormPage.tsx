import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import {
  createPortalListing,
  updatePortalListing,
  fetchMyListingById,
  uploadPropertyImage,
} from '@/lib/queries/portal';
import { PROPERTY_CATEGORIES, PROPERTY_TYPES_BY_CATEGORY, TRANSACTION_TYPES } from '@/lib/propertyTaxonomy';
import { getPropertyCategory, getTransactionType } from '@/lib/propertyTaxonomy';
import type { PropertyCategory, PropertyType, Furnishing, PropertyImage, TransactionType } from '@/lib/types';
import { StorageImage } from '@/components/StorageImage';

type FormData = {
  title: string;
  description: string;
  transaction_type: TransactionType;
  category: PropertyCategory;
  type: PropertyType;
  price: number;
  price_period: string;
  currency: string;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: Furnishing;
  amenities: string[];
  images: PropertyImage[];
};

const EMPTY: FormData = {
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
  bedrooms: 1,
  bathrooms: 1,
  area_sqft: 0,
  furnishing: 'unfurnished',
  amenities: [],
  images: [],
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

export function PortalListingFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { cities } = useCities();

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id || !session?.user.id) return;
    fetchMyListingById(id, session.user.id).then(found => {
      if (found) {
        const { title, description, type, price, price_period, currency,
                location, area, bedrooms, bathrooms, area_sqft, furnishing,
                amenities, images } = found;
        setForm({ title, description, transaction_type: getTransactionType(found), category: getPropertyCategory(found), type, price, price_period, currency,
                  location, area, bedrooms, bathrooms, area_sqft, furnishing,
                  amenities, images });
      }
      setLoading(false);
    });
  }, [id, isEdit, session?.user.id]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    const slug = 'portal-' + (session?.user.id?.slice(0, 8) ?? 'user');
    try {
      const uploaded: PropertyImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPropertyImage(file, slug);
        uploaded.push({
          url,
          alt: form.title || file.name,
          order: form.images.length + uploaded.length,
          is_primary: false,
        });
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
    if (!session?.user.id) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit && id) {
        await updatePortalListing(id, form);
      } else {
        await createPortalListing(form, session.user.id);
      }
      navigate('/portal/listings');
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
      <div className="flex items-center gap-5 mb-12 pb-6 border-b border-surface-variant">
        <Link
          to="/portal/listings"
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
            {isEdit ? 'Edit Listing' : 'Submit Property'}
          </h1>
        </div>
      </div>

      <div className="mb-6 border border-surface-variant p-4 bg-surface-container-low">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em]">
          Your listing will be reviewed by our team before appearing on the site. All enquiries route through Antilia's contact details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Info">
          <Field label="Title *">
            <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Modern Apartment in The Pearl, Doha" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Transaction Type *">
              <select className={selectClass} required value={form.transaction_type} onChange={e => set('transaction_type', e.target.value as TransactionType)}>
                {TRANSACTION_TYPES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Property Category *">
              <select className={selectClass} required value={form.category} onChange={e => setForm(prev => { const category = e.target.value as PropertyCategory; return { ...prev, category, type: PROPERTY_TYPES_BY_CATEGORY[category][0] }; })}>
                {PROPERTY_CATEGORIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Property Type *">
              <select className={selectClass} value={form.type} onChange={e => set('type', e.target.value as PropertyType)}>
                {PROPERTY_TYPES_BY_CATEGORY[form.category].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea className={inputClass + ' resize-none h-28'} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the property…" />
          </Field>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="Price *">
              <input className={inputClass} type="number" value={form.price || ''} onChange={e => set('price', Number(e.target.value))} required min={0} />
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

        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="City *">
              <select className={selectClass} value={form.location} onChange={e => set('location', e.target.value)}>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Area / Neighbourhood *">
              <input className={inputClass} value={form.area} onChange={e => set('area', e.target.value)} required placeholder="e.g. The Pearl, West Bay, Lusail" />
            </Field>
          </div>
        </Section>

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

        <Section title="Amenities">
          <div className="flex gap-3">
            <input
              className={inputClass + ' flex-1'}
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
              placeholder="e.g. Pool, Gym, Parking…"
            />
            <button type="button" onClick={addAmenity} className="px-5 py-2 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.08em] hover:border-primary hover:text-primary transition-colors shrink-0">
              Add
            </button>
          </div>
          {form.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.amenities.map(a => (
                <span key={a} className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.06em] px-3 py-1.5 border border-surface-variant">
                  {a}
                  <button type="button" onClick={() => set('amenities', form.amenities.filter(x => x !== a))} className="text-outline hover:text-primary ml-1">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

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
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <StorageImage src={img.url} alt={img.alt} className={`w-full aspect-square object-cover border-2 transition-colors ${img.is_primary ? 'border-primary' : 'border-transparent'}`} />
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                    <button type="button" onClick={() => setPrimary(i)} className="p-1.5 bg-background text-on-surface-variant hover:text-primary transition-colors">
                      <Star className="size-3.5" fill={img.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => removeImage(i)} className="p-1.5 bg-background text-on-surface-variant hover:text-error transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {error && (
          <p className="font-body-md text-body-md text-error border-b border-error pb-3">{error}</p>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Resubmit for Review' : 'Submit for Review'}
          </button>
          <Link
            to="/portal/listings"
            className="px-8 py-3.5 border border-surface-variant font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
