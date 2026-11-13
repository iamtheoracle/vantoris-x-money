/**
 * Format a verified amount for the US member-facing interface.
 * Missing or invalid values are shown as unavailable, never silently coerced to zero.
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || (typeof amount === 'string' && amount.trim() === '')) return 'Value unavailable';
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return 'Value unavailable';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return 'Value unavailable';
  }
}

/** Account numbers must be issued by a trusted server-side workflow, never generated in the browser. */
export function generateAccountNumber() {
  throw new Error('Account numbers are issued by the trusted server-side account workflow.');
}
