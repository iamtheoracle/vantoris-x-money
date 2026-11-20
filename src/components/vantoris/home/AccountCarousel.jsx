import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';

const TYPE_GRADIENTS = {
  Personal: 'from-brass/8 to-brass/2',
  Joint: 'from-champagne/8 to-champagne/2',
  Business: 'from-slate-300/30 to-slate-200/5',
  Organization: 'from-mint/8 to-mint/2',
};

function maskNumber(num) {
  if (!num) return '••••';
  const last4 = String(num).replace(/\s/g, '').slice(-4);
  return `•••• ${last4}`;
}

export default function AccountCarousel({ accounts }) {
  const navigate = useNavigate();

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">My Accounts</h3>
        <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium">View All</button>
      </div>
      <div className="overflow-x-auto vantoris-scroll -mx-5 px-5 pb-1">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {accounts.map((account, idx) => (
            <motion.button
              key={account.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="vantoris-glass-premium p-4 text-left hover:border-brass/25 transition-all relative overflow-hidden"
              style={{ width: '240px', flexShrink: 0 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENTS[account.account_type] || TYPE_GRADIENTS.Personal} opacity-70`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-brass/10 border border-brass/10 flex items-center justify-center">
                    <span className="text-brass text-xs font-bold uppercase">{account.account_type?.[0] || 'A'}</span>
                  </div>
                  <StatusBadge status={account.status} />
                </div>
                <p className="text-foreground font-medium text-sm mb-0.5 truncate">{account.account_name}</p>
                <p className="text-gray/60 text-[10px] font-mono mb-3">{maskNumber(account.account_number)}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray/70 text-[10px] uppercase tracking-wider">Balance</p>
                    <p className="text-foreground font-bold text-lg">{formatCurrency(account.balance || 0)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray mb-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}