import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Snowflake, ShieldX } from 'lucide-react';

export default function HighPriorityCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [withdrawals, accounts, apps] = await Promise.all([
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }).catch(() => []),
          base44.entities.Account.list('-created_date', 200).catch(() => []),
          base44.entities.Application.list('-created_date', 50).catch(() => []),
        ]);
        const rows = [];
        (Array.isArray(withdrawals) ? withdrawals : []).filter(w => Math.abs(Number(w.amount) || 0) >= 10000).slice(0, 5).forEach(w => rows.push({ id: w.id, type: 'High-value withdrawal review', detail: formatCurrency(Math.abs(Number(w.amount) || 0)), icon: ArrowUpRight, path: '/operations/withdrawals' }));
        (Array.isArray(accounts) ? accounts : []).filter(a => a.status === 'frozen').slice(0, 3).forEach(a => rows.push({ id: a.id, type: 'Frozen account', detail: a.account_name || 'Account record', icon: Snowflake, path: '/operations/accounts' }));
        (Array.isArray(apps) ? apps : []).filter(a => a.kyc_status === 'rejected').slice(0, 3).forEach(a => rows.push({ id: a.id, type: 'Rejected KYC review', detail: a.full_name || 'Applicant record', icon: ShieldX, path: '/operations/kyc' }));
        if (active) setCases(rows.slice(0, 8));
      } catch (error) { console.error('Priority case snapshot unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="vantoris-glass-premium h-48 rounded-2xl p-5" role="status">Loading priority cases…</div>;
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-crimson" /><h3 className="text-sm font-semibold text-foreground">Priority review flags</h3>{cases.length > 0 && <span className="ml-auto rounded-full border border-crimson/20 bg-crimson/10 px-2 py-0.5 text-[10px] font-bold text-crimson">{cases.length}</span>}</div>{cases.length === 0 ? <div className="py-6 text-center"><ShieldX size={24} className="mx-auto mb-2 text-gray/30" /><p className="text-xs text-gray">No matching records in the returned sample</p></div> : <div>{cases.map(item => { const Icon = item.icon; return <Link key={item.id + item.type} to={item.path} className="flex items-center gap-3 rounded-lg border-b border-slate-100 px-2 py-2.5 last:border-0 hover:bg-slate-50"><Icon size={14} className="text-crimson" /><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-foreground">{item.type}</span><span className="block truncate text-[11px] text-gray">{item.detail}</span></span></Link>; })}</div>}<p className="mt-3 text-[11px] text-gray/70">Review flags are based on records returned by the connected backend; they are not a substitute for a complete risk review.</p></section>;
}