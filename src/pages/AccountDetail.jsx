import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function centsToDecimal(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
  const raw = String(value);
  if (!/^-?\\d+$/.test(raw)) return null;
  const cents = BigInt(raw);
  return (cents / 100n).toString() + '.' + String(cents % 100n).padStart(2, '0');
}

function readCsrfCookie() {
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('__Host-vantoris_csrf='));
  return item ? decodeURIComponent(item.slice('__Host-vantoris_csrf='.length)) : '';
}

function dateLabel(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return dateInputValue(date);
  });
  const [to, setTo] = useState(() => dateInputValue(new Date()));
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState('');

  const loadData = useCallback(async () => {
    const response = await fetch(`/api/member-auth?action=account&id=${encodeURIComponent(id)}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 404
      ? 'This account is not available to the current member session.'
      : 'Vantoris could not verify this account record.');
    if (!data.account?.id || !Array.isArray(data.transactions)) throw new Error('Vantoris returned an invalid account response.');
    setAccount(data.account);
    setTransactions(data.transactions);
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    loadData().catch(error => {
      if (active) setLoadError(error.message || 'Account information is unavailable.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadData, attempt]);

  async function downloadStatement(event) {
    event.preventDefault();
    setStatementError('');
    if (!from || !to || from > to) {
      setStatementError('Choose a valid statement date range.');
      return;
    }
    setStatementLoading(true);
    try {
      const response = await fetch('/api/member-auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': readCsrfCookie(),
        },
        body: JSON.stringify({ action: 'statement', accountId: id, from, to }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error === 'csrf_invalid'
          ? 'Your security token expired. Refresh the page and try again.'
          : error.error === 'account_not_found'
            ? 'This account is not available to the current member session.'
            : 'Vantoris could not generate the statement.');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `vantoris-statement-${id}-${from}-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setStatementError(error.message || 'Statement generation failed.');
    } finally {
      setStatementLoading(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  }

  if (loadError || !account) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-12">
        <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-navy">Account information unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError || 'The account record could not be verified.'}</p>
          <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">
            <RefreshCw size={15} /> Try again
          </button>
          <Link to="/accounts" className="ml-3 text-sm font-semibold text-navy">Return to accounts</Link>
        </section>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-5 pb-28 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/accounts')} aria-label="Back to accounts" className="rounded-xl border border-slate-200 bg-white p-2.5 text-navy hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs text-slate-500">Vantoris · Member accounts</p>
          <h1 className="text-2xl font-semibold capitalize text-navy">{account.account_name || account.account_type || 'Account details'}</h1>
        </div>
      </div>

      <section className="mb-6 grid gap-4 lg:grid-cols-12">
        <div className="rounded-[28px] bg-[#0B2342] p-6 text-white shadow-xl lg:col-span-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Posted ledger balance</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{formatCurrency(account.balance, account.currency)}</p>
          <p className="mt-2 text-sm text-white/65">{account.account_type || 'Account'} · {account.mask || 'Account reference unavailable'}</p>
          <div className="mt-5 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/60">Active holds</p>
              <p className="mt-1 font-semibold tabular-nums">{formatCurrency(centsToDecimal(account.activeHoldCents), account.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Available balance</p>
              <p className="mt-1 font-semibold tabular-nums">{formatCurrency(account.availableBalance, account.currency)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 lg:col-span-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <h2 className="text-sm font-semibold text-navy">Ledger-backed account</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Posted balance and holds are calculated from Vantoris journal entries. This screen cannot edit a balance or account record.
              </p>
            </div>
          </div>
          <p className="mt-4 break-all text-xs text-slate-500">Account reference: {account.accountReference}</p>
        </div>
      </section>

      <section className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <FileText size={20} className="text-navy" />
          <div>
            <h2 className="font-semibold text-navy">Vantoris account statement</h2>
            <p className="mt-1 text-xs text-slate-500">Generated directly from posted ledger entries. Statement generation is recorded in the Vantoris audit log.</p>
          </div>
        </div>
        <form onSubmit={downloadStatement} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-600">
            From
            <input type="date" value={from} max={to} onChange={event => setFrom(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-navy" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            To
            <input type="date" value={to} min={from} max={dateInputValue(new Date())} onChange={event => setTo(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-navy" />
          </label>
          <button type="submit" disabled={statementLoading || !from || !to || from > to} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
            {statementLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {statementLoading ? 'Preparing…' : 'Download CSV'}
          </button>
        </form>
        {statementError && <p role="alert" className="mt-3 text-sm text-rose-700">{statementError}</p>}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-navy">Posted transaction history</h2>
          <p className="mt-1 text-xs text-slate-500">Recent journal entries for this Vantoris account.</p>
        </div>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No posted journal entries are available for this account.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(transaction => {
              const negative = String(transaction.amount || '').startsWith('-');
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{transaction.description || transaction.type}</p>
                    <p className="mt-1 text-xs text-slate-500">{dateLabel(transaction.created_date)} · {String(transaction.type || '').replace(/_/g, ' ')}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold tabular-nums ${negative ? 'text-navy' : 'text-emerald-700'}`}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
