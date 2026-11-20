import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import VantorisKPICard from '@/components/vantoris/system/VantorisKPICard';
import { TrendingUp, DollarSign, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${MONTH_LABELS[parseInt(m, 10) - 1]} ${y}`;
}

function formatAxisCurrency(v) {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function AumGrowth() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [txns, accts] = await Promise.all([
          base44.entities.Transaction.list('-created_date', 500),
          base44.entities.Account.list('-created_date', 200),
        ]);
        setTransactions(txns || []);
        setAccounts(accts || []);
      } catch (e) {
        console.error('Failed to load AUM data:', e);
      }
      setLoading(false);
    })();
  }, []);

  const { timeline, monthlyData, currentAUM, peakAUM, totalInflow, totalOutflow, growthPct } = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const da = new Date(a.transaction_date || a.created_date);
      const db = new Date(b.transaction_date || b.created_date);
      return da.getTime() - db.getTime();
    });

    let cumulative = 0;
    const points = sorted.map(t => {
      const amt = Math.abs(Number(t.amount) || 0);
      if (t.type === 'withdrawal') cumulative -= amt;
      else if (t.type === 'adjustment') cumulative += (Number(t.amount) || 0);
      else cumulative += amt;

      return {
        date: t.transaction_date || (t.created_date || '').split('T')[0],
        aum: cumulative,
      };
    });

    // Compute monthly net flows directly from sorted transactions
    const monthlyFlows = {};
    sorted.forEach(t => {
      const ym = (t.transaction_date || (t.created_date || '').split('T')[0] || '').substring(0, 7);
      if (!ym) return;
      if (!monthlyFlows[ym]) monthlyFlows[ym] = { month: ym, label: formatMonthLabel(ym), inflow: 0, outflow: 0, endAum: 0, txnCount: 0 };
      monthlyFlows[ym].txnCount += 1;
      const amt = Math.abs(Number(t.amount) || 0);
      if (t.type === 'withdrawal') monthlyFlows[ym].outflow += amt;
      else if (t.type === 'adjustment') {
        if ((Number(t.amount) || 0) >= 0) monthlyFlows[ym].inflow += amt;
        else monthlyFlows[ym].outflow += Math.abs(Number(t.amount) || 0);
      }
      else monthlyFlows[ym].inflow += amt;
    });

    // Track cumulative endAum per month
    let runCum = 0;
    const monthlyArr = Object.values(monthlyFlows).sort((a, b) => a.month.localeCompare(b.month));
    monthlyArr.forEach(m => {
      runCum += m.inflow - m.outflow;
      m.endAum = runCum;
    });

    const timelineData = monthlyArr.map(m => ({
      label: m.label,
      aum: m.endAum,
      inflow: m.inflow,
      outflow: m.outflow,
      net: m.inflow - m.outflow,
      txnCount: m.txnCount,
    }));

    const totalAcctAUM = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    const currentAUMVal = monthlyArr.length > 0 ? monthlyArr[monthlyArr.length - 1].endAum : totalAcctAUM;
    const peakAUMVal = monthlyArr.reduce((max, m) => Math.max(max, m.endAum), 0);
    const totalIn = monthlyArr.reduce((s, m) => s + m.inflow, 0);
    const totalOut = monthlyArr.reduce((s, m) => s + m.outflow, 0);

    const firstVal = monthlyArr.length > 0 ? monthlyArr[0].endAum : 0;
    const growth = firstVal > 0 ? ((currentAUMVal - firstVal) / firstVal) * 100 : 0;

    return {
      timeline: timelineData,
      monthlyData: monthlyArr,
      currentAUM: currentAUMVal,
      peakAUM: peakAUMVal,
      totalInflow: totalIn,
      totalOutflow: totalOut,
      growthPct: growth,
    };
  }, [transactions, accounts]);

  if (loading) {
    return (
      <OperationsPageLayout title="AUM Growth" description="Assets under management over time" icon={TrendingUp}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="AUM Growth" description="Total assets under management over time" icon={TrendingUp}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <VantorisKPICard
          label="Current AUM"
          value={formatCurrency(currentAUM)}
          sublabel="Across all active accounts"
          icon={DollarSign}
          accent="navy"
          hero
          trend={growthPct !== 0 ? { value: Math.round(growthPct * 10) / 10, label: 'since inception' } : undefined}
        />
        <VantorisKPICard
          label="Peak AUM"
          value={formatCurrency(peakAUM)}
          sublabel="All-time high"
          icon={TrendingUp}
          accent="gold"
        />
        <VantorisKPICard
          label="Total Inflows"
          value={formatCurrency(totalInflow)}
          sublabel="Deposits & openings"
          icon={ArrowUpRight}
          accent="mint"
        />
        <VantorisKPICard
          label="Total Outflows"
          value={formatCurrency(totalOutflow)}
          sublabel="Withdrawals & debits"
          icon={ArrowDownRight}
          accent="crimson"
        />
      </div>

      {/* AUM Over Time — Area Chart */}
      <div className="vantoris-card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground font-semibold text-base">Assets Under Management</h3>
            <p className="text-gray text-xs mt-0.5">Cumulative balance growth by month</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/5 border border-navy/10">
            <Activity size={14} className="text-navy" />
            <span className="text-xs font-medium text-navy">{timeline.length} months</span>
          </div>
        </div>
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray">
            <Wallet size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No transaction data yet to display AUM growth.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#071C38" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#071C38" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
              <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'AUM']}
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(7,28,56,0.08)', fontSize: 13 }}
                labelStyle={{ fontWeight: 600, color: '#071C38' }}
              />
              <Area type="monotone" dataKey="aum" stroke="#071C38" strokeWidth={2.5} fill="url(#aumGradient)" dot={{ fill: '#071C38', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transaction Volume Trends */}
      <div className="vantoris-card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground font-semibold text-base">Transaction Volume Trends</h3>
            <p className="text-gray text-xs mt-0.5">Number of transactions and volume by month</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/5 border border-navy/10">
            <Activity size={14} className="text-navy" />
            <span className="text-xs font-medium text-navy">{timeline.reduce((s, t) => s + (t.txnCount || 0), 0)} transactions</span>
          </div>
        </div>
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray text-sm">No volume data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={40} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(7,28,56,0.08)', fontSize: 13 }}
                labelStyle={{ fontWeight: 600, color: '#071C38' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar yAxisId="left" dataKey="txnCount" name="Transaction Count" fill="#1F5EFF" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="net" name="Net Volume" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Flows — Bar Chart */}
      <div className="vantoris-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground font-semibold text-base">Monthly Capital Flows</h3>
            <p className="text-gray text-xs mt-0.5">Inflows vs outflows by month</p>
          </div>
        </div>
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray text-sm">No flow data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
              <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(7,28,56,0.08)', fontSize: 13 }}
                labelStyle={{ fontWeight: 600, color: '#071C38' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="inflow" name="Inflows" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Outflows" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </OperationsPageLayout>
  );
}