import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2, ChevronRight, CircleAlert, Loader2, RefreshCw, Send, ShieldCheck, Wallet } from 'lucide-react';
import { centsToDecimal, formatCurrency } from '@/lib/formatCurrency';
import { useAuth } from '@/lib/AuthContext';

function readCsrfCookie() {
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('__Host-vantoris_csrf='));
  return item ? decodeURIComponent(item.slice('__Host-vantoris_csrf='.length)) : '';
}

function amountToCents(value) {
  const match = /^(?:0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(String(value || '').trim());
  if (!match) return null;
  const [wholeText, fractionText = ''] = String(value).trim().split('.');
  const cents = BigInt(wholeText) * 100n + BigInt(fractionText.padEnd(2, '0'));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(cents);
}

function accountTitle(account) {
  return account.account_name || String(account.account_type || 'Account').replace(/_/g, ' ');
}

export default function MoveMoney() {
  const [searchParams] = useSearchParams();
  const { refreshMemberData } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transferLimits, setTransferLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [receiverAccountReference, setReceiverAccountReference] = useState(searchParams.get('to') || '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const idempotencyKey = useRef(null);

  const eligibleAccounts = useMemo(
    () => accounts.filter(account => account.currency === 'USD' && account.status === 'active'),
    [accounts],
  );

  const sourceAccount = useMemo(
    () => eligibleAccounts.find(account => account.id === sourceAccountId) || null,
    [eligibleAccounts, sourceAccountId],
  );

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/member-auth?action=me', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Your account records could not be verified.');
      const data = await response.json();
      if (!Array.isArray(data.accounts)) throw new Error('Vantoris returned an invalid account response.');
      setAccounts(data.accounts);
      setTransferLimits(data.transferLimits || null);
      const eligible = data.accounts.filter(account => account.currency === 'USD' && account.status === 'active');
      setSourceAccountId(current => current && eligible.some(account => account.id === current)
        ? current
        : eligible[0]?.id || '');
    } catch (error) {
      setLoadError(error.message || 'Account information is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  function resetIdempotency() {
    idempotencyKey.current = null;
    setMessage(null);
  }

  async function submitTransfer(event) {
    event.preventDefault();
    setMessage(null);
    const cents = amountToCents(amount);
    if (!sourceAccount || !receiverAccountReference.trim() || !cents) {
      setMessage({ type: 'error', text: 'Choose a source account, enter the recipient account reference and provide a valid amount.' });
      return;
    }
    if (sourceAccount.accountReference === receiverAccountReference.trim()) {
      setMessage({ type: 'error', text: 'Choose a different Vantoris account as the recipient.' });
      return;
    }

    if (!idempotencyKey.current) idempotencyKey.current = window.crypto.randomUUID();
    setSubmitting(true);
    try {
      const response = await fetch('/api/member-auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': readCsrfCookie(),
          'idempotency-key': idempotencyKey.current,
        },
        body: JSON.stringify({
          action: 'transfer',
          sourceAccountReference: sourceAccount.accountReference,
          receiverAccountReference: receiverAccountReference.trim(),
          amountCents: cents,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errors = {
          insufficient_available_funds: 'There are not enough available funds in this account.',
          idempotency_conflict: 'This transfer reference was already used for different details. Start a new transfer.',
          authentication_required: 'Your session has expired. Sign in again.',
          csrf_invalid: 'Your security token expired. Refresh the page and try again.',
          forbidden: 'This account is not authorized for the requested transfer.',
          recipient_must_be_another_member: 'Transfers must be sent to another Vantoris member, not another account you own.',
          recipient_account_not_found: 'The recipient Vantoris account reference could not be found.',
          member_account_unavailable: 'One of the member accounts is not currently active for transfers.',
          member_transfer_limit_not_configured: 'Vantoris has not approved a transfer limit for this account yet.',
          member_single_transfer_limit_exceeded: 'This amount exceeds your approved single-transfer limit.',
          member_daily_transfer_limit_exceeded: 'This transfer would exceed your approved daily limit.',
        };
        throw new Error(errors[result.error] || 'The transfer could not be posted. No successful posting is confirmed.');
      }
      if (result.transfer?.status !== 'posted' || !result.transfer?.journalId) {
        throw new Error('Vantoris did not return a posted journal confirmation.');
      }
      setMessage({
        type: 'success',
        text: result.transfer.duplicate
          ? 'This transfer was already posted. No second journal was created.'
          : 'Transfer posted to the Vantoris ledger.',
      });
      idempotencyKey.current = null;
      setAmount('');
      setReceiverAccountReference('');
      await loadAccounts();
      await refreshMemberData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'The transfer could not be completed. Retry safely using the same details.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6">
      <header className="mb-7">
        <p className="text-sm text-slate-500">Vantoris · Member accounts</p>
        <h1 className="mt-1 text-3xl font-bold text-navy">Internal transfer</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Move funds between Vantoris member accounts. The hold, balanced journal, hold capture and audit record are committed in one Vantoris PostgreSQL transaction.
        </p>
      </header>

      <section className="mb-6 flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={21} />
        <div>
          <h2 className="text-sm font-semibold text-navy">Vantoris internal books</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            This transfer does not use a sponsor bank, Plaid, ACH, Fedwire, a card processor or an external payment API. It is not an external payment.
          </p>
        </div>
      </section>

      {loadError ? (
        <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 text-amber-800" size={20} />
            <div className="flex-1">
              <h2 className="font-semibold text-amber-950">Account information unavailable</h2>
              <p className="mt-1 text-sm text-amber-900/80">{loadError}</p>
              <button type="button" onClick={loadAccounts} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white">
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          </div>
        </section>
      ) : eligibleAccounts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Wallet className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-navy">No active account with a verified USD currency record</h2>
          <p className="mt-1 text-sm text-slate-500">Only active Vantoris accounts with a recorded USD currency can be used for an internal transfer. Other account records remain unchanged.</p>
        </section>
      ) : eligibleAccounts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Wallet className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-navy">No eligible transfer account</h2>
          <p className="mt-1 text-sm text-slate-500">No active account with a verified USD currency record is available for internal transfers.</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-navy">Your Vantoris accounts</h2>
              <span className="text-xs text-slate-500">{eligibleAccounts.length} eligible</span>
            </div>
            <div className="space-y-3">
              {eligibleAccounts.map(account => (
                <button key={account.id} type="button" onClick={() => { setSourceAccountId(account.id); resetIdempotency(); }}
                  className={`w-full rounded-xl border p-4 text-left transition ${sourceAccountId === account.id ? 'border-navy bg-slate-50 ring-1 ring-navy/10' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5 text-navy"><Wallet size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm capitalize text-navy">{accountTitle(account)}</strong>
                      <span className="mt-1 block text-xs text-slate-500">{account.mask || 'Account reference unavailable'}</span>
                    </span>
                    <span className="text-right">
                      <strong className="block text-sm tabular-nums text-navy">{formatCurrency(account.availableBalance, account.currency || account.currency_code || null)}</strong>
                      <span className="text-[11px] text-slate-500">Available</span>
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={submitTransfer} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white"><ArrowLeftRight size={20} /></span>
              <div>
                <h2 className="font-semibold text-navy">Send to a member</h2>
                <p className="text-xs text-slate-500">Vantoris account to Vantoris account</p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">From account</label>
            <select value={sourceAccountId} onChange={event => { setSourceAccountId(event.target.value); resetIdempotency(); }}
              className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-navy outline-none focus:border-navy">
              {accounts.map(account => <option key={account.id} value={account.id}>{accountTitle(account)} · {account.mask}</option>)}
            </select>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Recipient account reference</label>
            <input value={receiverAccountReference} onChange={event => { setReceiverAccountReference(event.target.value); resetIdempotency(); }}
              autoComplete="off" spellCheck="false" maxLength={160} placeholder="Enter the recipient's Vantoris account reference"
              className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-navy outline-none focus:border-navy" />

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Amount (USD)</label>
            <div className="mb-4 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-navy">
              <span className="text-slate-500">$</span>
              <input value={amount} onChange={event => { setAmount(event.target.value); resetIdempotency(); }}
                inputMode="decimal" autoComplete="off" placeholder="0.00"
                className="w-full border-0 bg-transparent px-2 py-3 text-lg font-semibold tabular-nums text-navy outline-none" />
            </div>

            {transferLimits ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex justify-between gap-3 text-xs text-slate-600">
                  <span>Approved single-transfer limit</span><span className="font-semibold tabular-nums text-navy">{formatCurrency(transferLimits.singleLimit, 'USD')}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-xs text-slate-600">
                  <span>Remaining daily limit</span><span className="font-semibold tabular-nums text-navy">{formatCurrency(centsToDecimal(transferLimits.remainingTodayCents), 'USD')}</span>
                </div>
              </div>
            ) : (
              <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                A Vantoris-approved transfer limit is not configured for this member. Transfers remain unavailable until staff approve one.
              </div>
            )}

            {sourceAccount && (
              <div className="mb-5 rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between gap-3 text-xs text-slate-600">
                  <span>Posted balance</span><span className="font-semibold tabular-nums">{formatCurrency(sourceAccount.balance, sourceAccount.currency || sourceAccount.currency_code || null)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-xs text-slate-600">
                  <span>Active holds</span><span className="font-semibold tabular-nums">{formatCurrency(centsToDecimal(sourceAccount.activeHoldCents), sourceAccount.currency || sourceAccount.currency_code || null)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2 text-xs text-slate-600">
                  <span>Available balance</span><span className="font-semibold tabular-nums text-navy">{formatCurrency(sourceAccount.availableBalance, sourceAccount.currency || sourceAccount.currency_code || null)}</span>
                </div>
              </div>
            )}

            {message && (
              <div role="status" className={`mb-4 rounded-xl p-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                <div className="flex items-start gap-2">
                  {message.type === 'success' ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <CircleAlert size={17} className="mt-0.5 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || !sourceAccount || sourceAccount.availableBalanceCents === null || sourceAccount.availableBalanceCents === undefined || !transferLimits}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-sm font-semibold text-white transition hover:bg-[#17365C] disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {submitting ? 'Posting transfer…' : 'Confirm internal transfer'}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
              The transfer posts only if Vantoris verifies both accounts, active membership and sufficient available funds.
            </p>
          </form>
        </div>
      )}
    </main>
  );
}
