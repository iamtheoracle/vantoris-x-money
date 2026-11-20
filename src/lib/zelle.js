/** Zelle-style member identifier helpers. These utilities do not initiate or settle payments. */
export function normalizeZelleIdentifier(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.toLowerCase();
  return raw.replace(/[^0-9+]/g, '');
}

export function findZelleRecipient(profiles, identifier) {
  const normalized = normalizeZelleIdentifier(identifier);
  if (!normalized || !Array.isArray(profiles)) return null;
  return profiles.find((profile) => {
    if (profile?.status !== 'enrolled' || !profile?.user_id) return false;
    return [profile.zelle_email, profile.zelle_phone].map(normalizeZelleIdentifier).includes(normalized);
  }) || null;
}

export function maskZelleIdentifier(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.includes('@')) {
    const [local, domain] = raw.split('@');
    if (!local || !domain) return '••••';
    return local.slice(0, 1) + '•'.repeat(Math.max(1, local.length - 1)) + '@' + domain;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return '••• ••• ' + digits.slice(-4);
}

export function buildVantorisQrPayload(profile) {
  if (!profile?.user_id || profile?.status !== 'enrolled') return '';
  return JSON.stringify({ type: 'vantoris-member-payment-request', version: 1, user_id: profile.user_id });
}
