/**
 * Format an amount for the member-facing USD interface.
 * This utility only formats a supplied value; it does not create financial data.
 */
export function formatCurrency(amount) {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Account numbers must be issued by a trusted server-side workflow, never generated in the browser. */
export function generateAccountNumber() {
  throw new Error('Account numbers are issued by the trusted server-side account workflow.');
}
