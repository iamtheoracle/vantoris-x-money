import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import GlassTooltip from '@/components/vantoris/widgets/GlassTooltip';
import { exportToCsv } from '@/lib/exportCsv';
import {
  TrendingUp, Wallet, Users, ArrowDownToLine,
  Download, Activity, BarChart3, Crown,
} from 'lucide-react';

const CHART = {
  brass: '#B08D57',
  mint: '#7EB89F',
  crimson: '#8C2F39',
  champagne: '#D4B996',
  gray: '#AAB4C3',
  slate: '#242D38',
  gridLine: 'rgba(255,255,255,0.04)',
};

function getMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function ExecutiveReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [accounts, transactions, users, apps] = await Promise.all([
          base44.entities.Account.list('-created_date', 300),
          base44.entities.Transaction.list('-created_date', 500),
          base44.entities.User.list('-created_date', 300),
          base44.entities.Application.list('-created_date', 100),
        ]);
        if (!mounted) return;

        // Build 12-month window
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ key: getMonthKey(d), label: getMonthLabel(d), date: d });
        }

        // AUM growth: cumulative net position per month
        // Sort transactions chronologically, compute running balance by month
        const sortedTxns = [...transactions].sort((a, b) =>
          new Date(a.transaction_date || a.created_date).getTime() - new Date(b.transaction_date || b.created_date).getTime()
        );

        const monthlyData = months.map(m => ({
          month: m.label,
          deposits: 0,
          withdrawals: 0,
          txnCount: 0,
          netFlow: 0,
          newMembers: 0,
          newAccounts: 0,
        }));

        // Map month key to index
        const monthIndex = {};
        months.forEach((m, i) => { monthIndex[m.key] = i; });

        sortedTxns.forEach(txn => {
          const txnDate = new Date(txn.transaction_date || txn.created_date);
          const key = getMonthKey(txnDate);
          const idx = monthIndex[key];
          if (idx == null) {
            // Before our 12-month window — add to first month as starting balance
            const amount = Math.abs(Number(txn.amount) || 0);
            if (txn.type === 'deposit' || txn.type === 'opening_balance') {
              monthlyData[0].deposits += amount;
            } else if (txn.type === 'withdrawal') {
              monthlyData[0].withdrawals += amount;
            }
            monthlyData[0].txnCount += 1;
            return;
          }
          const amount = Math.abs(Number(txn.amount) || 0);
          if (txn.type === 'deposit' || txn.type === 'opening_balance') {
            monthlyData[idx].deposits += amount;
            monthlyData[idx].netFlow += amount;
          } else if (txn.type === 'withdrawal') {
            monthlyData[idx].withdrawals += amount;
            monthlyData[idx].netFlow -= amount;
          }
          monthlyData[idx].txnCount += 1;
        });

        // New members per month
        users.filter(u => u.role === 'user').forEach(u => {
          const key = getMonthKey(new Date(u.created_date));
          const idx = monthIndex[key];
          if (idx != null) monthlyData[idx].newMembers += 1;
        });

        // New accounts per month
        accounts.forEach(a => {
          const key = getMonthKey(new Date(a.created_date));
          const idx = monthIndex[key];
          if (idx != null) monthlyData[idx].newAccounts += 1;
        });

        // Compute cumulative AUM
        let cumulative = 0;
        const aumGrowth = monthlyData.map(m => {
          cumulative += m.netFlow;
          return { month: m.month, aum: cumulative, ...m };
        });

        const totalAum = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
        const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
        const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
        const memberCount = users.filter(u => u.role === 'user').length;
        const pendingApps = apps.filter(a => a.application_status === 'pending').length;

        // This month vs last month for trend indicators
        const thisMonth = monthlyData[monthlyData.length - 1];
        const lastMonth = monthlyData[monthlyData.length - 2] || thisMonth;
        const aumChange = lastMonth ? ((thisMonth.netFlow - lastMonth.netFlow) / (Math.abs(lastMonth.netFlow) || 1)) * 100 : 0;
        const txnChange = lastMonth ? ((thisMonth.txnCount - lastMonth.txnCount) / (lastMonth.txnCount || 1)) * 100 : 0;

        setData({
          aumGrowth,
          monthlyData,
          totalAum,
          totalDeposits,
          totalWithdrawals,
          memberCount,
          pendingApps,
          totalTxns: transactions.length,
          activeAccounts: accounts.filter(a => a.status === 'active').length,
          aumChange,
          txnChange,
        });
      } catch (e) { console.error(e); }
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  function handleExportCsv() {
    if (!data) return;
    const rows = data.aumGrowth.map(m => ({
      Month: m.month,
      AUM: m.aum.toFixed(2),
      Deposits: m.deposits.toFixed(2),
      Withdrawals: m.withdrawals.toFixed(2),
      'Net Flow': m.netFlow.toFixed(2),
      Transactions: m.txnCount,
      'New Members': m.newMembers,
      'New Accounts': m.newAccounts,
    }));
    const headers = ['Month', 'AUM', 'Deposits', 'Withdrawals', 'Net Flow', 'Transactions', 'New Members', 'New Accounts'];
    exportToCsv('vantoris_executive_report', headers, rows);
  }

  if (loading || !data) {
    return (
      <OperationsPageLayout title="Strategic Reports" description="AUM growth and transaction volume analytics" icon={TrendingUp} breadcrumb="Executive Workspace"
        actions={<button onClick={handleExportCsv} disabled className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] text-[#AAB4C3] text-sm rounded-xl border border-white/[0.06] opacity-40">
          <Download size={15} /> Export
        </button>}
      >
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const { aumGrowth, monthlyData, aumChange, txnChange } = data;

  return (
    <OperationsPageLayout
      title="Strategic Reports"
      description="AUM growth and transaction volume analytics"
      icon={TrendingUp}
      breadcrumb="Executive Workspace"
      actions={
        <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm rounded-xl border border-white/[0.06] hover:border-brass/20 transition-all">
          <Download size={15} className="text-brass" />
          Export Report
        </button>
      }
    >
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero label="Assets Under Management" value={formatCurrency(data.totalAum)} sublabel="Current total across all accounts" icon={Wallet} accent="brass" />
        <PremiumStatCard label="Total Transaction Volume" value={formatCurrency(data.totalDeposits + data.totalWithdrawals)} sublabel={`${data.totalTxns} total transactions`} icon={Activity} accent="champagne" />
        <PremiumStatCard label="Total Members" value={data.memberCount} sublabel={`${data.activeAccounts} active accounts`} icon={Users} accent="blue" />
        <PremiumStatCard label="Net Inflows" value={formatCurrency(data.totalDeposits - data.totalWithdrawals)} sublabel={`${formatCurrency(data.totalDeposits)} in · ${formatCurrency(data.totalWithdrawals)} out`} icon={ArrowDownToLine} accent="mint" />
      </div>

      {/* AUM Growth Chart — Hero */}
      <div className="vantoris-glass p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brass" />
            <h3 className="text-white font-semibold text-sm">AUM Growth Trend</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#AAB4C3] text-xs">12-Month View</span>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              aumChange >= 0 ? 'bg-mint/10 text-mint border-mint/20' : 'bg-crimson/10 text-red-400 border-crimson/20'
            }`}>
              {aumChange >= 0 ? '↗' : '↘'} {Math.abs(aumChange).toFixed(1)}% MoM
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={aumGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.brass} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART.brass} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
            <XAxis dataKey="month" stroke={CHART.gray} tick={{ fontSize: 11, fill: CHART.gray }} axisLine={{ stroke: CHART.slate }} tickLine={false} />
            <YAxis stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={70} />
            <Tooltip content={<GlassTooltip currency />} />
            <Area type="monotone" dataKey="aum" name="AUM" stroke={CHART.brass} strokeWidth={2.5} fill="url(#aumGradient)" dot={{ fill: CHART.brass, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: CHART.brass }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Volume + Net Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="vantoris-glass p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-champagne" />
            <h3 className="text-white font-semibold text-sm">Transaction Volume</h3>
            <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              txnChange >= 0 ? 'bg-mint/10 text-mint border-mint/20' : 'bg-crimson/10 text-red-400 border-crimson/20'
            }`}>
              {txnChange >= 0 ? '↗' : '↘'} {Math.abs(txnChange).toFixed(1)}% MoM
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
              <XAxis dataKey="month" stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={{ stroke: CHART.slate }} tickLine={false} />
              <YAxis stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={60} />
              <Tooltip content={<GlassTooltip currency />} />
              <Bar dataKey="deposits" name="Deposits" fill={CHART.mint} radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Withdrawals" fill={CHART.crimson} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded bg-mint" /> Deposits
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded bg-crimson" /> Withdrawals
            </span>
          </div>
        </div>

        <div className="vantoris-glass p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-brass" />
            <h3 className="text-white font-semibold text-sm">Net Cash Flow</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
              <XAxis dataKey="month" stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={{ stroke: CHART.slate }} tickLine={false} />
              <YAxis stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={60} />
              <Tooltip content={<GlassTooltip currency />} />
              <Line type="monotone" dataKey="netFlow" name="Net Flow" stroke={CHART.champagne} strokeWidth={2.5} dot={{ fill: CHART.champagne, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Activity + Transaction Count */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="vantoris-glass p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-brass" />
            <h3 className="text-white font-semibold text-sm">Member Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
              <XAxis dataKey="month" stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={{ stroke: CHART.slate }} tickLine={false} />
              <YAxis stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="newMembers" name="New Members" fill={CHART.brass} radius={[4, 4, 0, 0]} />
              <Bar dataKey="newAccounts" name="New Accounts" fill={CHART.mint} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
            <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded bg-brass" /> New Members</span>
            <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded bg-mint" /> New Accounts</span>
          </div>
        </div>

        <div className="vantoris-glass p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-champagne" />
            <h3 className="text-white font-semibold text-sm">Transactions per Month</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="txnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.champagne} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART.champagne} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} vertical={false} />
              <XAxis dataKey="month" stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={{ stroke: CHART.slate }} tickLine={false} />
              <YAxis stroke={CHART.gray} tick={{ fontSize: 10, fill: CHART.gray }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<GlassTooltip />} />
              <Area type="monotone" dataKey="txnCount" name="Transactions" stroke={CHART.champagne} strokeWidth={2.5} fill="url(#txnGradient)" dot={{ fill: CHART.champagne, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="vantoris-glass p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={16} className="text-brass" />
          <h3 className="text-white font-semibold text-sm">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Month</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 px-4">AUM</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 px-4">Deposits</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 px-4">Withdrawals</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 px-4">Net Flow</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 px-4">Txns</th>
                <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pl-4">Members</th>
              </tr>
            </thead>
            <tbody>
              {aumGrowth.map(m => (
                <tr key={m.month} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-all">
                  <td className="py-3 pr-4 text-white font-medium">{m.month}</td>
                  <td className="py-3 px-4 text-right text-white">{formatCurrency(m.aum)}</td>
                  <td className="py-3 px-4 text-right text-mint">{formatCurrency(m.deposits)}</td>
                  <td className="py-3 px-4 text-right text-red-400">{formatCurrency(m.withdrawals)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${m.netFlow >= 0 ? 'text-mint' : 'text-red-400'}`}>{formatCurrency(m.netFlow)}</td>
                  <td className="py-3 px-4 text-right text-[#AAB4C3]">{m.txnCount}</td>
                  <td className="py-3 pl-4 text-right text-[#AAB4C3]">{m.newMembers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OperationsPageLayout>
  );
}