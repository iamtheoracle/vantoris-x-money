import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpRight, ShieldAlert } from 'lucide-react';

const PENDING = new Set(['pending', 'requested', 'review']);

function isPending(item) {
  return PENDING.has(String(item?.status || '').toLowerCase());
}

function destinationForTransaction(transaction) {
  if (transaction.type === 'deposit') return '/operations/deposits';
  if (transaction.type === 'withdrawal') return '/operations/withdrawals';
  return '/operations/transfers';
}

export default function Approvals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const user = await base44.auth.me();
    const [transactions, notifications] = await Promise.all([
      base44.entities.Transaction.list('-created_date', 200),
      base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 100),
    ]);
    if (!user?.id || !Array.isArray(transactions) || !Array.isArray(notifications)) {
      throw new Error('Review sources returned an invalid response.');
    }

    const pendingTransactions = (Array.isArray(transactions) ? transactions : [])
      .filter(isPending)
      .map((transaction) => ({
        kind: 'transaction',
        id: transaction.id,
        title: transaction.type || 'Transaction',
        detail: transaction.description || 'No description supplied',
        amount: transaction.amount,
        status: transaction.status || 'Status not supplied',
        currency: transaction.currency || transaction.currency_code || null,
        createdDate: transaction.created_date,
        destination: destinationForTransaction(transaction),
      }));

    const pendingRequests = (Array.isArray(notifications) ? notifications : [])
      .filter((notification) =>
        /request/i.test(`${notification.title || ''} ${notification.message || ''}`) &&
        isPending(notification)
      )
      .map((notification) => ({
        kind: 'request',
        id: notification.id,
        title: notification.title || 'Service request',
        detail: notification.message || 'No request details supplied',
        amount: null,
        status: notification.status || 'Status not supplied',
        currency: null,
        createdDate: notification.created_date,
        destination: '/operations/service-requests',
      }));

    setItems([...pendingTransactions, ...pendingRequests]);
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Could not load the read-only approvals inbox.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5EF] px-5 pb-12 pt-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Operations · Review inbox</p>
      <h1 className="mt-1 text-3xl font-bold text-navy">Approvals</h1>
      <p className="mt-1 text-sm text-slate-500">
        Read-only view of the 200 newest transaction records and 100 newest notification records. Financial decisions are handled only by dedicated server-authorized workflows.
      </p>

      <div role="status" className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldAlert size={19} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Read-only review inbox</p>
          <p className="mt-1">
            This screen cannot approve, reject, post, or change an account balance. Legacy transaction mutations have been removed from the browser. Open the relevant operational queue to check whether a verified workflow is available.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/operations/deposits" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy">
          <ArrowDownToLine size={15} /> Deposits
        </Link>
        <Link to="/operations/withdrawals" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy">
          <ArrowUpRight size={15} /> Withdrawals
        </Link>
        <Link to="/operations/transfers" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy">
          <ArrowLeftRight size={15} /> Transfers
        </Link>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading review records…</div>
        ) : items.length ? (
          items.map((item) => (
            <article key={`${item.kind}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-brass">{item.title}</p>
                  <p className="mt-1 break-words font-semibold text-navy">{item.detail}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.createdDate ? new Date(item.createdDate).toLocaleString() : 'Date unavailable'} · {item.status}
                  </p>
                </div>
                {item.amount != null && <p className="shrink-0 text-sm font-semibold tabular-nums text-navy">{formatCurrency(item.amount, item.currency)}</p>}
              </div>
              <div className="mt-3 flex justify-end">
                <Link to={item.destination} className="text-sm font-semibold text-navy underline underline-offset-4">
                  Open relevant queue
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
            No pending review records were returned by the current bounded queries.
          </div>
        )}
      </div>
    </div>
  );
}
