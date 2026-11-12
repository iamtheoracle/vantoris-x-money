import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { PieChart, ArrowDownToLine, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';


function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

export default function InvestmentDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ portfolios: false, deposits: false, withdrawals: false, signals: false });

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
      const [portfolioResult, depositResult, withdrawalResult, signalResult] = await Promise.all([
        safeList(base44.entities.InvestmentPortfolio.list('-created_date', 100)),
        safeList(base44.entities.InvestmentDepositRequest.filter({ status: 'requested' })),
        safeList(base44.entities.InvestmentWithdrawalRequest.filter({ status: 'requested' })),
        safeList(base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5)),
      ]);
      if (!active) return;
      setPortfolios(portfolioResult.rows);
      setDeposits(depositResult.rows);
      setWithdrawals(withdrawalResult.rows);
      setSignals(signalResult.rows);
      setErrors({
        portfolios: portfolioResult.failed,
        deposits: depositResult.failed,
        withdrawals: withdrawalResult.failed,
        signals: signalResult.failed,
      });
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout title="Investment records" description="Read-only portfolio and request records. No AUM, valuation, or investment execution is inferred from partial records." icon={PieChart}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Investment aggregates and actions unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Portfolio values, cash, invested capital, performance, and transaction volume require a verified valuation source, currency model, investment ledger, and reconciliation. Deposit and withdrawal request records are not executed investment transactions.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Portfolio records returned', value: errors.portfolios ? 'Unavailable' : portfolios.length, note: 'Bounded query · limit 100', icon: PieChart },
          { label: 'Investment deposit requests returned', value: errors.deposits ? 'Unavailable' : deposits.length, note: 'Status-filtered query', icon: ArrowDownToLine },
          { label: 'Investment withdrawal requests returned', value: errors.withdrawals ? 'Unavailable' : withdrawals.length, note: 'Status-filtered query', icon: ArrowUpRight },
          { label: 'Active signal records returned', value: errors.signals ? 'Unavailable' : signals.length, note: 'Bounded query · limit 5', icon: TrendingUp },
        ].map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="vantoris-glass rounded-2xl p-4"><Icon size={17} className="mb-3 text-brass" /><p className="text-xl font-bold text-foreground">{stat.value}</p><p className="mt-1 text-xs text-gray">{stat.label}</p><p className="mt-2 text-[10px] text-gray/70">{stat.note}</p></div>;
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="vantoris-glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2"><ArrowDownToLine size={18} className="text-mint" /><h3 className="text-sm font-bold text-foreground">Investment deposit requests</h3></div>
          {loading ? <p className="py-4 text-center text-sm text-gray">Loading request records…</p> : errors.deposits ? <p role="status" className="text-xs text-amber-700">Deposit request records unavailable; zero must not be inferred.</p> : deposits.length === 0 ? <p className="py-4 text-center text-sm text-gray">No request records returned for this status filter.</p> : (
            <div className="space-y-2">{deposits.slice(0, 20).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0"><div><p className="text-sm font-medium text-foreground">{amountLabel(item.amount, item.currency || item.currency_code)}</p><p className="text-xs text-gray">{dateLabel(item.created_date)}</p></div><span className="text-xs capitalize text-brass">{item.status ? String(item.status).replace(/_/g, ' ') : 'Status not supplied'}</span></div>)}</div>
          )}
        </section>
        <section className="vantoris-glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2"><ArrowUpRight size={18} className="text-crimson" /><h3 className="text-sm font-bold text-foreground">Investment withdrawal requests</h3></div>
          {loading ? <p className="py-4 text-center text-sm text-gray">Loading request records…</p> : errors.withdrawals ? <p role="status" className="text-xs text-amber-700">Withdrawal request records unavailable; zero must not be inferred.</p> : withdrawals.length === 0 ? <p className="py-4 text-center text-sm text-gray">No request records returned for this status filter.</p> : (
            <div className="space-y-2">{withdrawals.slice(0, 20).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0"><div><p className="text-sm font-medium text-foreground">{amountLabel(item.amount, item.currency || item.currency_code)}</p><p className="text-xs text-gray">{dateLabel(item.created_date)}</p></div><span className="text-xs capitalize text-brass">{item.status ? String(item.status).replace(/_/g, ' ') : 'Status not supplied'}</span></div>)}</div>
          )}
        </section>
      </div>

      <section className="vantoris-glass rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-champagne" /><h3 className="text-sm font-bold text-foreground">Stored investment signal records</h3></div>
        {loading ? <p className="py-4 text-center text-sm text-gray">Loading signal records…</p> : errors.signals ? <p role="status" className="text-xs text-amber-700">Signal records unavailable; zero signals must not be inferred.</p> : signals.length === 0 ? <p className="py-4 text-center text-sm text-gray">No active signal records were returned.</p> : (
          <div className="space-y-2">{signals.map((signal) => <div key={signal.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0"><div><p className="text-sm font-medium text-foreground">{signal.asset_symbol || 'Asset not supplied'} · {signal.signal_type || 'Signal type not supplied'}</p><p className="text-xs text-gray">{dateLabel(signal.created_date)}</p></div><span className="text-xs text-warning">{signal.provider_connected ? 'Provider status reported connected' : 'Provider not verified'}</span></div>)}</div>
        )}
        <p className="mt-3 text-[11px] text-gray/70">Stored signals are not investment advice, executable orders, or proof of a live market-data connection.</p>
      </section>
    </OperationsPageLayout>
  );
}
