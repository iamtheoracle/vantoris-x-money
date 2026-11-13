import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { FileText, Users, TrendingUp, Wallet, Activity, Download, AlertTriangle } from 'lucide-react';

const REPORTS = [
  { label: 'Monthly account growth', icon: Users, requirement: 'Complete membership lifecycle events and a server-side monthly aggregate.' },
  { label: 'Investment volume', icon: TrendingUp, requirement: 'Complete investment ledger, currency normalization, valuation, and reconciliation.' },
  { label: 'Assets under management', icon: Wallet, requirement: 'Verified portfolio valuations and historical valuation snapshots.' },
  { label: 'Settled payment volume', icon: Activity, requirement: 'Provider settlement events matched to immutable ledger entries.' },
];

function ReportPlaceholder({ title, requirement }) {
  return (
    <section className="vantoris-card rounded-2xl p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-[#526071] bg-[#0D1928]">
        <p className="text-sm font-semibold text-[#AAB4C3]">Report data unavailable</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#AAB4C3]">{requirement}</p>
    </section>
  );
}

export default function ExecutiveReports() {
  return (
    <OperationsPageLayout
      title="Executive reports"
      description="Institutional reporting workspace. Reports and exports are released only from complete, reconciled sources."
      icon={FileText}
      actions={<button type="button" disabled title="Requires verified server-side reporting and export service" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"><Download size={14} /> Report export unavailable</button>}
    >
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Executive report generation is unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Earlier client-side reports derived totals from bounded record queries and assumed a single currency. Those results are not complete financial statements, institutional KPIs, or settlement evidence. No sample report or fabricated chart is shown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.label}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#AAB4C3]"><Icon size={14} /> {report.label}</div>
              <ReportPlaceholder title={report.label} requirement={report.requirement} />
            </div>
          );
        })}
      </div>
    </OperationsPageLayout>
  );
}
