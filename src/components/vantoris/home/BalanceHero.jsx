import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff } from 'lucide-react';

export default function BalanceHero({ totalBalance, availableBalance, pendingBalance, accountCount, hideBalance, onToggleBalance }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="vantoris-balance-hero p-6 mb-4 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/[0.06] blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet size={15} className="text-white" />
            </div>
            <span className="text-white/70 text-xs uppercase tracking-[0.15em] font-semibold">Current Balance</span>
          </div>
          <button onClick={onToggleBalance} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
            {hideBalance ? <EyeOff size={16} className="text-white/70" /> : <Eye size={16} className="text-white/70" />}
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            {hideBalance ? '••••••••' : formatCurrency(totalBalance)}
          </h2>
          <p className="text-white/60 text-xs mt-1">{accountCount} {accountCount === 1 ? 'Account' : 'Accounts'} · Updated just now</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-0.5">Available</p>
            <p className="text-white font-semibold text-sm">
              {hideBalance ? '••••••' : formatCurrency(availableBalance)}
            </p>
          </div>
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-0.5">Pending</p>
            <p className="text-white font-semibold text-sm">
              {hideBalance ? '••••••' : formatCurrency(pendingBalance)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}