import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';
import TodaysOperationalSummary from '@/components/vantoris/widgets/TodaysOperationalSummary';
import PendingApprovalsWidget from '@/components/vantoris/widgets/PendingApprovalsWidget';
import HighPriorityCases from '@/components/vantoris/widgets/HighPriorityCases';
import LiveBankingActivity from '@/components/vantoris/widgets/LiveBankingActivity';
import DailyEmailSummary from '@/components/vantoris/DailyEmailSummary';
import QuickActionsMenu from '@/components/vantoris/QuickActionsMenu';
import { Users, FileText, Wallet, Activity, ArrowUpRight, AlertTriangle } from 'lucide-react';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString();
}

export default function AdminOverview() {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceErrors, setSourceErrors] = useState({ users: false, applications: false, withdrawals: false, accounts: false });

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
      const [userResult, applicationResult, withdrawalResult, accountResult] = await Promise.all([
        safeList(base44.entities.User.list('-created_date', 50)),
        safeList(base44.entities.Application.list('-created_date', 50)),
        safeList(base44.entities.WithdrawalRequest.filter({ status: 'pending' })),
        safeList(base44.entities.Account.list('-created_date', 100)),
      ]);
      if (!active) return;
      setUsers(userResult.rows);
      setApplications(applicationResult.rows);
      setWithdrawals(withdrawalResult.rows);
      setAccounts(accountResult.rows);
      setSourceErrors({
        users: userResult.failed,
        applications: applicationResult.failed,
        withdrawals: withdrawalResult.failed,
        accounts: accountResult.failed,
      });
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'Authoritative ledger total', value: 'Unavailable', sublabel: 'Reconciled, currency-aware aggregate required', icon: Wallet, accent: 'navy', hero: true },
    { label: 'User records returned', value: sourceErrors.users ? 'Unavailable' : users.length, sublabel: 'Bounded query · limit 50', icon: Users, accent: 'blue' },
    { label: 'Pending application records returned', value: sourceErrors.applications ? 'Unavailable' : applications.filter((item) => item.application_status === 'pending').length, sublabel: 'Returned set · limit 50', icon: FileText, accent: 'gold' },
    { label: 'Pending withdrawal records returned', value: sourceErrors.withdrawals ? 'Unavailable' : withdrawals.length, sublabel: 'Status-filtered query', icon: ArrowUpRight, accent: 'crimson' },
  ];

  const recentItems = [
    ...applications.slice(0, 8).map((item) => ({
      id: item.id,
      type: 'Membership application',
      name: item.full_name || item.applicant_name || 'Applicant record',
      detail: item.application_status ? String(item.application_status).replace(/_/g, ' ') : 'Status not supplied',
      date: item.created_date,
    })),
    ...withdrawals.slice(0, 8).map((item) => ({
      id: item.id,
      type: 'Withdrawal request',
      name: item.reference || 'Withdrawal request record',
      detail: item.status ? String(item.status).replace(/_/g, ' ') : 'Status not supplied',
      date: item.created_date,
    })),
  ].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    return bDate - aDate;
  }).slice(0, 8);

  if (loading) {
    return (
      <OperationsPageLayout title="Operations Overview" description="Institutional operations and review queues" breadcrumb="Operations">
        <VantorisLoading className="h-64" />
      </OperationsPageLayout>
    );
  }

  const queueUnavailable = sourceErrors.applications || sourceErrors.withdrawals;

  return (
    <OperationsPageLayout title="Operations Overview" description="Institutional operations and review queues. Financial totals are shown only when verified aggregate sources are connected." breadcrumb="Operations">
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <PremiumStatCard key={stat.label} label={stat.label} value={stat.value} sublabel={stat.sublabel} icon={stat.icon} accent={stat.accent} hero={stat.hero} />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TodaysOperationalSummary />
        <PendingApprovalsWidget />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <HighPriorityCases />
        <LiveBankingActivity />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DailyEmailSummary />
        <QuickActionsMenu />
        {sourceErrors.accounts && <span className="text-xs text-amber-700">Account records unavailable; no account total is inferred.</span>}
      </div>

      <section className="vantoris-glass-premium rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={16} className="text-navy" />
          <h3 className="text-sm font-semibold text-foreground">Recent application and withdrawal records</h3>
        </div>
        {queueUnavailable ? (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>One or more queue sources could not be retrieved. Recent records are withheld; zero activity must not be inferred.</p>
          </div>
        ) : recentItems.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray">No recent application or withdrawal records were returned.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentItems.map((item, index) => (
              <div key={item.id || (item.type + '-' + index)} className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
                  {item.type === 'Membership application' ? <FileText size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-gray">{item.type} · {item.detail}</p>
                </div>
                <p className="shrink-0 text-[10px] text-gray">{dateLabel(item.date)}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-gray/70">Record lists are bounded or status-filtered and are not a complete institutional queue or financial report.</p>
      </section>
    </OperationsPageLayout>
  );
}
