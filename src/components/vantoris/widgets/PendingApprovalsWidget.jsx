import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowUpRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EMPTY_ITEMS = [
  { label: 'Applications', count: 0, path: '/operations/applications', icon: FileText },
  { label: 'Payment reviews', count: 0, path: '/operations/approvals', icon: ArrowUpRight },
  { label: 'Withdrawals', count: 0, path: '/operations/withdrawals', icon: ArrowUpRight },
  { label: 'Verifications', count: 0, path: '/operations/verification-requests', icon: ShieldCheck },
  { label: 'KYC reviews', count: 0, path: '/operations/kyc', icon: ShieldCheck },
];

export default function PendingApprovalsWidget() {
  const [items, setItems] = useState(EMPTY_ITEMS);
  const [status, setStatus] = useState('loading');

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
      const [appsResult, withdrawalsResult, verificationsResult, transactionsResult] = await Promise.all([
        safeList(base44.entities.Application.list('-created_date', 100)),
        safeList(base44.entities.WithdrawalRequest.filter({ status: 'pending' })),
        safeList(base44.entities.VerificationRequest.filter({ status: 'pending' })),
        safeList(base44.entities.Transaction.list('-created_date', 100)),
      ]);
      const failed = [appsResult, withdrawalsResult, verificationsResult, transactionsResult].some((result) => result.failed);
      if (!active) return;
      if (failed) {
        setStatus('unavailable');
        return;
      }

      const applications = appsResult.rows;
      const transactions = transactionsResult.rows;
      setItems([
        { label: 'Applications', count: applications.filter((a) => a.application_status === 'pending').length, path: '/operations/applications', icon: FileText },
        { label: 'Payment reviews', count: transactions.filter((t) => ['pending', 'requested', 'review'].includes(String(t.status || '').toLowerCase())).length, path: '/operations/approvals', icon: ArrowUpRight },
        { label: 'Withdrawals', count: withdrawalsResult.rows.length, path: '/operations/withdrawals', icon: ArrowUpRight },
        { label: 'Verifications', count: verificationsResult.rows.length, path: '/operations/verification-requests', icon: ShieldCheck },
        { label: 'KYC reviews', count: applications.filter((a) => a.kyc_status === 'pending').length, path: '/operations/kyc', icon: ShieldCheck },
      ]);
      setStatus('ready');
    })();

    return () => { active = false; };
  }, []);

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pending approvals snapshot</h3>
        {status === 'ready' && (
          <span className="rounded-full border border-crimson/20 bg-crimson/10 px-2.5 py-0.5 text-xs font-bold text-crimson">
            {total} returned
          </span>
        )}
      </div>
      {status === 'loading' ? (
        <p className="py-5 text-center text-xs text-gray">Checking approval records…</p>
      ) : status === 'unavailable' ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          One or more approval sources could not be retrieved. Counts are withheld; zero must not be inferred.
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.path} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                <Icon size={15} className="text-brass" />
                <span className="flex-1 text-sm text-foreground">{item.label}</span>
                <span className={'text-sm font-bold ' + (item.count ? 'text-crimson' : 'text-gray/40')}>{item.count}</span>
                <ChevronRight size={14} className="text-gray/30" />
              </Link>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-gray/70">Counts reflect bounded records returned by backend queries, not a guaranteed complete queue total.</p>
    </section>
  );
}
