const DEBIT_TYPES = new Set([
  'debit', 'withdrawal', 'outgoing_transfer', 'transfer_out', 'payment', 'fee', 'purchase',
]);
const CREDIT_TYPES = new Set([
  'credit', 'deposit', 'incoming_transfer', 'transfer_in', 'interest', 'refund', 'receipt',
]);

/**
 * Classify activity direction only from a recognized ledger transaction type.
 * Amount sign alone is not evidence of economic direction and stays neutral.
 */
export function transactionPresentation(amount, type) {
  if (amount === null || amount === undefined || (typeof amount === 'string' && amount.trim() === '')) {
    return { amount: null, sign: '', tone: 'text-slate-500' };
  }

  const raw = Number(amount);
  if (!Number.isFinite(raw)) return { amount: null, sign: '', tone: 'text-slate-500' };
  if (raw === 0) return { amount: 0, sign: '', tone: 'text-slate-500' };

  const normalizedType = String(type || '').trim().toLowerCase();
  const displayAmount = typeof amount === 'string' ? amount.trim().replace(/^-/, '') : Math.abs(raw);
  if (DEBIT_TYPES.has(normalizedType)) {
    return { amount: displayAmount, sign: '−', tone: 'text-navy' };
  }
  if (CREDIT_TYPES.has(normalizedType)) {
    return { amount: displayAmount, sign: '+', tone: 'text-emerald-600' };
  }

  return { amount: displayAmount, sign: '', tone: 'text-slate-500' };
}
