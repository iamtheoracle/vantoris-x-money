import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle, ArrowDownLeft, ArrowUpRight, FileText, Upload, LockKeyhole } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatRecordedAmount(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Amount not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Amount not verified';
  }
}

function maskAccountNumber(value) {
  if (!value) return 'Account number not supplied';
  const digits = String(value).replace(/\s/g, '');
  return digits.length > 4 ? '•••• ' + digits.slice(-4) : '••••';
}

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [transactionError, setTransactionError] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const record = await base44.entities.Account.get(id);
    if (!record) throw new Error('Account record not returned.');
    // The backend must enforce ownership through its authorization policy; this is only a member-facing display guard.
    if (!record.user_id || record.user_id !== me.id) {
      setAccessDenied(true);
      setAccount(null);
      return;
    }

    setAccessDenied(false);
    setAccount(record);
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    const [transactionResult, withdrawalResult] = await Promise.all([
      safeList(base44.entities.Transaction.filter({ account_id: id }, '-created_date', 50)),
      safeList(base44.entities.WithdrawalRequest.filter({ account_id: id }, '-created_date', 20)),
    ]);
    setTransactions(transactionResult.rows);
    setWithdrawalRequests(withdrawalResult.rows);
    setTransactionError(transactionResult.failed);
    setRequestError(withdrawalResult.failed);
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    loadData()
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData, attempt]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((txn) => [txn.description, txn.type, txn.status, txn.reference].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [transactions, search]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div>;
  }

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-12">
        <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-navy">Account information unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">The account record source could not be verified. This is not confirmation that the account does not exist.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Try again</button>
        </section>
      </div>
    );
  }

  if (accessDenied || !account) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-12">
        <section role="alert" className="w-full rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-navy">Account access unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">This account record was not returned for the signed-in member.</p>
          <Link to="/accounts" className="mt-5 inline-flex rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Return to accounts</Link>
        </section>
      </div>
    );
  }

  const currency = account.currency || account.currency_code;
  const status = account.status ? String(account.status).replace(/_/g, ' ') : 'Status not supplied';

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 pb-28 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/accounts')} aria-label="Back to accounts" className="rounded-xl border border-slate-200 bg-white p-2.5 text-navy hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs text-slate-500">Vantoris Private Institution · Accounts</p>
          <h1 className="text-2xl font-semibold text-navy">{account.account_name || account.account_type || 'Account details'}</h1>
        </div>
      </div>

      <section className="mb-6 grid gap-4 lg:grid-cols-12">
        <div className="rounded-[28px] bg-[#0B2342] p-6 text-white shadow-xl lg:col-span-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Recorded account balance</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{formatRecordedAmount(account.balance, currency)}</p>
          <p className="mt-2 text-sm text-white/65">{account.account_type || 'Account type not supplied'} · {maskAccountNumber(account.account_number)}</p>
          <div className="mt-5 border-t border-white/15 pt-4">
            <p className="text-xs text-white/60">Record status</p>
            <p className="mt-1 font-semibold capitalize">{status}</p>
          </div>
        </div>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 lg:col-span-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
            <div>
              <h2 className="text-sm font-semibold text-amber-950">Account actions unavailable</h2>
              <p className="mt-1 text-xs leading-5 text-amber-900/80">
                Withdrawals, account freeze controls, official statements, and historical imports require verified server-side ledger and approval workflows. No balance or account status can be changed from this screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" disabled title="Unavailable until a server-side withdrawal workflow is verified" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed">
          <LockKeyhole size={16} /> Withdrawal unavailable
        </button>
        <button type="button" disabled title="Official statements require a verified ledger statement service" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed">
          <FileText size={16} /> Statement unavailable
        </button>
        <button type="button" disabled title="Historical imports require a server-side audited import service" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-400 disabled:cursor-not-allowed">
          <Upload size={16} /> Import unavailable
        </button>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-navy">Transaction records</h2>
            <p className="mt-1 text-xs text-slate-500">Most recent records returned by the account source; limit 50.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transaction records" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brass" />
          </div>
        </div>

        {transactionError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Transaction history is unavailable. This is not confirmation that no activity occurred.</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No transaction records matched this query.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((txn, index) => {
              const incoming = ['deposit', 'credit', 'transfer_in', 'interest'].includes(String(txn.type || '').toLowerCase());
              const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={txn.id || (String(txn.created_date || 'record') + '-' + index)} className="flex items-center gap-3 py-3">
                  <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' + (incoming ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{txn.description || txn.type || 'Transaction record'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{dateLabel(txn.created_date)} · {txn.status ? String(txn.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-navy">{formatRecordedAmount(txn.amount, txn.currency || txn.currency_code)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-navy">Withdrawal request records</h2>
        {requestError ? (
          <p role="status" className="mt-2 text-xs leading-5 text-amber-900">Withdrawal request history is unavailable. No pending amount is inferred.</p>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-500">{withdrawalRequests.length} request records returned. This count is not a complete queue total and no available balance is calculated from it.</p>
        )}
      </section>
    </main>
  );
}
