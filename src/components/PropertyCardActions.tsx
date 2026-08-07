import { MessageCircle, Phone, Share2 } from 'lucide-react';
import { ANTILIA_CONTACT } from '@/lib/contact';
import { getPropertyCardWhatsAppURL, getPropertyWhatsAppShareURL } from '@/lib/utils';
import type { Property } from '@/lib/types';

export function PropertyCardActions({ property }: { property: Property }) {
  const actionClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d9b780]/50 px-2 text-xs font-semibold text-[#735a3a] transition-colors hover:bg-[#f5ead3] focus:outline-none focus:ring-2 focus:ring-[#9e7b3d]';
  return <div className="grid grid-cols-3 gap-2" aria-label={`Contact actions for ${property.title}`}>
    <a href={`tel:${ANTILIA_CONTACT.propertyCardCall}`} aria-label={`Call Antilia about ${property.title}`} className={actionClass}><Phone className="size-4" />Call</a>
    <a href={getPropertyCardWhatsAppURL(property)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp Antilia about ${property.title}`} className={actionClass}><MessageCircle className="size-4" />WhatsApp</a>
    <a href={getPropertyWhatsAppShareURL(property)} target="_blank" rel="noopener noreferrer" aria-label={`Share ${property.title} on WhatsApp`} className={actionClass}><Share2 className="size-4" />Share</a>
  </div>;
}
