import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { PieChart, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function InvestmentPortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const records = await base44.entities.InvestmentPortfolio.list('-created_date');
    if (!Array.isArray(records)) throw new Error('Investment portfolio source returned an invalid response.');
    setPortfolios(records);
  }, []);

  useEffect(() => {
    loadData().catch(() => setError('Portfolio records are unavailable. No empty-portfolio conclusion can be drawn.')).finally(() => setLoading(false));
  }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="Investment Portfolios" description="All member investment portfolios" icon={PieChart}>
      {error ? (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</div>
      ) : portfolios.length === 0 ? (
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
                  <p className="text-xs text-gray capitalize">{p.status ? String(p.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(p.total_value, p.currency || p.currency_code || null)}</p>
                  <p className="text-xs text-gray">Cash: {formatCurrency(p.cash_balance, p.currency || p.currency_code || null)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray">Invested: {formatCurrency(p.invested_amount, p.currency || p.currency_code || null)}</span>
                <span className="text-gray">P&amp;L: {formatCurrency(
                  p.unrealized_pnl == null || p.realized_pnl == null ||
                  (typeof p.unrealized_pnl === 'string' && p.unrealized_pnl.trim() === '') ||
                  (typeof p.realized_pnl === 'string' && p.realized_pnl.trim() === '') ||
                  !Number.isFinite(Number(p.unrealized_pnl)) || !Number.isFinite(Number(p.realized_pnl))
                    ? null
                    : Number(p.unrealized_pnl) + Number(p.realized_pnl),
                  p.currency || p.currency_code || null
                )}</span>
                {p.provider_connected === true ? (
                  <span className="text-mint font-medium">Provider: {p.provider_name || 'Provider name not supplied'}</span>
                ) : p.provider_connected === false ? (
                  <span className="text-warning font-medium">No provider connected</span>
                ) : (
                  <span className="text-gray font-medium">Provider status not supplied</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}