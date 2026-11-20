import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ScrollText, Search, Filter } from 'lucide-react';

const actionLabels = {
  transaction_created: { label: 'Transaction Created', color: 'text-emerald-400 bg-emerald-500/10' },
  transaction_edited: { label: 'Transaction Edited', color: 'text-brass bg-brass/10' },
  balance_adjusted: { label: 'Balance Adjusted', color: 'text-brass bg-brass/10' },
  withdrawal_processed: { label: 'Withdrawal Processed', color: 'text-red-400 bg-red-500/10' },
  withdrawal_rejected: { label: 'Withdrawal Rejected', color: 'text-red-400 bg-red-500/10' },
  account_created: { label: 'Account Created', color: 'text-emerald-400 bg-emerald-500/10' },
  account_status_changed: { label: 'Account Status Changed', color: 'text-brass bg-brass/10' },
  application_approved: { label: 'Application Approved', color: 'text-emerald-400 bg-emerald-500/10' },
  application_rejected: { label: 'Application Rejected', color: 'text-red-400 bg-red-500/10' },
  kyc_approved: { label: 'KYC Approved', color: 'text-emerald-400 bg-emerald-500/10' },
  kyc_rejected: { label: 'KYC Rejected', color: 'text-red-400 bg-red-500/10' },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    try {
      const data = await base44.entities.AuditLog.list('-created_date', 200);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const actionTypes = [...new Set(logs.map(l => l.action_type))];

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.action_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.description || '').toLowerCase().includes(q) ||
             (l.admin_name || '').toLowerCase().includes(q) ||
             (l.details || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <OperationsPageLayout title="Audit Logs" description="Chronological record of all administrative actions" icon={ScrollText}>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit logs..."
            className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#AAB4C3]" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(t => (
              <option key={t} value={t}>{actionLabels[t]?.label || t}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <ScrollText size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">No audit events recorded</p>
          <p className="text-[#AAB4C3] text-sm">Administrative actions will be logged here for compliance tracking.</p>
        </div>
      ) : (
        <>
        <div className="hidden md:block vantoris-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Description</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Admin</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Balance Change</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const meta = actionLabels[log.action_type] || { label: log.action_type, color: 'text-[#AAB4C3] bg-[#242D38]' };
                return (
                  <tr key={log.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white text-xs font-medium">{log.description}</p>
                      {log.details && <p className="text-[#AAB4C3]/70 text-[11px] mt-0.5">{log.details}</p>}
                    </td>
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs">{log.admin_name || '—'}</td>
                    <td className="px-5 py-3 text-right text-xs font-medium">
                      {log.amount != null ? (
                        <span className={log.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(log.amount)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] font-mono text-[#AAB4C3]">
                      {log.balance_before != null && log.balance_after != null ? (
                        <>
                          <span>{formatCurrency(log.balance_before)}</span>
                          <span className="text-[#AAB4C3]/50"> → </span>
                          <span className="text-white">{formatCurrency(log.balance_after)}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs">
                      {new Date(log.created_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(log => {
            const meta = actionLabels[log.action_type] || { label: log.action_type, color: 'text-[#AAB4C3] bg-[#242D38]' };
            return (
              <div key={log.id} className="vantoris-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="text-[#AAB4C3] text-xs">{new Date(log.created_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-white text-xs font-medium">{log.description}</p>
                {log.details && <p className="text-[#AAB4C3]/70 text-[11px]">{log.details}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#AAB4C3]">{log.admin_name || '—'}</span>
                  {log.amount != null && (
                    <span className={`font-medium ${log.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(log.amount)}</span>
                  )}
                </div>
                {log.balance_before != null && log.balance_after != null && (
                  <p className="text-[11px] font-mono text-[#AAB4C3]">{formatCurrency(log.balance_before)} → {formatCurrency(log.balance_after)}</p>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </OperationsPageLayout>
  );
}