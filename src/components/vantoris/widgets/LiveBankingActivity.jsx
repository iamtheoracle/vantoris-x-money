import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';


export default function LiveBankingActivity() {
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    base44.entities.Transaction.list('-created_date', 8)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Transaction query returned an invalid shape.');
        if (active) {
          setTransactions(rows);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('unavailable');
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-mint" />
        <h3 className="text-sm font-semibold text-foreground">Recent transaction records</h3>
      </div>
      {status === 'loading' ? (
        <p className="py-6 text-center text-xs text-gray">Loading recent records…</p>
      ) : status === 'unavailable' ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          Recent transaction records are unavailable. This is not confirmation that there was no activity.
        </p>
      ) : transactions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-gray">No recent transaction records were returned.</p>
        </div>
      ) : (
        <div>
          {transactions.map((txn, index) => {
            const incoming = ['deposit', 'opening_balance'].includes(String(txn.type || '').toLowerCase());
            const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
            const date = txn.created_date ? new Date(txn.created_date) : null;
            const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Date not supplied';
            return (
              <div key={txn.id || (String(txn.created_date || 'record') + '-' + index)} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
                <div className={'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ' + (incoming ? 'bg-mint/10' : 'bg-crimson/10')}>
                  <Icon size={13} className={incoming ? 'text-mint' : 'text-crimson'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{txn.description || txn.type || 'Transaction record'}</p>
                  <p className="text-[10px] text-gray/60">{dateLabel}</p>
                </div>
                <p className={'text-right text-xs font-bold ' + (incoming ? 'text-mint' : 'text-crimson')}>
                  {formatCurrency(txn.amount, txn.currency || txn.currency_code || null)}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-gray/70">Most recent records returned by the backend; not a real-time feed or complete transaction history.</p>
    </section>
  );
}
