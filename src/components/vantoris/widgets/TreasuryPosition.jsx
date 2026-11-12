import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TreasuryPosition() {
  const [data, setData] = useState({ accounts: 0, transactions: 0 });
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    Promise.all([
      base44.entities.Account.list('-created_date', 200),
      base44.entities.Transaction.list('-created_date', 100),
    ]).then(([accounts, transactions]) => {
      if (!Array.isArray(accounts) || !Array.isArray(transactions)) {
        throw new Error('Treasury record query returned an invalid shape.');
      }
      if (active) {
        setData({ accounts: accounts.length, transactions: transactions.length });
        setStatus('ready');
      }
    }).catch(() => {
      if (active) setStatus('unavailable');
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Wallet size={16} className="text-brass" />
        <h3 className="text-sm font-semibold text-foreground">Treasury data</h3>
      </div>
      <p className="text-2xl font-bold text-navy">Unavailable</p>
      <p className="mt-1 text-xs text-gray">Authoritative, currency-aware ledger aggregation is not connected. No partial-record balance is presented as treasury position.</p>
      {status === 'loading' ? (
        <p className="mt-4 text-xs text-gray">Checking bounded record sources…</p>
      ) : status === 'unavailable' ? (
        <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          Account or transaction records could not be retrieved. Zero must not be inferred from this result.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-lg font-semibold text-navy">{data.accounts}</p>
            <p className="text-[11px] text-gray">Account records returned (limit 200)</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy">{data.transactions}</p>
            <p className="text-[11px] text-gray">Recent transaction records returned (limit 100)</p>
          </div>
        </div>
      )}
    </section>
  );
}
