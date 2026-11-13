import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine, Loader2, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function InvestmentDeposits() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const records = await base44.entities.InvestmentDepositRequest.list('-created_date');
    setRequests(Array.isArray(records) ? records : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadData()
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Investment deposit requests could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  return (
    <OperationsPageLayout title="Investment Deposit Requests" description="Read-only request queue; no portfolio balance changes are made here" icon={ArrowDownToLine}>
      <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldAlert size={19} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Secure investment review workflow unavailable</p>
          <p className="mt-1">
            Requests and their recorded statuses remain visible. Approval and rejection are disabled because no verified server-side investment ledger workflow is connected. This queue will not change portfolio cash, portfolio value, or investment transactions.
          </p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>
      ) : requests.length === 0 ? (
        <div className="vantoris-glass p-12 text-center"><p className="text-gray">No deposit requests.</p></div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="vantoris-glass p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">{formatCurrency(request.amount, request.currency || request.currency_code || null)}</p>
                <p className="text-xs text-gray mt-0.5">
                  Submitted: {request.created_date?.substring(0, 10) || 'Date unavailable'} · Status: <span className="capitalize">{String(request.status || 'unknown').replace(/_/g, ' ')}</span>
                </p>
                {request.review_notes && <p className="text-xs text-gray mt-1">Notes: {request.review_notes}</p>}
              </div>
              {request.status === 'requested' && (
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Awaiting secure review workflow
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}
