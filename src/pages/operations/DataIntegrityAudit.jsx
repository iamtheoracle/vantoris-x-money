import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertTriangle, CheckCircle, Clock, FileWarning, Loader2,
  RefreshCw, ShieldAlert, FileSearch, Layers, CalendarOff,
} from 'lucide-react';

export default function DataIntegrityAudit() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [statements, setStatements] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txns, stmts, accts] = await Promise.all([
        base44.entities.Transaction.list('-created_date', 500),
        base44.entities.HistoricalStatement.list('-created_date', 200),
        base44.entities.Account.list('-created_date', 200),
      ]);
      setTransactions(txns);
      setStatements(stmts);
      setAccounts(accts);
    } catch (e) {
      toast({ title: 'Failed to load data', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Issue 1: Transactions missing transaction_date (legacy data without proper dating)
  const missingTxnDate = transactions.filter(t => !t.transaction_date && !t.posting_date);

  // Issue 2: Historical imports that are unverified
  const unverifiedStatements = statements.filter(s => s.verification_status === 'unverified');

  // Issue 3: Statements with detected period overlaps
  const overlappingStatements = statements.filter(s => s.overlap_detected);

  // Issue 4: Historical import transactions grouped by source statement
  const historicalTxns = transactions.filter(t => t.source === 'historical_import');
  const stmtGroups = historicalTxns.reduce((acc, t) => {
    const key = t.imported_statement_id || 'unknown';
    if (!acc[key]) acc[key] = { count: 0, statement: null, txns: [] };
    acc[key].count++;
    acc[key].txns.push(t);
    return acc;
  }, {});
  // Match statement records
  statements.forEach(s => {
    if (stmtGroups[s.id]) stmtGroups[s.id].statement = s;
  });

  // Issue 5: Transactions with mismatched dates (posting before transaction)
  const dateMismatches = transactions.filter(t =>
    t.transaction_date && t.posting_date && t.posting_date < t.transaction_date
  );

  const accountMap = accounts.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});

  const issues = [
    { key: 'missing_date', icon: CalendarOff, label: 'Missing Transaction Date', items: missingTxnDate, color: 'text-warning', bg: 'bg-warning/10', desc: 'Legacy records without a transaction_date or posting_date — display falls back to system upload date.' },
    { key: 'unverified', icon: Clock, label: 'Unverified Historical Statements', items: unverifiedStatements, color: 'text-brass', bg: 'bg-brass/10', desc: 'Imported statements awaiting operator verification.' },
    { key: 'overlaps', icon: Layers, label: 'Period Overlaps Detected', items: overlappingStatements, color: 'text-crimson', bg: 'bg-crimson/10', desc: 'Statements whose period overlaps another statement for the same account.' },
    { key: 'date_mismatch', icon: FileWarning, label: 'Date Sequence Mismatches', items: dateMismatches, color: 'text-warning', bg: 'bg-warning/10', desc: 'Transactions where posting_date precedes transaction_date — may indicate data entry error.' },
  ];

  const totalIssues = issues.reduce((s, i) => s + i.items.length, 0);

  return (
    <OperationsPageLayout
      title="Data Integrity Audit"
      description="Read-only audit of historical and transaction data — surfaces issues without modifying records"
      icon={ShieldAlert}
      actions={
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-navy/8 text-navy rounded-xl text-xs font-medium hover:bg-navy/12 transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray" />
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div className={`vantoris-card p-5 mb-6 ${totalIssues === 0 ? 'border-mint/30' : 'border-warning/30'}`}>
            <div className="flex items-center gap-3">
              {totalIssues === 0 ? (
                <CheckCircle size={24} className="text-mint" />
              ) : (
                <AlertTriangle size={24} className="text-warning" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {totalIssues === 0
                    ? 'No data integrity issues detected'
                    : `${totalIssues} data integrity issue${totalIssues !== 1 ? 's' : ''} found`}
                </p>
                <p className="text-xs text-gray mt-0.5">
                  Audited {transactions.length} transactions and {statements.length} historical statements.
                  This audit is read-only — no records are modified.
                </p>
              </div>
            </div>
          </div>

          {/* Issue cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {issues.map(issue => (
              <div key={issue.key} className="vantoris-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${issue.bg} flex items-center justify-center`}>
                    <issue.icon size={20} className={issue.color} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{issue.label}</p>
                    <p className="text-2xl font-bold text-foreground">{issue.items.length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray leading-relaxed">{issue.desc}</p>
              </div>
            ))}
          </div>

          {/* Detail sections */}
          {missingTxnDate.length > 0 && (
            <div className="vantoris-card p-5 mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarOff size={16} className="text-warning" />
                Transactions Missing Effective Date ({missingTxnDate.length})
              </h3>
              <p className="text-xs text-gray mb-3">
                These records fall back to the system upload date for display. They are not modified by this audit.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {missingTxnDate.slice(0, 50).map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{t.description || t.type}</p>
                      <p className="text-gray">
                        Acct: {accountMap[t.account_id]?.account_name || '—'} · Uploaded: {new Date(t.created_date).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    <span className="text-gray font-mono">{t.id.slice(-8)}</span>
                  </div>
                ))}
                {missingTxnDate.length > 50 && (
                  <p className="text-xs text-gray text-center pt-2">Showing 50 of {missingTxnDate.length}</p>
                )}
              </div>
            </div>
          )}

          {unverifiedStatements.length > 0 && (
            <div className="vantoris-card p-5 mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock size={16} className="text-brass" />
                Unverified Historical Statements ({unverifiedStatements.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unverifiedStatements.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {s.account_name || accountMap[s.account_id]?.account_name || 'Unknown account'}
                      </p>
                      <p className="text-gray">
                        Statement date: {s.statement_date ? new Date(s.statement_date).toLocaleDateString('en-US') : '—'}
                        {' · '}Imported: {new Date(s.created_date).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    <span className="text-brass font-medium">Unverified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overlappingStatements.length > 0 && (
            <div className="vantoris-card p-5 mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Layers size={16} className="text-crimson" />
                Overlapping Statement Periods ({overlappingStatements.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {overlappingStatements.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {s.account_name || accountMap[s.account_id]?.account_name || 'Unknown account'}
                      </p>
                      <p className="text-gray">
                        Period: {s.period_start ? new Date(s.period_start).toLocaleDateString('en-US') : '—'} → {s.period_end ? new Date(s.period_end).toLocaleDateString('en-US') : '—'}
                      </p>
                    </div>
                    <span className="text-crimson font-medium">Overlap</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(stmtGroups).length > 0 && (
            <div className="vantoris-card p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileSearch size={16} className="text-navy" />
                Historical Import Groups ({Object.keys(stmtGroups).length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(stmtGroups).map(([stmtId, group]) => (
                  <div key={stmtId} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {group.statement?.account_name || 'Unknown source'}
                      </p>
                      <p className="text-gray">
                        {group.count} transaction{group.count !== 1 ? 's' : ''} imported
                        {group.statement?.statement_date ? ` · ${new Date(group.statement.statement_date).toLocaleDateString('en-US')}` : ''}
                      </p>
                    </div>
                    <span className="text-gray font-mono">{stmtId === 'unknown' ? 'orphaned' : stmtId.slice(-8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </OperationsPageLayout>
  );
}