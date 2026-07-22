import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Property } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string, period: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price);
  return `${currency} ${formatted}${period !== 'asking price' ? ' / ' + period.replace('per ', '') : ''}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getWhatsAppURL(message?: string): string {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '97412345678';
  const text = message || 'Hello Antilia Real Estate, I would like to make an enquiry.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function getPropertyWhatsAppURL(property: Property): string {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://antilia-landing.vercel.app';
  const propertyUrl = `${siteUrl}/properties/${property.slug}`;

  let msg = `Hello Antilia Real Estate, I am interested in:\n${property.title}\n${propertyUrl}`;

  const phone = property.contact_phone;
  const email = property.contact_email;
  if (phone || email) {
    msg += `\n\nContact details for this property:`;
    if (phone) msg += `\n📞 ${phone}`;
    if (email) msg += `\n📧 ${email}`;
  }

  return getWhatsAppURL(msg);
}

export function getPrimaryImage(property: Property): string {
  const primary = property.images.find(i => i.is_primary);
  return primary?.url ?? property.images[0]?.url ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
}

export function extractLocations(properties: Property[]): string[] {
  return [...new Set(properties.map(p => p.area))].sort();
}
