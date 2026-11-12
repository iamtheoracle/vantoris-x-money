/**
 * Format a verified amount for the US member-facing interface.
 * Missing or invalid values are shown as unavailable, never silently coerced to zero.
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Value unavailable';
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return 'Value unavailable';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Account numbers must be issued by a trusted server-side workflow, never generated in the browser. */
export function generateAccountNumber() {
  throw new Error('Account numbers are issued by the trusted server-side account workflow.');
}
