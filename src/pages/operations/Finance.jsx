import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [txns, accts] = await Promise.all([
          base44.entities.Transaction.list('-created_date', 200),
          base44.entities.Account.list('-created_date', 100),
        ]);
        setTransactions(txns);
        setAccounts(accts);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <OperationsPageLayout title="Finance Overview" description="Platform-wide financial activity" icon={DollarSign}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalAdjustments = transactions.filter(t => t.type === 'adjustment').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalAUM = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const stats = [
    { label: 'Assets Under Management', value: formatCurrency(totalAUM), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-olive/20' },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Total Withdrawals', value: formatCurrency(totalWithdrawals), icon: TrendingDown, color: 'text-red-400', bg: 'bg-crimson/15' },
    { label: 'Adjustments', value: formatCurrency(totalAdjustments), icon: Activity, color: 'text-brass', bg: 'bg-brass/15' },
  ];

  return (
    <OperationsPageLayout title="Finance Overview" description="Platform-wide financial activity" icon={DollarSign}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="vantoris-card p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} mb-3`}>
                <Icon size={20} className={s.color} />
              </div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-[#AAB4C3] text-xs mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="vantoris-card p-5">
        <h3 className="text-white font-semibold mb-4">Recent Financial Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Date</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Type</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Description</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map(t => (
                <tr key={t.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="py-3 pr-4 text-[#AAB4C3] text-xs">{(t.transaction_date || t.created_date).split('T')[0]}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      t.type === 'deposit' || t.type === 'opening_balance' ? 'bg-emerald-500/10 text-emerald-400' :
                      t.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 'bg-brass/10 text-brass'
                    }`}>{t.type.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 pr-4 text-white text-xs">{t.description || '—'}</td>
                  <td className={`py-3 pr-4 text-right font-semibold ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OperationsPageLayout>
  );
}