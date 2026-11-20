import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, RefreshCw, Package,
  DollarSign, Building2, ChevronDown
} from 'lucide-react';

const TXN_META = {
  deposit: { icon: ArrowDownLeft, color: 'text-mint', bg: 'bg-mint/12', label: 'Deposit' },
  opening_balance: { icon: DollarSign, color: 'text-mint', bg: 'bg-mint/12', label: 'Opening Balance' },
  withdrawal: { icon: ArrowUpRight, color: 'text-crimson', bg: 'bg-crimson/10', label: 'Withdrawal' },
  transfer: { icon: RefreshCw, color: 'text-brass', bg: 'bg-brass/12', label: 'Transfer' },
  interest: { icon: TrendingUp, color: 'text-mint', bg: 'bg-mint/12', label: 'Interest' },
  fee: { icon: Building2, color: 'text-crimson', bg: 'bg-crimson/10', label: 'Fee' },
  adjustment: { icon: RefreshCw, color: 'text-gray', bg: 'bg-slate-100', label: 'Adjustment' },
};

export default function ActivityTimeline({ transactions }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">Recent Activity</h3>
        <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium">View All</button>
      </div>

      <div className="vantoris-glass-flat p-2">
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray text-sm">No activity yet</p>
            <p className="text-gray/50 text-[11px] mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          transactions.slice(0, 8).map((txn, idx) => {
            const meta = TXN_META[txn.type] || TXN_META.adjustment;
            const isCredit = txn.type === 'deposit' || txn.type === 'opening_balance' || txn.type === 'interest';
            const isDebit = txn.type === 'withdrawal' || txn.type === 'fee';
            const Icon = meta.icon;
            const isOpen = expanded === txn.id;

            const isHeroBox = txn.description?.toLowerCase().includes('herobox') ||
                              txn.description?.toLowerCase().includes('care package') ||
                              txn.description?.toLowerCase().includes('sponsored') ||
                              txn.reference === 'HeroBox';
            const displayIcon = isHeroBox ? Package : Icon;
            const displayMeta = isHeroBox
              ? { ...meta, color: 'text-brass', bg: 'bg-brass/12', label: 'HeroBox' }
              : meta;

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : txn.id)}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${displayMeta.bg} flex items-center justify-center flex-shrink-0`}>
                      <displayIcon size={15} className={displayMeta.color} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-foreground text-sm font-medium truncate">
                        {txn.description || meta.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray text-[11px] capitalize">{displayMeta.label}</p>
                        <span className="text-gray/30 text-[10px]">·</span>
                        <p className="text-gray text-[11px]">
                          {new Date(txn.transaction_date || txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-1">
                    <p className={`font-semibold text-sm ${isDebit ? 'text-crimson' : isCredit ? 'text-mint' : 'text-foreground'}`}>
                      {isDebit ? '−' : isCredit ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </p>
                    <ChevronDown size={12} className={`text-gray/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-3 overflow-hidden"
                  >
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                      {txn.reference && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray/60">Reference</span>
                          <span className="text-gray font-mono">{txn.reference}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray/60">Status</span>
                        <span className="text-mint">Processed</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray/60">Date</span>
                        <span className="text-gray">
                          {new Date(txn.transaction_date || txn.created_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      {txn.balance_after != null && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray/60">Balance After</span>
                          <span className="text-gray font-medium">{formatCurrency(txn.balance_after)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}