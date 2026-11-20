import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { exportToCsv } from '@/lib/exportCsv';
import { useToast } from '@/components/ui/use-toast';
import { CalendarDays, Download, FileSpreadsheet, TrendingUp, TrendingDown, ArrowLeftRight, Wallet, Loader2 } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getTxnDate(t) {
  if (t.transaction_date) return new Date(t.transaction_date);
  return new Date(t.created_date);
}

export default function TransactionSummaries() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [txns, accts] = await Promise.all([
        base44.entities.Transaction.list('-created_date', 500),
        base44.entities.Account.list('-created_date', 200),
      ]);
      setTransactions(txns);
      setAccounts(accts);
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load transactions.', variant: 'destructive' });
    }
    setLoading(false);
  }

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach(a => { map[a.id] = a; });
    return map;
  }, [accounts]);

  const monthTxns = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return transactions.filter(t => {
      const d = getTxnDate(t);
      return d >= start && d < end;
    });
  }, [transactions, month, year]);

  const summary = useMemo(() => {
    const deposits = monthTxns.filter(t => t.type === 'deposit' || t.type === 'opening_balance');
    const withdrawals = monthTxns.filter(t => t.type === 'withdrawal');
    const adjustments = monthTxns.filter(t => t.type === 'adjustment');
    const totalIn = deposits.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const totalOut = withdrawals.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const totalAdj = adjustments.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const net = totalIn - totalOut + totalAdj;
    return {
      count: monthTxns.length,
      deposits: { count: deposits.length, total: totalIn },
      withdrawals: { count: withdrawals.length, total: totalOut },
      adjustments: { count: adjustments.length, total: totalAdj },
      net,
      volume: totalIn + totalOut,
    };
  }, [monthTxns]);

  const monthLabel = `${MONTHS[month]} ${year}`;

  function exportFullLedger() {
    setExporting(true);
    try {
      const rows = monthTxns
        .slice()
        .sort((a, b) => getTxnDate(a).getTime() - getTxnDate(b).getTime())
        .map((t, i) => {
          const acct = accountMap[t.account_id];
          return {
            '#': i + 1,
            Date: getTxnDate(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            Type: t.type,
            Account: acct?.account_name || '—',
            'Account Number': acct?.account_number || '—',
            Description: t.description || '',
            Reference: t.reference || '',
            Amount: Number(t.amount) || 0,
            'Balance After': t.balance_after ?? '',
            'Admin Created': t.created_by_admin ? 'Yes' : 'No',
          };
        });
      if (rows.length === 0) {
        toast({ title: 'No data', description: 'No transactions found for this period.', variant: 'destructive' });
        setExporting(false);
        return;
      }
      exportToCsv(
        `vantoris_transactions_${year}_${String(month + 1).padStart(2, '0')}`,
        ['#', 'Date', 'Type', 'Account', 'Account Number', 'Description', 'Reference', 'Amount', 'Balance After', 'Admin Created'],
        rows,
      );
      toast({ title: 'Ledger exported', description: `${rows.length} transactions exported for ${monthLabel}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Export failed', description: e.message || 'Unable to export ledger.', variant: 'destructive' });
    }
    setExporting(false);
  }

  function exportSummary() {
    setExporting(true);
    try {
      const rows = [
        { Metric: 'Period', Value: monthLabel },
        { Metric: 'Total Transactions', Value: summary.count },
        { Metric: 'Total Deposits', Value: summary.deposits.total },
        { Metric: 'Deposit Count', Value: summary.deposits.count },
        { Metric: 'Total Withdrawals', Value: summary.withdrawals.total },
        { Metric: 'Withdrawal Count', Value: summary.withdrawals.count },
        { Metric: 'Adjustments', Value: summary.adjustments.total },
        { Metric: 'Adjustment Count', Value: summary.adjustments.count },
        { Metric: 'Total Volume', Value: summary.volume },
        { Metric: 'Net Flow', Value: summary.net },
        { Metric: 'Generated', Value: new Date().toLocaleString() },
      ];
      exportToCsv(
        `vantoris_monthly_summary_${year}_${String(month + 1).padStart(2, '0')}`,
        ['Metric', 'Value'],
        rows,
      );
      toast({ title: 'Summary exported', description: `Monthly summary for ${monthLabel} downloaded.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Export failed', description: e.message || 'Unable to export summary.', variant: 'destructive' });
    }
    setExporting(false);
  }

  const yearOptions = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => years.add(getTxnDate(t).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const sortedTxns = useMemo(() => {
    return monthTxns.slice().sort((a, b) => getTxnDate(b).getTime() - getTxnDate(a).getTime());
  }, [monthTxns]);

  const summaryCards = [
    { label: 'Deposits', value: formatCurrency(summary.deposits.total), sub: `${summary.deposits.count} transactions`, icon: TrendingUp, accent: 'text-mint', bg: 'bg-mint/10' },
    { label: 'Withdrawals', value: formatCurrency(summary.withdrawals.total), sub: `${summary.withdrawals.count} transactions`, icon: TrendingDown, accent: 'text-crimson', bg: 'bg-crimson/10' },
    { label: 'Adjustments', value: formatCurrency(summary.adjustments.total), sub: `${summary.adjustments.count} transactions`, icon: ArrowLeftRight, accent: 'text-brass', bg: 'bg-brass/10' },
    { label: 'Net Flow', value: formatCurrency(summary.net), sub: `${summary.count} total transactions`, icon: Wallet, accent: summary.net >= 0 ? 'text-mint' : 'text-crimson', bg: summary.net >= 0 ? 'bg-mint/10' : 'bg-crimson/10' },
  ];

  if (loading) {
    return (
      <OperationsPageLayout title="Transaction Summaries" description="Export monthly transaction summaries for record-keeping" icon={CalendarDays}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Transaction Summaries"
      description="Export monthly transaction summaries for record-keeping"
      icon={CalendarDays}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportSummary}
            disabled={exporting || summary.count === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-navy rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Export Summary
          </button>
          <button
            onClick={exportFullLedger}
            disabled={exporting || summary.count === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export Full Ledger
          </button>
        </div>
      }
    >
      {/* Period Selector */}
      <div className="vantoris-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray" />
            <span className="text-sm font-semibold text-foreground">Select Period</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-foreground focus:border-navy/30 focus:outline-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-foreground focus:border-navy/30 focus:outline-none"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray">
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-foreground">{monthLabel}</span>
            <span>·</span>
            <span>{summary.count} transactions</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="vantoris-card p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={card.accent} />
              </div>
              <p className="text-foreground font-bold text-lg">{card.value}</p>
              <p className="text-gray text-xs mt-0.5">{card.label}</p>
              <p className="text-gray/60 text-[10px] mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Transaction Preview */}
      <div className="vantoris-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-sm text-foreground">Transaction Preview — {monthLabel}</h3>
          <span className="text-xs text-gray">{sortedTxns.length} records</span>
        </div>
        {sortedTxns.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays size={28} className="text-gray/30 mx-auto mb-2" />
            <p className="text-gray text-sm">No transactions found for {monthLabel}</p>
            <p className="text-gray/60 text-xs mt-1">Try selecting a different month or year.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                    <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
                    <th className="text-left text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Description</th>
                    <th className="text-right text-gray text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTxns.slice(0, 50).map(t => {
                    const acct = accountMap[t.account_id];
                    const isInflow = t.type === 'deposit' || t.type === 'opening_balance';
                    return (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray text-xs">
                          {getTxnDate(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                            t.type === 'deposit' || t.type === 'opening_balance' ? 'bg-mint/10 text-mint' :
                            t.type === 'withdrawal' ? 'bg-crimson/10 text-crimson' :
                            'bg-brass/10 text-brass'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-foreground text-xs font-medium">{acct?.account_name || '—'}</p>
                          <p className="text-gray text-[10px] font-mono">{acct?.account_number || ''}</p>
                        </td>
                        <td className="px-5 py-3 text-gray text-xs">{t.description || '—'}</td>
                        <td className={`px-5 py-3 text-right font-semibold text-xs ${isInflow ? 'text-mint' : t.type === 'withdrawal' ? 'text-crimson' : 'text-foreground'}`}>
                          {isInflow ? '+' : t.type === 'withdrawal' ? '-' : ''}{formatCurrency(Math.abs(Number(t.amount) || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {sortedTxns.slice(0, 30).map(t => {
                const acct = accountMap[t.account_id];
                const isInflow = t.type === 'deposit' || t.type === 'opening_balance';
                return (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{acct?.account_name || '—'}</p>
                      <p className="text-gray text-xs">{t.type} · {getTxnDate(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      {t.description && <p className="text-gray/60 text-[10px] truncate mt-0.5">{t.description}</p>}
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${isInflow ? 'text-mint' : t.type === 'withdrawal' ? 'text-crimson' : 'text-foreground'}`}>
                      {isInflow ? '+' : t.type === 'withdrawal' ? '-' : ''}{formatCurrency(Math.abs(Number(t.amount) || 0))}
                    </span>
                  </div>
                );
              })}
            </div>

            {sortedTxns.length > 50 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-center">
                <p className="text-gray text-xs">
                  Showing first 50 of {sortedTxns.length} transactions. Export the full ledger for all records.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </OperationsPageLayout>
  );
}