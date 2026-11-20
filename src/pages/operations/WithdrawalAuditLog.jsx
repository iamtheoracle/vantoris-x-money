import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { exportToCsv } from '@/lib/exportCsv';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, Search, Filter, Download, CheckCircle2, XCircle, Clock, User } from 'lucide-react';

const ACTION_META = {
  withdrawal_processed: { label: 'Approved', icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/10' },
  withdrawal_rejected: { label: 'Rejected', icon: XCircle, color: 'text-crimson', bg: 'bg-crimson/10' },
};

function parseRequestId(details) {
  if (!details) return null;
  const match = details.match(/Request ID:\s*([a-f0-9]+)/i);
  return match ? match[1] : null;
}

export default function WithdrawalAuditLog() {
  const [logs, setLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [allLogs, accts] = await Promise.all([
        base44.entities.AuditLog.list('-created_date', 300),
        base44.entities.Account.list('-created_date', 200),
      ]);
      const withdrawalLogs = allLogs.filter(l =>
        l.action_type === 'withdrawal_processed' || l.action_type === 'withdrawal_rejected'
      );
      setLogs(withdrawalLogs);
      setAccounts(accts);
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load audit trail.', variant: 'destructive' });
    }
    setLoading(false);
  }

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach(a => { map[a.id] = a; });
    return map;
  }, [accounts]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filter !== 'all' && l.action_type !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (l.admin_name || '').toLowerCase().includes(q) ||
               (l.description || '').toLowerCase().includes(q) ||
               (l.details || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, filter, search]);

  const stats = useMemo(() => {
    const approved = logs.filter(l => l.action_type === 'withdrawal_processed');
    const rejected = logs.filter(l => l.action_type === 'withdrawal_rejected');
    const totalApproved = approved.reduce((s, l) => s + Math.abs(l.amount || 0), 0);
    const uniqueAdmins = new Set(logs.map(l => l.admin_name)).size;
    return {
      total: logs.length,
      approved: approved.length,
      rejected: rejected.length,
      totalApproved,
      uniqueAdmins,
    };
  }, [logs]);

  function handleExport() {
    setExporting(true);
    try {
      const rows = filtered.map((l, i) => {
        const acct = accountMap[l.account_id];
        return {
          '#': i + 1,
          Timestamp: new Date(l.created_date).toLocaleString('en-US'),
          Admin: l.admin_name || '—',
          Action: ACTION_META[l.action_type]?.label || l.action_type,
          Amount: l.amount != null ? formatCurrency(Math.abs(l.amount)) : '',
          Method: (l.description || '').match(/via\s(.+)$/)?.[1] || '',
          Account: acct?.account_name || '—',
          'Account Number': acct?.account_number || '—',
          'Balance Before': l.balance_before != null ? formatCurrency(l.balance_before) : '',
          'Balance After': l.balance_after != null ? formatCurrency(l.balance_after) : '',
          Details: l.details || '',
        };
      });
      if (rows.length === 0) {
        toast({ title: 'No data', description: 'No audit entries to export.', variant: 'destructive' });
        setExporting(false);
        return;
      }
      exportToCsv('vantoris_withdrawal_audit_trail', ['#', 'Timestamp', 'Admin', 'Action', 'Amount', 'Method', 'Account', 'Account Number', 'Balance Before', 'Balance After', 'Details'], rows);
      toast({ title: 'Audit trail exported', description: `${rows.length} entries downloaded.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    }
    setExporting(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Withdrawal Audit Trail" description="Complete record of who approved or rejected each withdrawal" icon={ShieldCheck}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Withdrawal Audit Trail"
      description="Complete record of who approved or rejected each withdrawal"
      icon={ShieldCheck}
      actions={
        <button
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
        >
          <Download size={14} /> Export Audit Trail
        </button>
      }
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="vantoris-card p-4">
          <div className="w-9 h-9 rounded-lg bg-navy/8 flex items-center justify-center mb-2">
            <ShieldCheck size={16} className="text-navy" />
          </div>
          <p className="text-foreground font-bold text-lg">{stats.total}</p>
          <p className="text-gray text-xs">Total Audit Events</p>
        </div>
        <div className="vantoris-card p-4">
          <div className="w-9 h-9 rounded-lg bg-mint/10 flex items-center justify-center mb-2">
            <CheckCircle2 size={16} className="text-mint" />
          </div>
          <p className="text-foreground font-bold text-lg">{stats.approved}</p>
          <p className="text-gray text-xs">Withdrawals Approved</p>
        </div>
        <div className="vantoris-card p-4">
          <div className="w-9 h-9 rounded-lg bg-crimson/10 flex items-center justify-center mb-2">
            <XCircle size={16} className="text-crimson" />
          </div>
          <p className="text-foreground font-bold text-lg">{stats.rejected}</p>
          <p className="text-gray text-xs">Withdrawals Rejected</p>
        </div>
        <div className="vantoris-card p-4">
          <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-2">
            <User size={16} className="text-brass" />
          </div>
          <p className="text-foreground font-bold text-lg">{stats.uniqueAdmins}</p>
          <p className="text-gray text-xs">Admins Involved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by admin, amount, or details..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-foreground text-sm focus:border-navy/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-navy/30 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="withdrawal_processed">Approved Only</option>
            <option value="withdrawal_rejected">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Audit Trail */}
      {filtered.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <ShieldCheck size={32} className="text-gray/30 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No withdrawal audit events found</p>
          <p className="text-gray text-sm">Approval and rejection actions will appear here for compliance tracking.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
                  <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Admin</th>
                  <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
                  <th className="text-right text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
                  <th className="text-right text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Balance Change</th>
                  <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const meta = ACTION_META[log.action_type] || { label: log.action_type, color: 'text-gray', bg: 'bg-slate-100' };
                  const Icon = meta.icon || Clock;
                  const acct = accountMap[log.account_id];
                  return (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-foreground text-xs font-medium">{log.admin_name || '—'}</p>
                        {log.target_user_id && <p className="text-gray text-[10px]">Member: {log.target_user_id.slice(-8)}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-foreground text-xs font-medium">{acct?.account_name || '—'}</p>
                        <p className="text-gray text-[10px] font-mono">{acct?.account_number || ''}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {log.amount != null ? (
                          <span className={`text-xs font-semibold ${log.amount >= 0 ? 'text-foreground' : 'text-crimson'}`}>
                            {formatCurrency(Math.abs(log.amount))}
                          </span>
                        ) : <span className="text-gray text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-[11px] font-mono">
                        {log.balance_before != null && log.balance_after != null ? (
                          <span className="text-gray">
                            {formatCurrency(log.balance_before)} <span className="text-gray/50">→</span> <span className="text-foreground">{formatCurrency(log.balance_after)}</span>
                          </span>
                        ) : <span className="text-gray">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-foreground text-xs">{new Date(log.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-gray text-[10px]">{new Date(log.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
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
              const meta = ACTION_META[log.action_type] || { label: log.action_type, color: 'text-gray', bg: 'bg-slate-100' };
              const Icon = meta.icon || Clock;
              const acct = accountMap[log.account_id];
              return (
                <div key={log.id} className="vantoris-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                        <Icon size={14} className={meta.color} />
                      </div>
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray text-[10px]">{new Date(log.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-gray text-[10px]">{new Date(log.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">{log.admin_name || '—'}</p>
                      <p className="text-gray text-xs">{acct?.account_name || '—'}</p>
                    </div>
                    {log.amount != null && (
                      <span className={`text-sm font-semibold ${log.amount >= 0 ? 'text-foreground' : 'text-crimson'}`}>
                        {formatCurrency(Math.abs(log.amount))}
                      </span>
                    )}
                  </div>
                  {log.balance_before != null && log.balance_after != null && (
                    <p className="text-[11px] font-mono text-gray">
                      {formatCurrency(log.balance_before)} → {formatCurrency(log.balance_after)}
                    </p>
                  )}
                  {log.details && (
                    <p className="text-gray/60 text-[11px] pt-1 border-t border-slate-50">{log.details}</p>
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