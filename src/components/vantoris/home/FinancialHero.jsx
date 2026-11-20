import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, Search, Bell, ArrowLeftRight } from 'lucide-react';

export default function FinancialHero({
  firstName,
  greeting,
  netWorth,
  availableCash,
  dailyChange,
  hideBalance,
  onToggleBalance,
  unreadCount,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isGain = dailyChange >= 0;
  const changePct = netWorth > 0 ? (Math.abs(dailyChange) / netWorth) * 100 : 0;

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/accounts');
      setSearchQuery('');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="vantoris-balance-hero rounded-3xl p-6 mb-4 relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-brass/[0.05] blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10">
        {/* Top row: greeting + actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] font-medium">{greeting}</p>
            <h1 className="text-white text-xl font-bold tracking-tight">{firstName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBalance}
              className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all"
            >
              {hideBalance ? <EyeOff size={15} className="text-white/60" /> : <Eye size={15} className="text-white/60" />}
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all relative"
            >
              <Bell size={15} className="text-white/60" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brass text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Net worth */}
        <div className="mb-5">
          <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Total Net Worth</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              {hideBalance ? '••••••••' : formatCurrency(netWorth)}
            </h2>
          </div>
          {dailyChange !== 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${isGain ? 'bg-mint/20' : 'bg-crimson/20'}`}>
                {isGain ? <ArrowUpRight size={12} className="text-mint" /> : <ArrowDownRight size={12} className="text-crimson" />}
                <span className={`text-xs font-semibold ${isGain ? 'text-mint' : 'text-crimson'}`}>
                  {hideBalance ? '•••' : formatCurrency(Math.abs(dailyChange))}
                </span>
                <span className={`text-[10px] ${isGain ? 'text-mint/70' : 'text-crimson/70'}`}>
                  ({isGain ? '+' : '−'}{changePct.toFixed(2)}%)
                </span>
              </div>
              <span className="text-white/30 text-[10px]">Today</span>
            </div>
          )}
        </div>

        {/* Available Cash */}
        <div className="pt-4 border-t border-white/8 mb-4">
          <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Available Cash</p>
          <p className="text-white font-semibold text-base">
            {hideBalance ? '••••••' : formatCurrency(availableCash)}
          </p>
        </div>

        {/* Search + Quick Transfer */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions, accounts…"
              className="w-full bg-white/8 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs placeholder:text-white/30 focus:outline-none focus:bg-white/12 transition-all"
            />
          </form>
          <button
            onClick={() => navigate('/move-money')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brass hover:bg-brass/90 rounded-xl text-white text-xs font-semibold transition-all whitespace-nowrap"
          >
            <ArrowLeftRight size={13} />
            Transfer
          </button>
        </div>
      </div>
    </motion.div>
  );
}