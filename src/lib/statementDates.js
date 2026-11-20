import { format, parseISO, getDay, isValid } from 'date-fns';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseDateSafe(value) {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}
export function getWeekday(value, short = false) {
  const date = parseDateSafe(value);
  return date ? (short ? WEEKDAYS_SHORT[getDay(date)] : WEEKDAYS[getDay(date)]) : '';
}
export function formatStatementDate(value) {
  const date = parseDateSafe(value);
  return date ? format(date, 'EEE, MMM dd, yyyy') : '—';
}
export function formatTxnDate(value) {
  const date = parseDateSafe(value);
  return date ? format(date, 'MMM dd, yyyy') : '—';
}
export function formatTxnDateShort(value) {
  const date = parseDateSafe(value);
  return date ? format(date, 'MM/dd/yyyy') : '—';
}
export function formatPeriod(startValue, endValue) {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue);
  if (!start && !end) return 'All Transactions';
  if (!start) return 'Through ' + format(end, 'MMMM d, yyyy');
  if (!end) return 'From ' + format(start, 'MMMM d, yyyy');
  return format(start, 'MMMM d, yyyy') + ' – ' + format(end, 'MMMM d, yyyy');
}
export function getEffectiveTxnDate(transaction) {
  return transaction?.transaction_date || transaction?.posting_date || transaction?.created_date || null;
}
export function periodsOverlap(first, second) {
  const start1 = parseDateSafe(first?.start), end1 = parseDateSafe(first?.end);
  const start2 = parseDateSafe(second?.start), end2 = parseDateSafe(second?.end);
  return Boolean(start1 && end1 && start2 && end2 && start1 <= end2 && start2 <= end1);
}
export function dedupKey(transaction) {
  return [transaction?.account_id || '', transaction?.transaction_date || '', String(transaction?.amount || ''), String(transaction?.description || '').toLowerCase().trim(), transaction?.reference || ''].join('|');
}
