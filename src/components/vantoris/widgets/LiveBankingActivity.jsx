import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function LiveBankingActivity() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.Transaction.list('-created_date', 8);
        if (active) setTransactions(Array.isArray(rows) ? rows : []);
      } catch (error) { console.error('Recent activity unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="vantoris-glass-premium h-64 rounded-2xl p-5" role="status">Loading recent activity…</div>;
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-mint" /><h3 className="text-sm font-semibold text-foreground">Recent banking activity</h3></div>{transactions.length === 0 ? <div className="py-6 text-center"><p className="text-xs text-gray">No recent activity returned</p></div> : <div>{transactions.map((txn, index) => { const incoming = ['deposit','opening_balance'].includes(String(txn.type || '').toLowerCase()); const Icon = incoming ? ArrowDownLeft : ArrowUpRight; const date = txn.created_date ? new Date(txn.created_date) : null; return <div key={txn.id || index} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0"><div className={'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ' + (incoming ? 'bg-mint/10' : 'bg-crimson/10')}><Icon size={13} className={incoming ? 'text-mint' : 'text-crimson'} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-foreground">{txn.description || txn.type || 'Transaction record'}</p><p className="text-[10px] text-gray/60">{date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Date not supplied'}</p></div><p className={'text-xs font-bold ' + (incoming ? 'text-mint' : 'text-crimson')}>{incoming ? '+' : '−'}{formatCurrency(Math.abs(Number(txn.amount) || 0))}</p></div>; })}</div>}<p className="mt-3 text-[11px] text-gray/70">Most recent records returned by the backend; no real-time feed is claimed.</p></section>;
}