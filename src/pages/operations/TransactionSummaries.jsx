import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { CalendarDays, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function transactionDate(transaction) {
  const value = transaction.transaction_date || transaction.created_date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

export default function TransactionSummaries() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
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
        safeList(base44.entities.Transaction.list('-created_date', 500)),
        safeList(base44.entities.Account.list('-created_date', 200)),
      ]);
      if (!active) return;
      setTransactions(transactionResult.rows);
      setAccounts(accountResult.rows);
      setTransactionsError(transactionResult.failed);
      setAccountsError(accountResult.failed);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const yearOptions = useMemo(() => {
    const years = new Set([now.getFullYear()]);
    transactions.forEach((transaction) => {
      const date = transactionDate(transaction);
      if (date) years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, now]);

  const monthRecords = useMemo(() => transactions.filter((transaction) => {
    const date = transactionDate(transaction);
    return date && date.getFullYear() === year && date.getMonth() === month;
  }).sort((a, b) => transactionDate(b).getTime() - transactionDate(a).getTime()), [transactions, month, year]);

  const monthLabel = MONTHS[month] + ' ' + year;

  return (
    <OperationsPageLayout
      title="Transaction records"
      description="Monthly record explorer. Authoritative financial summaries and exports are withheld until complete reconciled data is available."
      icon={CalendarDays}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled title="Requires a verified server-side monthly aggregate" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <FileSpreadsheet size={14} /> Summary export unavailable
          </button>
          <button type="button" disabled title="Requires an authorized complete-ledger export service" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white opacity-45">
            <Download size={14} /> Ledger export unavailable
          </button>
        </div>
      }
    >
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Monthly totals are not verified</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            The current browser query is limited to 500 transaction records. It cannot establish complete deposits, withdrawals, adjustments, net flow, or settled volume. No totals or official monthly exports are generated here.
          </p>
        </div>
      </div>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-navy">Selected period</span>
          </div>
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {MONTHS.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-500">{transactionsError ? 'Records unavailable' : monthRecords.length + ' records returned for ' + monthLabel}</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-navy">Transaction records — {monthLabel}</h2>
          <p className="mt-1 text-xs text-slate-500">Source records only. Amounts are shown only when their currency is supplied.</p>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading transaction records…</p>
        ) : transactionsError ? (
          <p role="status" className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Transaction records are unavailable. No empty-month conclusion can be drawn.</p>
        ) : monthRecords.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No transaction records were returned for {monthLabel}.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthRecords.slice(0, 100).map((transaction, index) => {
              const account = accountById.get(transaction.account_id);
              const date = transactionDate(transaction);
              const currency = transaction.currency || transaction.currency_code || account?.currency || account?.currency_code;
              return (
                <article key={transaction.id || (String(transaction.created_date || 'record') + '-' + index)} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{transaction.description || transaction.type || 'Transaction record'}</p>
                    <p className="mt-1 text-xs text-slate-500">{date ? date.toLocaleString() : 'Date not supplied'} · {transaction.type ? String(transaction.type).replace(/_/g, ' ') : 'Type not supplied'}</p>
                    <p className="mt-1 text-xs text-slate-500">{account?.account_name || (accountsError ? 'Account record unavailable' : 'Account record not returned')} · {maskAccount(account?.account_number)}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-semibold tabular-nums text-navy">{amountLabel(transaction.amount, currency)}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{transaction.status ? String(transaction.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!transactionsError && monthRecords.length > 100 && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-500">Showing 100 of {monthRecords.length} returned records. The source query is still limited to 500 overall.</p>}
      </section>
    </OperationsPageLayout>
  );
}
