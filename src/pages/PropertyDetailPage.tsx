import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPropertyBySlug } from '@/lib/queries/properties';
import { formatPrice, getPropertyWhatsAppURL } from '@/lib/utils';
import type { Property, PropertyImage } from '@/lib/types';
import { getPropertyCategory, getTransactionType, transactionLabel } from '@/lib/propertyTaxonomy';
import { getPublicPropertyMediaUrl } from '@/lib/propertyMediaStorage';
import { Play } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment', villa: 'Villa', townhouse: 'Townhouse',
  studio: 'Studio', penthouse: 'Penthouse', duplex: 'Duplex',
  compound: 'Compound', shop: 'Shop', office: 'Office', warehouse: 'Warehouse',
};

function getBackLabel(property: Property) {
  return `Back to other properties ${transactionLabel(getTransactionType(property), true).toLowerCase()}`;
}

function getReferenceNumber(property: Property) {
  return `ANT-${property.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function getMosaicImages(images: PropertyImage[]) {
  const count = images.length > 0 ? 5 : 1;
  return Array.from({ length: count }, (_, i) => images[i % images.length]);
}

export function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setDescriptionExpanded(false);
    fetchPropertyBySlug(slug)
      .then(setProperty)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-container-max mx-auto px-margin-edge pt-section-gap">
          <div className="aspect-[16/9] bg-surface-container animate-pulse mb-8" />
          <div className="h-10 bg-surface-container w-2/3 animate-pulse mb-4" />
          <div className="h-6 bg-surface-container w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-8">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-6">
          Not Found
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-6">
          Property Not Found
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-12">
          This listing may have been removed or is no longer available.
        </p>
        <Link
          to="/properties"
          className="font-label-caps text-label-caps text-primary border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-colors uppercase tracking-[0.1em]"
        >
          Browse All Properties
        </Link>
      </div>
    );
  }

  const images = property.images.length > 0
    ? [...property.images].sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.order - b.order;
      })
    : [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200', alt: property.title, order: 0, is_primary: true }];

  const mosaicImages = getMosaicImages(images);
  const videoItems = (property.media ?? []).filter(media => media.media_type === 'video').map(media => ({
    kind: 'video' as const, url: getPublicPropertyMediaUrl(media.storage_bucket, media.storage_path), alt: media.file_name ?? `${property.title} video tour`, poster: images[0]?.url,
  }));
  const galleryItems = [...images.map(image => ({ kind: 'image' as const, url: image.url, alt: image.alt })), ...videoItems];
  const category = getPropertyCategory(property);
  const isResidential = category === 'residential';
  const referenceNumber = getReferenceNumber(property);
  const description = property.description?.trim() ?? '';
  const showReadMore = description.length > 360;
  const visibleDescription = !showReadMore || descriptionExpanded
    ? description
    : `${description.slice(0, 360).trim()}...`;

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="mx-auto max-w-[1480px] px-5 pt-6 sm:px-8 lg:px-16 xl:px-24">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/properties"
            className="inline-flex items-center gap-3 font-body-md text-body-md text-primary transition-colors hover:text-secondary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_left</span>
            {getBackLabel(property)}
          </Link>

          <div className="flex items-center gap-5 sm:justify-end">
            <span className="font-body-md text-body-md font-semibold text-primary">
              Reference number: {referenceNumber}
            </span>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[28px] bg-surface-container">
          <div className="grid min-h-[300px] gap-0.5 lg:h-[clamp(360px,27vw,460px)] lg:grid-cols-[1.03fr_1fr]">
            <button
              type="button"
              onClick={() => {
                setActiveImage(0);
                setGalleryOpen(true);
              }}
              className="group relative min-h-[320px] overflow-hidden bg-surface-container text-left lg:min-h-0"
              aria-label="Open property gallery"
            >
              <StorageImage
                src={mosaicImages[0]?.url}
                alt={mosaicImages[0]?.alt ?? property.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </button>

            <div className="hidden grid-cols-2 grid-rows-2 gap-0.5 lg:grid">
              {mosaicImages.slice(1, 5).map((image, i) => (
                <button
                  type="button"
                  key={`${image.url}-${i}`}
                  onClick={() => {
                    setActiveImage(i + 1);
                    setGalleryOpen(true);
                  }}
                  className="group relative overflow-hidden bg-surface-container text-left"
                  aria-label={`Open gallery image ${i + 2}`}
                >
                  <StorageImage
                    src={image.url}
                    alt={image.alt ?? property.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          </div>

          {galleryItems.length > 1 && (
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="absolute bottom-5 right-5 inline-flex h-12 items-center gap-2 rounded-full bg-primary/80 px-5 font-body-md text-body-md font-semibold text-on-primary shadow-lg backdrop-blur-sm transition-colors hover:bg-primary"
            >
              {videoItems.length ? <Play className="size-5" /> : <span className="material-symbols-outlined" style={{ fontSize: 22 }}>photo_library</span>}
              View Gallery
            </button>
          )}
        </section>
      </div>

      <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-16 lg:py-9 xl:px-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,940px)_360px] lg:justify-between xl:gap-16">
          <main className="min-w-0 max-w-[940px]">
            <h1 className="mb-2.5 font-body-md !text-[28px] font-semibold !leading-[1.14] text-primary sm:!text-[34px]">
              {formatPrice(property.price, property.currency, property.price_period)}
            </h1>

            <h2 className="mb-5 max-w-[900px] font-body-md !text-[18px] font-semibold uppercase !leading-[1.24] text-primary sm:!text-[23px]">
              {property.title}
            </h2>

            <p className="mb-5 flex items-center gap-2 font-body-md !text-[14px] !leading-6 text-on-surface-variant sm:!text-[16px]">
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 21 }}>location_on</span>
              {property.area}, {property.location}
            </p>

            <div className="mb-8 flex max-w-full items-center gap-2.5 overflow-x-auto whitespace-nowrap pb-1">
              <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface-container px-3.5 font-body-md !text-[14px] !leading-none text-primary">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>apartment</span>
                {TYPE_LABELS[property.type] ?? property.type}
              </span>

              {!isResidential && null}
              {isResidential && (
                <>
                  <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface-container px-3.5 font-body-md !text-[14px] !leading-none text-primary">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>bed</span>
                    {property.bedrooms === 0 ? 'Studio' : property.bedrooms}
                  </span>
                  <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface-container px-3.5 font-body-md !text-[14px] !leading-none text-primary">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>bathtub</span>
                    {property.bathrooms}
                  </span>
                </>
              )}

              <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface-container px-3.5 font-body-md !text-[14px] !leading-none text-primary">
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>straighten</span>
                {property.area_sqft.toLocaleString()} SQM
              </span>
            </div>

            {description && (
              <section className="max-w-[940px]">
                <p className="whitespace-pre-line font-body-md !text-[16px] !leading-[1.38] text-primary sm:!text-[17px]">
                  {visibleDescription}
                </p>

                {showReadMore && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                    className="mt-4 border-b border-primary pb-1 font-body-md !text-[16px] font-semibold text-primary transition-colors hover:border-secondary hover:text-secondary"
                  >
                    {descriptionExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </section>
            )}

            {property.amenities?.length > 0 && (
              <section className="mt-12 border-t border-surface-variant pt-9">
                <h3 className="mb-6 font-body-md !text-[18px] font-semibold text-primary">Amenities</h3>
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-3 font-body-md !text-[14px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>check</span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="lg:pt-1">
            <div className="space-y-4 lg:sticky lg:top-28">
              <div className="rounded-[16px] border border-surface-variant bg-background px-4 py-4 shadow-sm">
                <div className="flex min-h-[58px] items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person</span>
                  </div>
                  <p className="font-body-md !text-[15px] font-semibold leading-5 text-primary">
                    Antilia Real Estate
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-surface-variant bg-background px-4 py-5 text-center shadow-sm">
                <p className="mx-auto mb-5 max-w-[300px] font-body-md !text-[15px] font-semibold !leading-[1.35] text-primary">
                  Share your details and we'll be in touch to discuss this property.
                </p>
                <a
                  href={getPropertyWhatsAppURL(property)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 font-body-md !text-[14px] font-semibold text-on-primary transition-colors hover:bg-secondary"
                >
                  Book A Viewing
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-[80] bg-primary/95 px-4 py-5 text-on-primary sm:px-8" role="dialog" aria-modal="true" aria-label="Property image gallery">
          <div className="mx-auto flex h-full max-w-[1440px] flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="font-body-md text-body-md font-semibold">
                {activeImage + 1} / {galleryItems.length}
              </span>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-on-primary/10 transition-colors hover:bg-on-primary/20"
                aria-label="Close gallery"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[18px] bg-on-primary/5">
              {galleryItems[activeImage]?.kind === 'video' ? <video key={galleryItems[activeImage].url} controls playsInline preload="metadata" poster={galleryItems[activeImage].poster} className="h-full w-full object-contain" src={galleryItems[activeImage].url} aria-label={`Video tour: ${galleryItems[activeImage].alt}`} /> : <StorageImage src={galleryItems[activeImage]?.url ?? ''} alt={galleryItems[activeImage]?.alt ?? property.title} className="h-full w-full object-contain" />}
            </div>

            {galleryItems.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {galleryItems.map((item, i) => (
                  <button
                    key={`${item.url}-thumb-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border transition-opacity sm:h-20 sm:w-32 ${
                      i === activeImage ? 'border-on-primary opacity-100' : 'border-on-primary/20 opacity-55 hover:opacity-85'
                    }`}
                    aria-label={`Show gallery ${item.kind} ${i + 1}`}
                  >
                    {item.kind === 'video' ? <div className="relative h-full w-full"><StorageImage src={item.poster ?? ''} alt="" className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/35"><Play className="size-6 fill-white text-white" /></span></div> : <StorageImage src={item.url} alt={item.alt ?? property.title} className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}











