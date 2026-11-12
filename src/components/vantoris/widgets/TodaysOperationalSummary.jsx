import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, FileText, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TodaysOperationalSummary() {
  const [data, setData] = useState(null);
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
      const [transactions, applications, withdrawals, verifications] = await Promise.all([
        safeList(base44.entities.Transaction.list('-created_date', 50)),
        safeList(base44.entities.Application.list('-created_date', 20)),
        safeList(base44.entities.WithdrawalRequest.filter({ status: 'pending' })),
        safeList(base44.entities.VerificationRequest.filter({ status: 'pending' })),
      ]);
      if (!active) return;
      if ([transactions, applications, withdrawals, verifications].some((result) => result.failed)) {
        setStatus('unavailable');
        return;
      }
      setData({
        transactions: transactions.rows.length,
        applications: applications.rows.length,
        withdrawals: withdrawals.rows.length,
        verifications: verifications.rows.length,
      });
      setStatus('ready');
    })();
    return () => { active = false; };
  }, []);

  const metrics = data ? [
    { label: 'Recent transaction records returned', value: data.transactions, note: 'Bounded query · limit 50', icon: Activity, color: 'text-brass' },
    { label: 'Application records returned', value: data.applications, note: 'Bounded query · limit 20', icon: FileText, color: 'text-navy' },
    { label: 'Pending withdrawal records returned', value: data.withdrawals, note: 'Status-filtered query', icon: ArrowUpRight, color: 'text-crimson' },
    { label: 'Pending verification records returned', value: data.verifications, note: 'Status-filtered query', icon: ShieldCheck, color: 'text-emerald-700' },
  ] : [];

  return (
    <section className="vantoris-glass-premium rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={16} className="text-brass" />
        <h3 className="text-sm font-semibold text-foreground">Operational record snapshot</h3>
      </div>
      {status === 'loading' ? (
        <p className="py-5 text-center text-xs text-gray">Loading operational records…</p>
      ) : status === 'unavailable' ? (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>One or more operational record sources could not be retrieved. Counts are withheld; zero must not be inferred.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} className={metric.color} />
                  <span className="text-[10px] leading-4 text-gray">{metric.label}</span>
                </div>
                <p className="text-xl font-bold text-navy">{metric.value}</p>
                <p className="mt-1 text-[10px] text-gray/70">{metric.note}</p>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-[11px] text-gray/70">Counts reflect records returned by bounded or status-filtered queries. No balance, ledger volume, or settled payment total is calculated.</p>
    </section>
  );
}
