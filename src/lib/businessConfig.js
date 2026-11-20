/** Business contact details must be configured by the operator; no placeholder number is shipped. */
export const BUSINESS_WHATSAPP_NUMBER = import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || '';
export const BUSINESS_WHATSAPP_DISPLAY = BUSINESS_WHATSAPP_NUMBER ? '+' + BUSINESS_WHATSAPP_NUMBER : '';
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';
export const OPERATIONS_EMAIL = import.meta.env.VITE_OPERATIONS_EMAIL || '';

export function whatsappLink(message = '') {
  if (!BUSINESS_WHATSAPP_NUMBER) return '';
  const base = 'https://wa.me/' + BUSINESS_WHATSAPP_NUMBER.replace(/\D/g, '');
  return message ? base + '?text=' + encodeURIComponent(message) : base;
}
