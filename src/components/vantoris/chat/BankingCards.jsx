import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CalendarClock,
  FileText,
  CreditCard,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BANKING_ACTIONS = [
  { id: 'send', label: 'Send Money', icon: ArrowUpRight, path: '/move-money', color: 'bg-navy' },
  { id: 'request', label: 'Request', icon: ArrowDownLeft, path: '/move-money', color: 'bg-mint' },
  { id: 'transfer', label: 'Transfer', icon: ArrowUpRight, path: '/move-money', color: 'bg-champagne' },
  { id: 'appointment', label: 'Schedule', icon: CalendarClock, path: '/advisor', color: 'bg-gold' },
  { id: 'statement', label: 'Statements', icon: FileText, path: '/documents', color: 'bg-navy' },
  { id: 'card', label: 'Card Controls', icon: CreditCard, path: '/more', color: 'bg-crimson' },
  { id: 'wire', label: 'Wire Tracking', icon: Search, path: '/accounts', color: 'bg-champagne' },
];

export default function BankingCards() {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-2 bg-white/50 border-t border-slate-100">
      <div className="flex items-center gap-2 overflow-x-auto vantoris-scroll pb-1">
        {BANKING_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-navy/20 hover:shadow-sm transition-all min-w-[68px]"
            >
              <div className={`w-8 h-8 rounded-xl ${action.color} flex items-center justify-center`}>
                <Icon size={15} className="text-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground leading-tight text-center">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}