import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Lock, Eye } from 'lucide-react';

export default function SecurityStatusWidget() {
  const [data, setData] = useState({ frozenAccounts: 0, auditEvents: 0, pendingKyc: 0, pendingWithdrawals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [accounts, auditLogs, apps, withdrawals] = await Promise.all([
          base44.entities.Account.list('-created_date', 200),
          base44.entities.AuditLog.list('-created_date', 100),
          base44.entities.Application.list('-created_date', 100),
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }),
        ]);
        setData({
          frozenAccounts: accounts.filter(a => a.status === 'frozen').length,
          auditEvents: auditLogs.length,
          pendingKyc: apps.filter(a => a.kyc_status === 'pending').length,
          pendingWithdrawals: withdrawals.length,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass p-5 h-40 vantoris-shimmer rounded-2xl" />;

  const threats = data.frozenAccounts + data.pendingWithdrawals;
  const status = threats === 0 ? 'secure' : threats < 5 ? 'elevated' : 'critical';
  const statusConfig = {
    secure: { label: 'Secure', color: 'text-mint', bg: 'bg-mint/10', border: 'border-mint/20', icon: ShieldCheck },
    elevated: { label: 'Elevated Risk', color: 'text-brass', bg: 'bg-brass/10', border: 'border-brass/20', icon: AlertTriangle },
    critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-crimson/10', border: 'border-crimson/20', icon: AlertTriangle },
  };
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <div className="vantoris-glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-brass" />
          <h3 className="text-white font-semibold text-sm">Security Status</h3>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          <Icon size={11} />
          {cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/operations/accounts" className="block p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all">
          <p className="text-red-400 text-lg font-bold">{data.frozenAccounts}</p>
          <p className="text-[#AAB4C3] text-[10px]">Frozen Accounts</p>
        </Link>
        <div className="p-3 rounded-xl bg-white/[0.03]">
          <p className="text-brass text-lg font-bold">{data.auditEvents}</p>
          <p className="text-[#AAB4C3] text-[10px]">Audit Events</p>
        </div>
        <Link to="/operations/kyc" className="block p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all">
          <p className="text-gold text-lg font-bold">{data.pendingKyc}</p>
          <p className="text-[#AAB4C3] text-[10px]">Pending KYC</p>
        </Link>
        <Link to="/operations/withdrawals" className="block p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all">
          <p className="text-red-400 text-lg font-bold">{data.pendingWithdrawals}</p>
          <p className="text-[#AAB4C3] text-[10px]">Pending Withdrawals</p>
        </Link>
      </div>
    </div>
  );
}