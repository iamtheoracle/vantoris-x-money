import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

const EMPTY = { frozenAccounts: null, auditEvents: null, pendingKyc: null, pendingWithdrawals: null };

export default function SecurityStatusWidget() {
  const [data, setData] = useState(EMPTY);
  const [sourceErrors, setSourceErrors] = useState({ accounts: false, audit: false, applications: false, withdrawals: false });
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
      const [accounts, audit, applications, withdrawals] = await Promise.all([
        safeList(base44.entities.Account.list('-created_date', 200)),
        safeList(base44.entities.AuditLog.list('-created_date', 100)),
        safeList(base44.entities.Application.list('-created_date', 100)),
        safeList(base44.entities.WithdrawalRequest.filter({ status: 'pending' })),
      ]);
      if (!active) return;
      setSourceErrors({
        accounts: accounts.failed,
        audit: audit.failed,
        applications: applications.failed,
        withdrawals: withdrawals.failed,
      });
      setData({
        frozenAccounts: accounts.failed ? null : accounts.rows.filter((account) => account.status === 'frozen').length,
        auditEvents: audit.failed ? null : audit.rows.length,
        pendingKyc: applications.failed ? null : applications.rows.filter((application) => application.kyc_status === 'pending').length,
        pendingWithdrawals: withdrawals.failed ? null : withdrawals.rows.length,
      });
      setStatus('limited');
    })().catch(() => {
      if (active) {
        setSourceErrors({ accounts: true, audit: true, applications: true, withdrawals: true });
        setStatus('unavailable');
      }
    });
    return () => { active = false; };
  }, []);

  const statusLabel = status === 'loading' ? 'Checking' : status === 'unavailable' || Object.values(sourceErrors).some(Boolean) ? 'Unavailable' : 'Limited snapshot';

  return (
    <section className="vantoris-glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-brass" />
          <h3 className="text-white text-sm font-semibold">Security monitoring snapshot</h3>
        </div>
        <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">
          <AlertTriangle size={11} /> {statusLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/operations/accounts" className="block rounded-xl bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
          <p className="text-lg font-bold text-red-400">{sourceErrors.accounts ? 'Unavailable' : data.frozenAccounts ?? '—'}</p>
          <p className="text-[10px] text-[#AAB4C3]">Frozen account records · max 200</p>
        </Link>
        <div className="rounded-xl bg-white/[0.03] p-3">
          <p className="text-lg font-bold text-brass">{sourceErrors.audit ? 'Unavailable' : data.auditEvents ?? '—'}</p>
          <p className="text-[10px] text-[#AAB4C3]">Audit records returned · max 100</p>
        </div>
        <Link to="/operations/kyc" className="block rounded-xl bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
          <p className="text-lg font-bold text-amber-300">{sourceErrors.applications ? 'Unavailable' : data.pendingKyc ?? '—'}</p>
          <p className="text-[10px] text-[#AAB4C3]">Pending KYC records · max 100</p>
        </Link>
        <Link to="/operations/withdrawals" className="block rounded-xl bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
          <p className="text-lg font-bold text-red-400">{sourceErrors.withdrawals ? 'Unavailable' : data.pendingWithdrawals ?? '—'}</p>
          <p className="text-[10px] text-[#AAB4C3]">Pending withdrawal records returned</p>
        </Link>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-[#AAB4C3]/70">
        Bounded records are not institution-wide risk totals. A limited snapshot cannot establish that the institution is secure or that no outstanding cases exist.
      </p>
    </section>
  );
}
