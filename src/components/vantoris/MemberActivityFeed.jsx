import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  CheckCircle2, XCircle, ArrowLeftRight, FileCheck2, Wallet, UserCog, ShieldAlert,
} from 'lucide-react';

const ACTION_META = {
  application_approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-olive/20' },
  application_rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-crimson/20' },
  kyc_approved: { icon: ShieldAlert, color: 'text-emerald-400', bg: 'bg-olive/20' },
  kyc_rejected: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-crimson/20' },
  account_created: { icon: UserCog, color: 'text-brass', bg: 'bg-brass/15' },
  account_status_changed: { icon: UserCog, color: 'text-brass', bg: 'bg-brass/15' },
  account_deleted: { icon: XCircle, color: 'text-red-400', bg: 'bg-crimson/20' },
  transaction_created: { icon: Wallet, color: 'text-[#AAB4C3]', bg: 'bg-[#242D38]' },
  transaction_edited: { icon: Wallet, color: 'text-[#AAB4C3]', bg: 'bg-[#242D38]' },
  balance_adjusted: { icon: ArrowLeftRight, color: 'text-brass', bg: 'bg-brass/15' },
  withdrawal_processed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-olive/20' },
  withdrawal_rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-crimson/20' },
};

const ACTION_LABELS = {
  application_approved: 'Application Approved',
  application_rejected: 'Application Rejected',
  kyc_approved: 'KYC Approved',
  kyc_rejected: 'KYC Rejected',
  account_created: 'Account Created',
  account_status_changed: 'Status Changed',
  account_deleted: 'Account Deleted',
  transaction_created: 'Transaction Logged',
  transaction_edited: 'Transaction Edited',
  balance_adjusted: 'Balance Adjusted',
  withdrawal_processed: 'Withdrawal Processed',
  withdrawal_rejected: 'Withdrawal Rejected',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function MemberActivityFeed({ memberId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const logs = await base44.entities.AuditLog.filter(
          { target_user_id: memberId }, '-created_date', 50
        );
        if (active) setEntries(logs);
      } catch (e) { console.error(e); }
      if (active) setLoading(false);
    }
    if (memberId) load();
    return () => { active = false; };
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-7 h-7 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <FileCheck2 size={28} className="text-[#AAB4C3]/40 mx-auto mb-2" />
        <p className="text-[#AAB4C3] text-sm">No administrative activity recorded for this member.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-1">
      {/* vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-[#242D38]" />
      {entries.map((entry, i) => {
        const meta = ACTION_META[entry.action_type] || { icon: FileCheck2, color: 'text-[#AAB4C3]', bg: 'bg-[#242D38]' };
        const Icon = meta.icon;
        const isFirst = i === 0;
        return (
          <div key={entry.id || i} className="relative pb-5 last:pb-0">
            <div className={`absolute -left-[1.45rem] w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center ring-4 ring-[#0E1A2B]`}>
              <Icon size={13} className={meta.color} />
            </div>
            <div className={`vantoris-card p-3.5 ${isFirst ? 'border-brass/30' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-white text-sm font-medium leading-tight">
                  {ACTION_LABELS[entry.action_type] || entry.action_type}
                </p>
                <span className="text-[#AAB4C3] text-[10px] whitespace-nowrap pt-0.5">
                  {formatDate(entry.created_date)}
                </span>
              </div>
              <p className="text-[#AAB4C3] text-xs mb-1.5">{entry.description}</p>
              {entry.admin_name && (
                <p className="text-brass/80 text-[10px] uppercase tracking-wider">by {entry.admin_name}</p>
              )}
              {(typeof entry.amount === 'number' && entry.amount !== 0) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#242D38]/60 text-[10px] text-[#AAB4C3]">
                  <span>Amount: <span className="text-white">{formatCurrency(Math.abs(entry.amount))}{entry.amount < 0 ? ' (debit)' : ''}</span></span>
                  {typeof entry.balance_before === 'number' && (
                    <span>Before: <span className="text-white">{formatCurrency(entry.balance_before)}</span></span>
                  )}
                  {typeof entry.balance_after === 'number' && (
                    <span>After: <span className="text-white">{formatCurrency(entry.balance_after)}</span></span>
                  )}
                </div>
              )}
              {entry.details && (
                <p className="text-[#AAB4C3]/70 text-[11px] mt-2 pt-2 border-t border-[#242D38]/60 italic">
                  {entry.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}