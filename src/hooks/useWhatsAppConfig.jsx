import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/businessConfig';

/**
 * Uses only the institution-owned support configuration.
 * No Base44 or third-party configuration lookup is performed.
 */
export function useWhatsAppConfig() {
  return String(BUSINESS_WHATSAPP_NUMBER || '').replace(/\\D/g, '');
}

export function whatsappLinkFromConfig(number, message = '') {
  const digits = String(number || '').replace(/\\D/g, '');
  if (!digits) return '';
  const base = 'https://wa.me/' + digits;
  return message ? base + '?text=' + encodeURIComponent(message) : base;
}
