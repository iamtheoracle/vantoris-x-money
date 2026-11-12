import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { AlertCircle, ShieldCheck } from 'lucide-react';

const TYPES = ['Personal', 'Joint', 'Business', 'Organization'];
const value = (v) => v == null || (typeof v === 'string' && !v.trim()) ? 'Not supplied' : Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) : 'Not verified';

export default function WithdrawalLimits() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    base44.entities.WithdrawalLimit.filter({}, '-created_date', 50).then((rows) => {
      if (!Array.isArray(rows)) throw new Error('Invalid response');
      if (active) setRecords(rows);
    }).catch(() => {
      if (active) setError('Withdrawal policy records are unavailable. No policy state can be inferred.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <OperationsPageLayout title="Withdrawal policy records" description="Read-only configured policy. Changes require a server-authorized dual-approval workflow." icon={ShieldCheck}>
    <div role="status" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <AlertCircle size={19} className="mt-0.5 shrink-0" />
      <div><p className="font-semibold">Configuration changes are held</p><p className="mt-1 text-xs leading-5">Browser-side policy writes are disabled until a server workflow enforces dual approval, validation, audit logging and atomic persistence.</p></div>
    </div>
    {loading ? <p className="py-12 text-center text-[#AAB4C3]">Loading policy records…</p> : error ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p> : <div className="space-y-4">
      {TYPES.map((type) => {
        const rows = records.filter((record) => record.account_type === type);
        return <section key={type} className="vantoris-card space-y-3 p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{type} accounts</h2><span className="text-xs text-[#AAB4C3]">{rows.length} records returned</span></div>
          {!rows.length ? <p className="rounded-lg border border-dashed border-[#526071] p-4 text-sm text-[#AAB4C3]">No configuration record returned; applicable limits and active state are not verified.</p> : rows.length > 1 ? <p role="status" className="text-xs text-amber-200">Multiple records exist. Do not assume which policy is authoritative; escalate for reconciliation.</p> : <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-[#0D1928] p-3"><p className="text-[10px] text-[#AAB4C3]">Single request</p><p className="text-sm font-semibold text-white">{value(rows[0].single_limit)}</p></div>
            <div className="rounded-lg bg-[#0D1928] p-3"><p className="text-[10px] text-[#AAB4C3]">Daily limit</p><p className="text-sm font-semibold text-white">{value(rows[0].daily_limit)}</p></div>
            <div className="rounded-lg bg-[#0D1928] p-3"><p className="text-[10px] text-[#AAB4C3]">Monthly limit</p><p className="text-sm font-semibold text-white">{value(rows[0].monthly_limit)}</p></div>
            <div className="rounded-lg bg-[#0D1928] p-3"><p className="text-[10px] text-[#AAB4C3]">Policy state</p><p className="text-sm font-semibold text-white">{typeof rows[0].enabled === 'boolean' ? (rows[0].enabled ? 'Active' : 'Inactive') : 'Status not supplied'}</p></div>
          </div>}
        </section>;
      })}
      <p className="text-[11px] text-[#AAB4C3]">At most 50 source records are shown. These values are displayed as recorded and are not transaction authorization.</p>
    </div>}
  </OperationsPageLayout>;
}
