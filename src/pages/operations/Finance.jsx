import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

function amountLabel(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Amount not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Amount not verified';
  }
}

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(false);
  const [accountsError, setAccountsError] = useState(false);

  useEffect(() => {
    let active = true;
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    (async () => {
      const [transactionResult, accountResult] = await Promise.all([
        safeList(base44.entities.Transaction.list('-created_date', 200)),
        safeList(base44.entities.Account.list('-created_date', 100)),
      ]);
      if (!active) return;
      setTransactions(transactionResult.rows);
      setAccounts(accountResult.rows);
      setTransactionsError(transactionResult.failed);
      setAccountsError(accountResult.failed);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Account records returned', value: accountsError ? 'Unavailable' : accounts.length, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-olive/20', note: 'Bounded query · limit 100' },
    { label: 'Transaction records returned', value: transactionsError ? 'Unavailable' : transactions.length, icon: Activity, color: 'text-brass', bg: 'bg-brass/15', note: 'Bounded query · limit 200' },
    { label: 'Authoritative ledger total', value: 'Unavailable', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', note: 'Verified ledger aggregate required' },
    { label: 'Settled payment volume', value: 'Unavailable', icon: TrendingDown, color: 'text-red-400', bg: 'bg-crimson/15', note: 'Provider settlement and reconciliation required' },
  ];

  return (
    <OperationsPageLayout title="Financial records" description="Read-only financial source records. No partial query is presented as assets under management or settled volume." icon={DollarSign}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Institutional financial aggregates unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Account and transaction queries are bounded and may be incomplete. Assets under management, deposits, withdrawals, adjustments, net flow, and settlement volume are withheld until server-side, currency-aware ledger aggregates and reconciliation are verified.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <section key={stat.label} className="vantoris-card rounded-2xl p-5">
              <div className={'mb-3 flex h-10 w-10 items-center justify-center rounded-xl ' + stat.bg}>
                <Icon size={20} className={stat.color} />
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-[#AAB4C3]">{stat.label}</p>
              <p className="mt-2 text-[10px] text-[#AAB4C3]/70">{stat.note}</p>
            </section>
          );
        })}
      </div>

      <section className="vantoris-card rounded-2xl p-5">
        <h3 className="mb-4 font-semibold text-white">Recent financial records</h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-[#AAB4C3]">Loading financial records…</p>
        ) : transactionsError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Transaction records are unavailable. Zero activity must not be inferred.</p>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#AAB4C3]">No transaction records were returned by the current query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38]">
                  <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Date</th>
                  <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Type</th>
                  <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Description</th>
                  <th className="py-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Recorded amount</th>
                  <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[#242D38]/40">
                    <td className="py-3 pr-4 text-xs text-[#AAB4C3]">{dateLabel(transaction.transaction_date || transaction.created_date)}</td>
                    <td className="py-3 pr-4 text-xs capitalize text-white">{transaction.type ? String(transaction.type).replace(/_/g, ' ') : 'Type not supplied'}</td>
                    <td className="py-3 pr-4 text-xs text-white">{transaction.description || 'Description not supplied'}</td>
                    <td className="py-3 pr-4 text-right text-xs font-semibold text-white">{amountLabel(transaction.amount, transaction.currency || transaction.currency_code)}</td>
                    <td className="py-3 text-right text-xs capitalize text-[#AAB4C3]">{transaction.status ? String(transaction.status).replace(/_/g, ' ') : 'Status not supplied'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {accountsError && <p role="status" className="mt-4 text-xs text-amber-300">Account records are unavailable; no account total is inferred.</p>}
        <p className="mt-4 text-[11px] text-[#AAB4C3]/70">Records shown are source records only, not a reconciled ledger, available balance, AUM, or proof of settlement.</p>
      </section>
    </OperationsPageLayout>
  );
}
