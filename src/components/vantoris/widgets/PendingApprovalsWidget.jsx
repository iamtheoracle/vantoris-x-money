import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { FileText, ArrowUpRight, ShieldCheck, ChevronRight } from 'lucide-react';

export default function PendingApprovalsWidget() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [apps, withdrawals, verifications, transactions] = await Promise.all([
          base44.entities.Application.list('-created_date', 100).catch(() => []),
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }).catch(() => []),
          base44.entities.VerificationRequest.filter({ status: 'pending' }).catch(() => []),
          base44.entities.Transaction.list('-created_date', 100).catch(() => []),
        ]);
        const applications = Array.isArray(apps) ? apps : [];
        const pendingWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
        const pendingVerifications = Array.isArray(verifications) ? verifications : [];
        const txns = Array.isArray(transactions) ? transactions : [];
        const rows = [
          { label: 'Applications', count: applications.filter(a => a.application_status === 'pending').length, path: '/operations/applications', icon: FileText },
          { label: 'Payment reviews', count: txns.filter(t => ['pending','requested','review'].includes(String(t.status || '').toLowerCase())).length, path: '/operations/approvals', icon: ArrowUpRight },
          { label: 'Withdrawals', count: pendingWithdrawals.length, path: '/operations/withdrawals', icon: ArrowUpRight },
          { label: 'Verifications', count: pendingVerifications.length, path: '/operations/verification-requests', icon: ShieldCheck },
          { label: 'KYC reviews', count: applications.filter(a => a.kyc_status === 'pending').length, path: '/operations/kyc', icon: ShieldCheck },
        ];
        if (active) setItems(rows);
      } catch (error) { console.error('Approvals snapshot unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="vantoris-glass-premium h-48 rounded-2xl p-5" role="status">Loading approvals…</div>;
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Pending approvals snapshot</h3><span className="rounded-full border border-crimson/20 bg-crimson/10 px-2.5 py-0.5 text-xs font-bold text-crimson">{total} returned</span></div><div className="space-y-1">{items.map(item => { const Icon = item.icon; return <Link key={item.label} to={item.path} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"><Icon size={15} className="text-brass" /><span className="flex-1 text-sm text-foreground">{item.label}</span><span className={'text-sm font-bold ' + (item.count ? 'text-crimson' : 'text-gray/40')}>{item.count}</span><ChevronRight size={14} className="text-gray/30" /></Link>; })}</div><p className="mt-3 text-[11px] text-gray/70">Counts reflect records returned by connected backend queries, not a guaranteed complete queue total.</p></section>;
}