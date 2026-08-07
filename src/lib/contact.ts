export const ANTILIA_CONTACT = {
  telephone: ['+97470900084', '+97477050054'],
  whatsapp: '+97470900054',
  office: '+97470900054',
  propertyCardCall: '+97470900064',
  propertyCardWhatsapp: '+97470900064',
} as const;

export function formatQatarPhone(phone: string): string {
  return `(974) ${phone.slice(4)}`;
}

export function toWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
