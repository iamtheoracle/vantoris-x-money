import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

/** Monthly totals are limited to the transaction records supplied by the parent page. */
export default function MonthlySummary({ transactions = [] }) {
  const months = useMemo(() => {
    const grouped = new Map();
    (Array.isArray(transactions) ? transactions : []).forEach((transaction) => {
      const rawDate = transaction.transaction_date || transaction.created_date;
      const date = rawDate ? new Date(rawDate) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const row = grouped.get(key) || { key, label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), incoming: 0, outgoing: 0, count: 0 };
      const amount = Number(transaction.amount) || 0;
      if (amount >= 0) row.incoming += amount; else row.outgoing += Math.abs(amount);
      row.count += 1;
      grouped.set(key, row);
    });
    return [...grouped.values()].sort((a, b) => b.key.localeCompare(a.key)).slice(0, 6);
  }, [transactions]);
  if (!months.length) return null;
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-foreground">Monthly summary</h3><span className="text-[11px] text-gray">Loaded transaction sample</span></div><div className="space-y-3">{months.map(month => <div key={month.key} className="rounded-xl bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-navy">{month.label}</p><p className="text-[11px] text-gray">{month.count} record{month.count === 1 ? '' : 's'}</p></div><div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-wide text-gray">Money in</p><p className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(month.incoming)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-gray">Money out</p><p className="mt-1 text-sm font-semibold text-crimson">{formatCurrency(month.outgoing)}</p></div></div></div>)}</div><p className="mt-3 text-[11px] text-gray/70">This summary covers only the transaction records loaded on this screen, not a complete statement or ledger total.</p></section>;
}
