import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Loader2, ReceiptText } from 'lucide-react';
import { centsToDecimal, formatCurrency } from '@/lib/formatCurrency';
import { transactionPresentation } from '@/lib/transactionPresentation';

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/member-auth?action=me', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Vantoris could not retrieve your ledger activity.');
        if (!Array.isArray(data.transactions)) throw new Error('Vantoris returned an invalid activity response.');
        if (active) setItems(data.transactions);
      })
      .catch(cause => {
        if (active) setError(cause.message || 'Transaction history is unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris ledger</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Transactions</h1>
      <p className="mt-2 text-sm text-slate-600">Posted entries are read from your Vantoris ledger accounts.</p>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" /></div>
      ) : error ? (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>
      ) : !items.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <ReceiptText size={26} className="mx-auto text-slate-400" />
          <p className="mt-3 font-semibold text-navy">No posted activity</p>
          <p className="mt-2 text-sm text-slate-500">There are no posted ledger entries for your member accounts.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map(item => {
            const cents = item.amountCents;
            const decimalAmount = cents === null || cents === undefined || String(cents).trim() === ''
              ? null
              : centsToDecimal(cents);
            const presentation = transactionPresentation(decimalAmount, item.type);
            const date = item.created_date ? new Date(item.created_date) : null;
            const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Date not supplied';
            const statusLabel = item.status || 'Status not supplied';
            const Icon = presentation.sign === '+'
              ? ArrowDownLeft
              : presentation.sign === '−'
                ? ArrowUpRight
                : ArrowLeftRight;

            return (
              <div key={item.id} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-navy"><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{item.description || item.type || 'Ledger entry'}</p>
                  <p className="mt-1 text-xs text-slate-500">{dateLabel} · {statusLabel}</p>
                </div>
                <p className={`shrink-0 text-sm font-semibold tabular-nums ${presentation.tone}`}>
                  {presentation.sign}{formatCurrency(presentation.amount, item.currency || item.currency_code || null)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
