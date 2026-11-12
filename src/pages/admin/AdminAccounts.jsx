import React, { useEffect, useMemo, useState } from 'react';
import { Search, Wallet, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';

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

function maskAccount(value) {
  if (!value) return 'Account number not supplied';
  const digits = String(value).replace(/\s/g, '');
  return digits.length > 4 ? '•••• ' + digits.slice(-4) : '••••';
}

function safeDate(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [search, setSearch] = useState('');

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
      const [accountResult, transactionResult] = await Promise.all([
        safeList(base44.entities.Account.list('-created_date', 200)),
        safeList(base44.entities.Transaction.list('-created_date', 100)),
      ]);
      if (!active) return;
      setAccounts(accountResult.rows);
      setTransactions(transactionResult.rows);
      setAccountsError(accountResult.failed);
      setTransactionsError(transactionResult.failed);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) => [account.account_name, account.account_type, account.owner_name, account.user_name, account.status].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [accounts, search]);

  return (
    <OperationsPageLayout title="Account records" description="Read-only member account records. No client-side balance or account-status changes are permitted." icon={Wallet} breadcrumb="Operations">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Privileged account actions are unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Balance adjustments, transaction creation or editing, account freezes, and status changes require a server-side ledger workflow with dual approval, immutable audit evidence, and reconciliation. This page does not perform those actions or calculate an institutional balance total.
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-semibold text-navy">{accountsError ? 'Unavailable' : accounts.length}</p>
          <p className="mt-1 text-xs text-slate-500">Account records returned (limit 200)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-semibold text-navy">{transactionsError ? 'Unavailable' : transactions.length}</p>
          <p className="mt-1 text-xs text-slate-500">Recent transaction records returned (limit 100)</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-navy">Member accounts</h2>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search returned accounts" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brass" />
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading account records…</p>
        ) : accountsError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Account records are unavailable. This is not confirmation that no accounts exist.</p>
        ) : filteredAccounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No account records matched this query.</p>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account) => (
              <article key={account.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{account.account_name || account.account_type || 'Account record'}</p>
                  <p className="mt-1 text-xs text-slate-500">{account.account_type || 'Type not supplied'} · {maskAccount(account.account_number)}</p>
                  <p className="mt-1 text-xs text-slate-500">{account.owner_name || account.user_name || 'Owner name not supplied'}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold tabular-nums text-navy">{amountLabel(account.balance, account.currency || account.currency_code)}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">{account.status ? String(account.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-400">Displayed balances are source-record values only; they are not an authoritative ledger total or proof of available funds.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-navy">Recent transaction records</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading transaction records…</p>
        ) : transactionsError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Transaction records are unavailable. Zero activity must not be inferred.</p>
        ) : transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No transaction records were returned by the current query.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 20).map((txn, index) => {
              const incoming = ['deposit', 'credit', 'transfer_in', 'interest'].includes(String(txn.type || '').toLowerCase());
              const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={txn.id || (String(txn.created_date || 'record') + '-' + index)} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600"><Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{txn.description || txn.type || 'Transaction record'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{safeDate(txn.created_date)} · {txn.status ? String(txn.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-navy">{amountLabel(txn.amount, txn.currency || txn.currency_code)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </OperationsPageLayout>
  );
}
