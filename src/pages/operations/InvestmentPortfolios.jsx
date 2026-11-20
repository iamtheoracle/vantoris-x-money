import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { PieChart, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function InvestmentPortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setPortfolios(await base44.entities.InvestmentPortfolio.list('-created_date'));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="Investment Portfolios" description="All member investment portfolios" icon={PieChart}>
      {portfolios.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <p className="text-gray">No portfolios created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map(p => (
            <div key={p.id} className="vantoris-glass p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{p.portfolio_name}</p>
                  <p className="text-xs text-gray capitalize">{(p.status || 'pending_setup').replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(p.total_value || 0)}</p>
                  <p className="text-xs text-gray">Cash: {formatCurrency(p.cash_balance || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray">Invested: {formatCurrency(p.invested_amount || 0)}</span>
                <span className="text-gray">P&L: {formatCurrency((p.unrealized_pnl || 0) + (p.realized_pnl || 0))}</span>
                {p.provider_connected ? (
                  <span className="text-mint font-medium">Provider: {p.provider_name || 'Connected'}</span>
                ) : (
                  <span className="text-warning font-medium">No provider connected</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}