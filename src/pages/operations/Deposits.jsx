import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine, AlertTriangle } from 'lucide-react';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function Deposits() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    base44.entities.Transaction.list('-created_date', 200)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Transaction source returned an invalid response.');
        if (active) setTransactions(rows.filter((transaction) => ['deposit', 'opening_balance'].includes(String(transaction.type || '').toLowerCase())));
      })
      .catch(() => {
        if (active) setError('Deposit records are unavailable. No empty-queue or zero-activity conclusion can be drawn.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout title="Deposit records" description="Read-only incoming deposit and opening-balance records returned by the current source query. No total is inferred from a bounded result set." icon={ArrowDownToLine}>
      <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Source-record view · query limit 200</p>
          <p className="mt-1 text-xs leading-5">This page does not calculate processed deposit totals, available balances or settled volume. A complete reconciled ledger aggregate is required for those figures.</p>
        </div>
      </div>

      <section className="vantoris-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242D38] px-5 py-4">
          <h2 className="font-semibold text-white">Incoming deposit records</h2>
          <span className="text-xs text-[#AAB4C3]">{error ? 'Unavailable' : transactions.length + ' returned · max 200'}</span>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
          </div>
        ) : error ? (
          <p role="status" className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#AAB4C3]">No deposit records were returned by the current query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Description</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Reference</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Recorded amount</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id || (String(transaction.created_date || 'record') + '-' + index)} className="border-b border-[#242D38]/40 transition-all hover:bg-[#242D38]/20">
                    <td className="px-5 py-3 text-xs text-[#AAB4C3]">{dateLabel(transaction.transaction_date || transaction.created_date)}</td>
                    <td className="px-5 py-3 text-xs capitalize text-white">{transaction.type ? String(transaction.type).replace(/_/g, ' ') : 'Type not supplied'}</td>
                    <td className="px-5 py-3 text-xs text-white">{transaction.description || 'Description not supplied'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#AAB4C3]">{transaction.reference || 'Reference not supplied'}</td>
                    <td className="px-5 py-3 text-right text-xs font-semibold text-emerald-400">{formatCurrency(transaction.amount, transaction.currency || transaction.currency_code || null)}</td>
                    <td className="px-5 py-3 text-right text-xs capitalize text-[#AAB4C3]">{transaction.status ? String(transaction.status).replace(/_/g, ' ') : 'Status not supplied'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </OperationsPageLayout>
  );
}
