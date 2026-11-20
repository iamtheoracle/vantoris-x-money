import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/businessConfig';

/** Returns a configured support number, or an empty string when none is set. */
export function useWhatsAppConfig() {
  const [number, setNumber] = useState(BUSINESS_WHATSAPP_NUMBER);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const configs = await base44.entities.AppConfiguration.filter({ key: 'whatsapp_number' });
        const value = Array.isArray(configs) ? configs[0]?.value : '';
        if (active && value) setNumber(String(value).replace(/\D/g, ''));
      } catch {
        // No configured support channel: the UI routes members to the support page.
      }
    }
    load();
    return () => { active = false; };
  }, []);
  return number;
}

export function whatsappLinkFromConfig(number, message = '') {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  const base = 'https://wa.me/' + digits;
  return message ? base + '?text=' + encodeURIComponent(message) : base;
}
