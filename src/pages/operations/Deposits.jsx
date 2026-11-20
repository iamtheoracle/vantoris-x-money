import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine } from 'lucide-react';

export default function Deposits() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const txns = await base44.entities.Transaction.list('-created_date', 200);
        setTransactions(txns.filter(t => t.type === 'deposit' || t.type === 'opening_balance'));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const totalAmount = transactions.reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  return (
    <OperationsPageLayout title="Deposits" description="All incoming deposits and opening balances" icon={ArrowDownToLine}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="vantoris-card p-5 mb-6">
            <p className="text-[#AAB4C3] text-xs uppercase tracking-widest mb-1">Total Deposits Processed</p>
            <p className="text-white font-bold text-3xl">{formatCurrency(totalAmount)}</p>
            <p className="text-[#AAB4C3] text-xs mt-1">{transactions.length} transactions</p>
          </div>
          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Description</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Reference</th>
                  <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs">{(t.transaction_date || t.created_date).split('T')[0]}</td>
                    <td className="px-5 py-3 text-white text-xs">{t.type.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-white text-xs">{t.description || '—'}</td>
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs font-mono">{t.reference || '—'}</td>
                    <td className="px-5 py-3 text-right text-emerald-400 font-semibold text-xs">{formatCurrency(Math.abs(t.amount))}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No deposits found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}