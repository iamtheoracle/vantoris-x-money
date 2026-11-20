import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { PieChart, ArrowDownToLine, ArrowUpRight, TrendingUp, Loader2, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function InvestmentDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [ports, deps, wrs, sigs] = await Promise.all([
      base44.entities.InvestmentPortfolio.list().catch(() => []),
      base44.entities.InvestmentDepositRequest.filter({ status: 'requested' }).catch(() => []),
      base44.entities.InvestmentWithdrawalRequest.filter({ status: 'requested' }).catch(() => []),
      base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5).catch(() => []),
    ]);
    setPortfolios(ports);
    setPendingDeposits(deps);
    setPendingWithdrawals(wrs);
    setSignals(sigs);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  const totalAUM = portfolios.reduce((s, p) => s + (p.total_value || 0), 0);
  const totalCash = portfolios.reduce((s, p) => s + (p.cash_balance || 0), 0);
  const totalInvested = portfolios.reduce((s, p) => s + (p.invested_amount || 0), 0);

  return (
    <OperationsPageLayout title="Investment Dashboard" description="Portfolio overview and operator queue" icon={PieChart}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total AUM</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalAUM)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total Cash</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalCash)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total Invested</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Active Portfolios</p>
          <p className="text-foreground text-xl font-bold mt-1">{portfolios.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="vantoris-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownToLine size={18} className="text-mint" />
            <h3 className="text-sm font-bold text-foreground">Pending Deposit Requests</h3>
          </div>
          {pendingDeposits.length === 0 ? (
            <p className="text-gray text-sm py-4 text-center">No pending deposits</p>
          ) : (
            <div className="space-y-2">
              {pendingDeposits.map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(d.amount)}</p>
                    <p className="text-xs text-gray">{d.created_date?.substring(0, 10)}</p>
                  </div>
                  <span className="text-xs text-brass font-medium">Awaiting review</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="vantoris-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={18} className="text-crimson" />
            <h3 className="text-sm font-bold text-foreground">Pending Withdrawal Requests</h3>
          </div>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-gray text-sm py-4 text-center">No pending withdrawals</p>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(w.amount)}</p>
                    <p className="text-xs text-gray">{w.created_date?.substring(0, 10)}</p>
                  </div>
                  <span className="text-xs text-brass font-medium">Awaiting review</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="vantoris-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-champagne" />
          <h3 className="text-sm font-bold text-foreground">Active Signals</h3>
        </div>
        {signals.length === 0 ? (
          <p className="text-gray text-sm py-4 text-center">No active signals</p>
        ) : (
          <div className="space-y-2">
            {signals.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.asset_symbol} · <span className="capitalize">{s.signal_type}</span></p>
                  <p className="text-xs text-gray">Confidence: {s.confidence}</p>
                </div>
                {!s.provider_connected && <span className="text-xs text-warning">Data not connected</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </OperationsPageLayout>
  );
}