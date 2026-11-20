import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';

export default function SpendingInsights({ transactions, upcomingWithdrawals = [] }) {
  const deposits = transactions
    .filter(t => t.type === 'deposit' || t.type === 'opening_balance')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const withdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const total = deposits + withdrawals;
  const depositPct = total > 0 ? (deposits / total) * 100 : 0;
  const withdrawalPct = total > 0 ? (withdrawals / total) * 100 : 0;
  const netFlow = deposits - withdrawals;

  return (
    <div className="vantoris-glass-flat p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-brass" />
        <h3 className="text-foreground font-semibold text-sm">Cash Flow Insights</h3>
      </div>

      {/* Flow bar */}
      <div className="mb-4">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${depositPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-mint/70"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${withdrawalPct}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="bg-crimson/60"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint/12 flex items-center justify-center">
            <ArrowDownLeft size={14} className="text-mint" />
          </div>
          <div>
            <p className="text-gray/70 text-[10px] uppercase tracking-wider">Inflows</p>
            <p className="text-mint font-semibold text-sm">{formatCurrency(deposits)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson/10 flex items-center justify-center">
            <ArrowUpRight size={14} className="text-crimson" />
          </div>
          <div>
            <p className="text-gray/70 text-[10px] uppercase tracking-wider">Outflows</p>
            <p className="text-crimson font-semibold text-sm">{formatCurrency(withdrawals)}</p>
          </div>
        </div>
      </div>

      {/* Net flow */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-gray text-xs">Net Position</span>
        <div className="flex items-center gap-1.5">
          {netFlow >= 0 ? <TrendingUp size={14} className="text-mint" /> : <TrendingDown size={14} className="text-crimson" />}
          <span className={`font-bold text-sm ${netFlow >= 0 ? 'text-mint' : 'text-crimson'}`}>{formatCurrency(netFlow)}</span>
        </div>
      </div>

      {/* Upcoming Payments / Scheduled Transfers */}
      {upcomingWithdrawals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} className="text-champagne" />
            <p className="text-gray/70 text-[10px] uppercase tracking-wider font-medium">Upcoming & Scheduled</p>
          </div>
          <div className="space-y-2">
            {upcomingWithdrawals.slice(0, 3).map((wr, idx) => (
              <div key={wr.id || idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-champagne/10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={11} className="text-champagne" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground text-xs font-medium truncate">{wr.method || 'Transfer'}</p>
                    <p className="text-gray/50 text-[10px]">Pending approval</p>
                  </div>
                </div>
                <p className="text-champagne font-semibold text-xs flex-shrink-0">{formatCurrency(wr.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}