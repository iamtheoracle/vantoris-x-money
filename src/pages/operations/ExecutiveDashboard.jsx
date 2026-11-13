import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, TrendingUp, Wallet, Users, ArrowUpRight, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import TreasuryPosition from '@/components/vantoris/widgets/TreasuryPosition';
import LiveBankingActivity from '@/components/vantoris/widgets/LiveBankingActivity';
import PendingApprovalsWidget from '@/components/vantoris/widgets/PendingApprovalsWidget';
import AIRecommendationsWidget from '@/components/vantoris/widgets/AIRecommendationsWidget';
import SystemHealthWidget from '@/components/vantoris/widgets/SystemHealthWidget';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';

function AggregateUnavailable({ title, explanation }) {
  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Verified aggregate unavailable</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray">{explanation}</p>
    </section>
  );
}

export default function ExecutiveDashboard() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityUnavailable, setActivityUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    base44.entities.AuditLog.list('-created_date', 15)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Audit log query returned an invalid shape.');
        if (active) {
          setRecentActivity(rows.slice(0, 8).map((log) => ({
            id: log.id,
            action: log.action_type ? String(log.action_type).replace(/_/g, ' ') : 'Action not supplied',
            description: log.description || '',
            admin: log.admin_name || 'Actor not supplied',
            date: log.created_date,
          })));
        }
      })
      .catch(() => {
        if (active) setActivityUnavailable(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <OperationsPageLayout title="Executive Dashboard" description="Institutional overview with verified data only" icon={Crown} breadcrumb="Executive Workspace">
        <VantorisLoading className="h-64" />
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Executive Dashboard" description="Institutional overview — financial and growth metrics appear only when authoritative aggregate sources are connected." icon={Crown} breadcrumb="Executive Workspace">
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumStatCard hero label="Authoritative ledger total" value="Unavailable" sublabel="Verified currency-aware aggregate not connected" icon={Wallet} accent="navy" />
        <PremiumStatCard label="Monthly account growth" value="Unavailable" sublabel="Complete membership lifecycle aggregate required" icon={Users} accent="blue" />
        <PremiumStatCard label="Investment volume" value="Unavailable" sublabel="Verified investment records and currency model required" icon={TrendingUp} accent="gold" />
        <PremiumStatCard label="Settled payment volume" value="Unavailable" sublabel="Provider settlement and reconciliation evidence required" icon={ArrowUpRight} accent="crimson" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AggregateUnavailable
          title="Monthly account growth"
          explanation="The current client-side record queries are bounded and cannot establish complete monthly membership growth. This chart remains empty until a server-side aggregate uses the authoritative membership lifecycle."
        />
        <AggregateUnavailable
          title="Investment volume"
          explanation="Investment volume requires verified portfolio, transaction, currency, valuation, and lifecycle records. No sample or estimated values are displayed."
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TreasuryPosition />
        <LiveBankingActivity />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PendingApprovalsWidget />
        <AIRecommendationsWidget />
        <SystemHealthWidget />
      </div>

      <section className="vantoris-glass-premium rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-navy" />
            <h3 className="text-sm font-semibold text-foreground">Recent governance activity</h3>
          </div>
          <Link to="/operations/audit-logs" className="flex items-center gap-1 text-xs font-medium text-navy hover:underline">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {activityUnavailable ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            Audit records are unavailable. This is not confirmation that no governance activity occurred.
          </p>
        ) : recentActivity.length === 0 ? (
          <div className="py-8 text-center">
            <Activity size={24} className="mx-auto mb-2 text-gray/30" />
            <p className="text-xs text-gray">No audit records were returned by the current query.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {recentActivity.map((item, index) => {
              const date = item.date ? new Date(item.date) : null;
              const dateLabel = date && !Number.isNaN(date.getTime())
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Date not supplied';
              return (
                <div key={item.id || (item.action + '-' + index)} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-navy/10 bg-navy/8">
                    <Activity size={14} className="text-navy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize text-foreground">{item.action}</p>
                    <p className="truncate text-xs text-gray">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] text-gray">{item.admin}</p>
                    <p className="text-[10px] text-gray/60">{dateLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </OperationsPageLayout>
  );
}
