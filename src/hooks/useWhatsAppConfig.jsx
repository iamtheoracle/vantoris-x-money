import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/businessConfig';

/**
 * Support contact configuration is supplied by Vantoris deployment settings.
 * No Base44 AppConfiguration or third-party account is queried from the browser.
 */
export function useWhatsAppConfig() {
  return BUSINESS_WHATSAPP_NUMBER;
}

export function whatsappLinkFromConfig(number, message = '') {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  const base = 'https://wa.me/' + digits;
  return message ? base + '?text=' + encodeURIComponent(message) : base;
}
