import React, { useEffect, useMemo, useState } from 'react';
import { Search, Wallet, AlertTriangle } from 'lucide-react';
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

function safeDate(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
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
      const [requestResult, accountResult] = await Promise.all([
        safeList(base44.entities.WithdrawalRequest.list('-created_date', 100)),
        safeList(base44.entities.Account.list('-created_date', 200)),
      ]);
      if (!active) return;
      setRequests(requestResult.rows);
      setAccounts(accountResult.rows);
      setRequestsError(requestResult.failed);
      setAccountsError(accountResult.failed);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) => [request.status, request.account_id, request.reference, request.beneficiary_name].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [requests, search]);

  return (
    <OperationsPageLayout title="Withdrawal requests" description="Read-only withdrawal request records. No approval, rejection, debit, or bank submission is performed here." icon={Wallet} breadcrumb="Operations">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Withdrawal decisions are unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Approval and rejection require a server-side dual-control workflow, authoritative ledger reservation, immutable audit evidence, and verified settlement handling. A request record is not a completed or submitted withdrawal.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-2xl font-semibold text-navy">{requestsError ? 'Unavailable' : requests.length}</p>
        <p className="mt-1 text-xs text-slate-500">Withdrawal request records returned (limit 100)</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-navy">Request records</h2>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search returned requests" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brass" />
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading withdrawal request records…</p>
        ) : requestsError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Withdrawal request records are unavailable. Zero pending requests must not be inferred.</p>
        ) : filteredRequests.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No withdrawal request records matched this query.</p>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const account = accountById.get(request.account_id);
              const currency = request.currency || request.currency_code || account?.currency || account?.currency_code;
              return (
                <article key={request.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{request.reference || 'Withdrawal request'}</p>
                      <p className="mt-1 text-xs text-slate-500">{account?.account_name || account?.account_type || (accountsError ? 'Account record unavailable' : 'Account record not returned')}</p>
                      <p className="mt-1 text-xs text-slate-500">{safeDate(request.created_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-navy">{amountLabel(request.amount, currency)}</p>
                      <p className="mt-1 text-xs capitalize text-slate-500">{request.status ? String(request.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                    </div>
                  </div>
                  {request.beneficiary_name && <p className="mt-3 text-xs text-slate-600">Beneficiary: {request.beneficiary_name}</p>}
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-400">Records are displayed as returned. No balance is deducted, reserved, or marked as settled by this page.</p>
      </section>
    </OperationsPageLayout>
  );
}
