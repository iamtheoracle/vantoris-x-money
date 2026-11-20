import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';
import { PROVIDERS } from '@/lib/providers';

export default function Money() {
  const [accounts, setAccounts] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const [a, t] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.Transaction.filter({ user_id: me.id }, '-created_date', 20).catch(() => []),
        ]);
        if (!cancel) {
          setAccounts(Array.isArray(a) ? a : []);
          setTxns(Array.isArray(t) ? t : []);
        }
      } catch (e) {
        if (!cancel) setError(e.message || 'Could not load accounts');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const balance = useMemo(
    () => accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0),
    [accounts]
  );

  return (
    <ProductShell
      kicker="USD"
      title="Money"
      subtitle="Balances and activity come from your connected account records. Transfers execute only when a payments provider confirms them."
    >
      {loading && <p className="text-sm text-slate-500">Loading account records…</p>}
      {error && <p className="text-sm text-crimson">{error}</p>}
      {!loading && !accounts.length && (
        <UnavailableState
          title="No USD account on file"
          detail="There is no account record for this member yet. Vantoris will not display a simulated balance."
        />
      )}
      {!!accounts.length && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-navy p-5 text-white">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Available · USD</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{formatCurrency(balance)}</p>
            <p className="mt-2 text-xs text-white/50">{accounts.length} account record{accounts.length === 1 ? '' : 's'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/move-money?action=send" className="rounded-xl bg-white border border-slate-200 py-3 text-center text-sm font-semibold">Send</Link>
            <Link to="/qr" className="rounded-xl bg-white border border-slate-200 py-3 text-center text-sm font-semibold">Receive</Link>
            <Link to="/move-money?action=deposit" className="rounded-xl bg-white border border-slate-200 py-3 text-center text-sm font-semibold">Add funds</Link>
            <Link to="/?tab=activity" className="rounded-xl bg-white border border-slate-200 py-3 text-center text-sm font-semibold">Activity</Link>
          </div>
          <UnavailableState
            title="Payments provider"
            detail={PROVIDERS.payments.note + ' Send opens the existing transfer workflow; completion is not claimed until the backend records a transaction.'}
          />
          <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
            {accounts.map((a) => (
              <Link key={a.id} to={`/accounts/${a.id}`} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="block font-semibold">{a.account_name || a.account_type || 'Account'}</span>
                  <span className="text-xs text-slate-500">{a.status || 'on file'}</span>
                </span>
                <span className="font-mono tabular-nums">{formatCurrency(Number(a.balance) || 0)}</span>
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent activity</p>
            {!txns.length && <p className="text-sm text-slate-500">No transaction records returned.</p>}
            {txns.map((tx) => (
              <div key={tx.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                <span className="truncate pr-3">{tx.description || tx.type || 'Transaction'}</span>
                <span className="font-mono tabular-nums">{formatCurrency(Number(tx.amount) || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ProductShell>
  );
}
