import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { TrendingUp, Wallet, Activity, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

const METRICS = [
  { label: 'Current AUM', icon: Wallet, note: 'Verified portfolio valuation and currency model required' },
  { label: 'Peak AUM', icon: TrendingUp, note: 'Complete historical valuation series required' },
  { label: 'Investment inflows', icon: ArrowUpRight, note: 'Reconciled investment ledger required' },
  { label: 'Investment outflows', icon: ArrowDownRight, note: 'Reconciled investment ledger required' },
];

function UnavailableChart({ title, description }) {
  return (
    <section className="vantoris-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={17} className="text-brass" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[#526071] bg-[#0D1928]">
        <p className="text-sm font-semibold text-[#AAB4C3]">Verified chart data unavailable</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#AAB4C3]">{description}</p>
    </section>
  );
}

export default function AumGrowth() {
  return (
    <OperationsPageLayout title="AUM & investment growth" description="Portfolio analytics are withheld until authoritative valuation and ledger aggregates are available." icon={TrendingUp}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">AUM and growth calculations are not verified</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            The previous client-side charts summed bounded transaction and account records, assumed a single currency, and reconstructed balances without a complete opening ledger. Those calculations are not an authoritative AUM or performance series and are not displayed.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <section key={metric.label} className="vantoris-card rounded-2xl p-5">
              <Icon size={18} className="mb-3 text-brass" />
              <p className="text-xl font-bold text-white">Unavailable</p>
              <p className="mt-1 text-xs text-[#AAB4C3]">{metric.label}</p>
              <p className="mt-2 text-[10px] leading-4 text-[#AAB4C3]/70">{metric.note}</p>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <UnavailableChart title="Assets under management over time" description="Requires complete, reconciled portfolio valuations with currency conversion methodology, corporate actions, fees, deposits, withdrawals, and valuation timestamps." />
        <UnavailableChart title="Monthly investment volume" description="Requires complete investment transaction records, consistent transaction classification, currency normalization, and settlement reconciliation. No partial query is plotted." />
      </div>
    </OperationsPageLayout>
  );
}
