import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { BarChart3, Users, Wallet, FileText, ArrowDownToLine, Download, Mail, Calendar } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';
import { useToast } from '@/components/ui/use-toast';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [users, apps, accounts, withdrawals, transactions] = await Promise.all([
          base44.entities.User.list('-created_date', 100),
          base44.entities.Application.list('-created_date', 100),
          base44.entities.Account.list('-created_date', 100),
          base44.entities.WithdrawalRequest.list('-created_date', 100),
          base44.entities.Transaction.list('-created_date', 200),
        ]);
        setData({ users, apps, accounts, withdrawals, transactions });
        } catch (e) {
        console.error(e);
        toast({ title: 'Load failed', description: e.message || 'Unable to load report data.', variant: 'destructive' });
        }
        setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <OperationsPageLayout title="Reports" description="Platform analytics and operational metrics" icon={BarChart3}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const { users, apps, accounts, withdrawals, transactions } = data;
  const totalAUM = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const memberCount = users.filter(u => u.role === 'user').length;
  const pendingApps = apps.filter(a => a.application_status === 'pending').length;
  const pendingWd = withdrawals.filter(w => w.status === 'pending').length;
  const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const stats = [
    { label: 'Total Members', value: memberCount, icon: Users },
    { label: 'Total Accounts', value: accounts.length, icon: Wallet },
    { label: 'Applications', value: apps.length, icon: FileText },
    { label: 'AUM', value: formatCurrency(totalAUM), icon: BarChart3 },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: ArrowDownToLine },
    { label: 'Total Withdrawals', value: formatCurrency(totalWithdrawals), icon: ArrowDownToLine },
    { label: 'Pending Applications', value: pendingApps, icon: FileText },
    { label: 'Pending Withdrawals', value: pendingWd, icon: ArrowDownToLine },
  ];

  function handleExport() {
    const rows = stats.map(s => ({ Metric: s.label, Value: s.value }));
    exportToCsv('vantoris_operations_report', ['Metric', 'Value'], rows);
  }

  async function handleGenerateMonthlyReport() {
    setGeneratingReport(true);
    setReportResult(null);
    try {
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      // Use effective transaction date — respects transaction_date > posting_date > created_date
      const getEffDate = (t) => new Date(t.transaction_date || t.posting_date || t.created_date);
      const monthTxns = transactions.filter(t => getEffDate(t) >= monthStart);
      const monthDeposits = monthTxns.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const monthWithdrawals = monthTxns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const monthVolume = monthDeposits + monthWithdrawals;

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthTxns = transactions.filter(t => {
        const d = getEffDate(t);
        return d >= prevMonthStart && d <= prevMonthEnd;
      });
      const prevAUM = prevMonthTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const assetGrowth = totalAUM - prevAUM;
      const growthPct = prevAUM > 0 ? ((assetGrowth / prevAUM) * 100).toFixed(1) : 'N/A';

      const reportBody = `VANTORIS MONTHLY REPORT — ${monthName}\n\n` +
        `═══════════════════════════════════════════\n\n` +
        `TOTAL ASSETS UNDER MANAGEMENT\n` +
        `Current AUM: ${formatCurrency(totalAUM)}\n` +
        `Previous Month AUM: ${formatCurrency(prevAUM)}\n` +
        `Asset Growth: ${formatCurrency(assetGrowth)} (${growthPct}%)\n\n` +
        `TRANSACTION VOLUME — ${monthName}\n` +
        `Total Transactions: ${monthTxns.length}\n` +
        `Deposits: ${formatCurrency(monthDeposits)}\n` +
        `Withdrawals: ${formatCurrency(monthWithdrawals)}\n` +
        `Total Volume: ${formatCurrency(monthVolume)}\n\n` +
        `PLATFORM SUMMARY\n` +
        `Total Members: ${memberCount}\n` +
        `Total Accounts: ${accounts.length}\n` +
        `Pending Applications: ${pendingApps}\n` +
        `Pending Withdrawals: ${pendingWd}\n\n` +
        `═══════════════════════════════════════════\n` +
        `Generated: ${now.toLocaleString()}\n`;

      await base44.integrations.Core.SendEmail({
        to: 'operations@vantoris.com',
        subject: `Vantoris Monthly Report — ${monthName}`,
        body: reportBody,
      });

      const reportRows = [
        { Metric: 'Current AUM', Value: formatCurrency(totalAUM) },
        { Metric: 'Previous Month AUM', Value: formatCurrency(prevAUM) },
        { Metric: 'Asset Growth', Value: formatCurrency(assetGrowth) },
        { Metric: 'Growth %', Value: `${growthPct}%` },
        { Metric: 'Monthly Transactions', Value: monthTxns.length },
        { Metric: 'Monthly Deposits', Value: formatCurrency(monthDeposits) },
        { Metric: 'Monthly Withdrawals', Value: formatCurrency(monthWithdrawals) },
        { Metric: 'Monthly Volume', Value: formatCurrency(monthVolume) },
        { Metric: 'Total Members', Value: memberCount },
        { Metric: 'Total Accounts', Value: accounts.length },
        { Metric: 'Pending Applications', Value: pendingApps },
        { Metric: 'Pending Withdrawals', Value: pendingWd },
      ];
      exportToCsv(`vantoris_monthly_report_${monthName.replace(/\s/g, '_')}`, ['Metric', 'Value'], reportRows);

      setReportResult({ monthName, txns: monthTxns.length, aum: totalAUM, growth: assetGrowth });
      toast({ title: 'Report generated', description: `Monthly report for ${monthName} has been emailed and exported.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Report failed', description: e.message || 'Unable to generate report.', variant: 'destructive' });
    }
    setGeneratingReport(false);
  }

  return (
    <OperationsPageLayout
      title="Reports"
      description="Platform analytics and operational metrics"
      icon={BarChart3}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateMonthlyReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-4 py-2 bg-brass/15 text-brass rounded-xl text-xs font-medium hover:bg-brass/25 transition-all disabled:opacity-40"
          >
            <Calendar size={14} /> {generatingReport ? 'Generating...' : 'Monthly Report'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-olive/15 text-emerald-400 rounded-xl text-xs font-medium hover:bg-olive/25 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      }
    >
      {reportResult && (
        <div className="vantoris-card p-4 mb-6 flex items-center gap-3 border-brass/30">
          <Mail size={18} className="text-brass flex-shrink-0" />
          <p className="text-[#AAB4C3] text-sm">
            ✓ Monthly report for <span className="text-white font-medium">{reportResult.monthName}</span> generated and emailed to the admin team. {reportResult.txns} transactions this month, AUM growth of {formatCurrency(reportResult.growth)}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="vantoris-card p-5">
              <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center mb-3">
                <Icon size={20} className="text-brass" />
              </div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-[#AAB4C3] text-xs mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
    </OperationsPageLayout>
  );
}