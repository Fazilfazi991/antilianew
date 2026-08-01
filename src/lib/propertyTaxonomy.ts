import type { Property, PropertyCategory, PropertyType, TransactionType } from './types';

export const TRANSACTION_TYPES = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
] as const;

export const PROPERTY_CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
] as const;

export const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
  residential: ['apartment', 'villa', 'townhouse', 'studio', 'penthouse', 'duplex', 'compound', 'residential-land'],
  commercial: ['shop', 'office', 'showroom', 'business-centre', 'restaurant-space', 'commercial-building', 'commercial-land'],
  industrial: ['warehouse', 'factory', 'workshop', 'labour-accommodation', 'industrial-land', 'logistics-facility', 'cold-storage'],
};

export function getTransactionType(property: Pick<Property, 'transaction_type' | 'category'>): TransactionType {
  if (property.transaction_type === 'buy' || property.transaction_type === 'rent') return property.transaction_type;
  return property.category === 'rent' ? 'rent' : 'buy';
}

export function getPropertyCategory(property: Pick<Property, 'category' | 'type'>): PropertyCategory {
  if (property.category === 'residential' || property.category === 'commercial' || property.category === 'industrial') return property.category;
  return PROPERTY_TYPES_BY_CATEGORY.industrial.includes(property.type) ? 'industrial' : 'residential';
}

export function transactionLabel(transactionType: TransactionType, cardLabel = false) {
  if (cardLabel) return transactionType === 'buy' ? 'For Sale' : 'For Rent';
  return transactionType === 'buy' ? 'Buy' : 'Rent';
}
