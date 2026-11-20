import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Wallet } from 'lucide-react';

export default function TreasuryPosition() {
  const [data, setData] = useState({ accounts: 0, balance: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [accounts, transactions] = await Promise.all([
          base44.entities.Account.list('-created_date', 200).catch(() => []),
          base44.entities.Transaction.list('-created_date', 100).catch(() => []),
        ]);
        const rows = Array.isArray(accounts) ? accounts : [];
        const txns = Array.isArray(transactions) ? transactions : [];
        if (active) setData({ accounts: rows.length, balance: rows.reduce((sum, account) => sum + (Number(account.balance) || 0), 0), transactions: txns.length });
      } catch (error) { console.error('Treasury snapshot unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="vantoris-glass-premium rounded-2xl p-5" role="status">Loading treasury snapshot…</div>;
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-3 flex items-center gap-2"><Wallet size={16} className="text-brass" /><h3 className="text-sm font-semibold text-foreground">Treasury snapshot</h3></div><p className="text-2xl font-bold text-navy">{formatCurrency(data.balance)}</p><p className="mt-1 text-xs text-gray">Sum of returned account records</p><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-lg font-semibold text-navy">{data.accounts}</p><p className="text-[11px] text-gray">Account records returned</p></div><div><p className="text-lg font-semibold text-navy">{data.transactions}</p><p className="text-[11px] text-gray">Recent transaction records</p></div></div><p className="mt-3 text-[11px] text-gray/70">This bounded snapshot is not a complete treasury ledger or audited assets-under-management figure.</p></section>;
}