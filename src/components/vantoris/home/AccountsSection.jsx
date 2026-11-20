import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { ChevronRight, Wallet, PiggyBank, Landmark, Building2, Coins, Users } from 'lucide-react';

const TYPE_META = {
  Checking: { icon: Wallet, color: 'text-navy', bg: 'bg-navy/8' },
  Savings: { icon: PiggyBank, color: 'text-mint', bg: 'bg-mint/12' },
  'Money Market': { icon: Landmark, color: 'text-brass', bg: 'bg-brass/12' },
  CD: { icon: Coins, color: 'text-champagne', bg: 'bg-champagne/12' },
  Joint: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/12' },
  Business: { icon: Building2, color: 'text-crimson', bg: 'bg-crimson/10' },
};

export default function AccountsSection({ accounts, hideBalance }) {
  const navigate = useNavigate();

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">Your Accounts</h3>
        <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium flex items-center gap-0.5">
          View All <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2.5">
        {accounts.map((acct, idx) => {
          const meta = TYPE_META[acct.account_type] || TYPE_META.Checking;
          const Icon = meta.icon;
          return (
            <motion.button
              key={acct.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/accounts/${acct.id}`)}
              className="w-full flex items-center gap-3 p-3.5 vantoris-glass hover:shadow-float transition-all group text-left"
            >
              <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={meta.color} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm">{acct.account_name || acct.account_type}</p>
                <p className="text-gray text-[11px]">
                  {acct.account_type} · ••{acct.account_number?.slice(-4) || '····'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-foreground font-semibold text-sm">
                  {hideBalance ? '••••' : formatCurrency(acct.balance || 0)}
                </p>
                <p className={`text-[10px] ${acct.status === 'active' ? 'text-mint' : 'text-crimson'}`}>
                  {acct.status}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray/20 group-hover:text-navy/30 transition-all" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}