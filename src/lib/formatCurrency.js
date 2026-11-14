/**
 * Format a verified amount for the US member-facing interface.
 * Ledger amounts are decimal strings derived from integer cents and remain exact.
 * Missing or invalid values are shown as unavailable, never silently coerced to zero.
 */
function formatExactDecimalString(amount, currency) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount);
  if (!match) return null;
  const negative = match[1] === '-';
  const whole = BigInt(match[2]);
  const fraction = (match[3] || '').padEnd(2, '0');
  const template = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(negative ? -1 : 1);
  const integerIndex = template.findIndex(part => part.type === 'integer');
  const fractionIndex = template.findIndex(part => part.type === 'fraction');
  const prefix = template.slice(0, integerIndex).map(part => part.value).join('');
  const suffix = template.slice(fractionIndex + 1).map(part => part.value).join('');
  const groupedWhole = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(whole);
  const decimal = template.find(part => part.type === 'decimal')?.value || '.';
  return prefix + groupedWhole + decimal + fraction + suffix;
}

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || (typeof amount === 'string' && amount.trim() === '')) return 'Value unavailable';
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  if (typeof amount === 'string') {
    const exact = formatExactDecimalString(amount.trim(), currency);
    return exact || 'Value unavailable';
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'Value unavailable';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return 'Value unavailable';
  }
}

/** Account numbers must be issued by a trusted server-side account workflow, never generated in the browser. */
export function generateAccountNumber() {
  throw new Error('Account numbers are issued by the trusted server-side account workflow.');
}
