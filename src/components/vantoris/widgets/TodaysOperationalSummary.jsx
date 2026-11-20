import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Snapshot only: values are derived from bounded records returned by the backend. */
export default function TodaysOperationalSummary() {
  const [data, setData] = useState({ transactionCount: 0, recentVolume: 0, applicationCount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [transactions, applications, withdrawals, verifications] = await Promise.all([
          base44.entities.Transaction.list('-created_date', 50).catch(() => []),
          base44.entities.Application.list('-created_date', 20).catch(() => []),
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }).catch(() => []),
          base44.entities.VerificationRequest.filter({ status: 'pending' }).catch(() => []),
        ]);
        const txns = Array.isArray(transactions) ? transactions : [];
        const apps = Array.isArray(applications) ? applications : [];
        const pendingWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
        const pendingVerifications = Array.isArray(verifications) ? verifications : [];
        if (active) setData({
          transactionCount: txns.length,
          recentVolume: txns.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0),
          applicationCount: apps.length,
          pendingCount: apps.filter((application) => application.application_status === 'pending').length + pendingWithdrawals.length + pendingVerifications.length,
        });
      } catch (error) {
        console.error('Operations snapshot unavailable', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="vantoris-glass-premium h-32 rounded-2xl p-5" role="status">Loading operations snapshot…</div>;
  const metrics = [
    { label: 'Recent transaction records', value: data.transactionCount },
    { label: 'Volume in returned sample', value: formatCurrency(data.recentVolume) },
    { label: 'Recent applications', value: data.applicationCount },
  ];
  return (
    <section className="vantoris-glass-premium rounded-2xl p-5" aria-label="Operations snapshot">
      <div className="mb-4 flex items-center gap-2"><Activity size={16} className="text-navy" /><h3 className="text-sm font-semibold text-foreground">Operations snapshot</h3></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => <div key={metric.label}><p className="break-words text-xl font-bold text-foreground">{metric.value}</p><p className="mt-1 text-xs text-gray">{metric.label}</p></div>)}
        <Link to="/operations/applications" className="group"><p className="text-xl font-bold text-crimson group-hover:underline">{data.pendingCount}</p><p className="mt-1 text-xs text-gray">Pending items returned</p></Link>
      </div>
      <p className="mt-4 text-[11px] text-gray/70">Counts and volume reflect the records returned by connected backend queries, not a guaranteed complete ledger total.</p>
    </section>
  );
}
