import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecentActivity({ transactions }) {
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
            <p className="text-gray text-sm">No transactions yet</p>
          </div>
        ) : (
          transactions.slice(0, 6).map((txn, idx) => {
            const isCredit = txn.type === 'deposit' || txn.type === 'opening_balance';
            const isDebit = txn.type === 'withdrawal';
            const isOpen = expanded === txn.id;
            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : txn.id)}
                  className="w-full flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCredit ? 'bg-mint/12' : isDebit ? 'bg-crimson/10' : 'bg-brass/10'
                    }`}>
                      {isCredit
                        ? <ArrowDownLeft size={15} className="text-mint" />
                        : isDebit
                        ? <ArrowUpRight size={15} className="text-crimson" />
                        : <TrendingUp size={15} className="text-brass" />
                      }
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-foreground text-sm font-medium truncate">{txn.description || txn.type?.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray text-[11px] capitalize">{txn.type?.replace(/_/g, ' ')}</p>
                        <span className="text-gray/30 text-[10px]">·</span>
                        <p className="text-gray text-[11px]">
                          {new Date(txn.transaction_date || txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold text-sm ${isDebit ? 'text-crimson' : 'text-mint'}`}>
                      {isDebit ? '−' : '+'}{formatCurrency(Math.abs(txn.amount))}
                    </p>
                    {txn.balance_after != null && (
                      <p className="text-gray/50 text-[10px]">Bal: {formatCurrency(txn.balance_after)}</p>
                    )}
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
                        <span className="text-gray">{new Date(txn.transaction_date || txn.created_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
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