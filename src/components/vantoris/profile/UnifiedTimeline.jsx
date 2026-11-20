import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Heart, Bell,
  ShieldCheck, Shield, CheckCircle2, XCircle, TrendingUp, DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import SectionTitle from './SectionTitle';

const TXN_ICONS = {
  deposit: { icon: ArrowDownLeft, color: 'text-mint', bg: 'bg-mint/10' },
  opening_balance: { icon: ArrowDownLeft, color: 'text-mint', bg: 'bg-mint/10' },
  withdrawal: { icon: ArrowUpRight, color: 'text-crimson', bg: 'bg-crimson/10' },
  transfer: { icon: ArrowLeftRight, color: 'text-navy', bg: 'bg-navy/8' },
  interest: { icon: TrendingUp, color: 'text-mint', bg: 'bg-mint/10' },
  fee: { icon: DollarSign, color: 'text-gray', bg: 'bg-slate-100' },
  adjustment: { icon: Activity, color: 'text-brass', bg: 'bg-brass/10' },
};

const AUDIT_ICONS = {
  transaction_created: { icon: DollarSign, color: 'text-navy', bg: 'bg-navy/8' },
  transaction_edited: { icon: Activity, color: 'text-gray', bg: 'bg-slate-100' },
  balance_adjusted: { icon: DollarSign, color: 'text-brass', bg: 'bg-brass/10' },
  withdrawal_processed: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/10' },
  withdrawal_rejected: { icon: XCircle, color: 'text-crimson', bg: 'bg-crimson/10' },
  account_created: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/10' },
  account_status_changed: { icon: Shield, color: 'text-brass', bg: 'bg-brass/10' },
  application_approved: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/10' },
  application_rejected: { icon: XCircle, color: 'text-crimson', bg: 'bg-crimson/10' },
  kyc_approved: { icon: ShieldCheck, color: 'text-mint', bg: 'bg-mint/10' },
  kyc_rejected: { icon: XCircle, color: 'text-crimson', bg: 'bg-crimson/10' },
};

export default function UnifiedTimeline({ transactions, heroActivities, notifications, auditLogs }) {
  const items = [
    ...transactions.map(t => {
      const cfg = TXN_ICONS[t.type] || { icon: Activity, color: 'text-gray', bg: 'bg-slate-100' };
      // Use effective date — respects transaction_date > posting_date > created_date
      const effDate = t.transaction_date || t.posting_date || t.created_date;
      return {
        id: `txn-${t.id}`,
        date: new Date(effDate),
        icon: cfg.icon, iconColor: cfg.color, iconBg: cfg.bg,
        title: t.description || t.type,
        subtitle: new Date(effDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: (t.type === 'withdrawal' || t.type === 'fee') ? -Math.abs(t.amount) : t.amount,
        isCurrency: true,
      };
    }),
    ...heroActivities.map(a => ({
      id: `hero-${a.id}`,
      date: new Date(a.created_date),
      icon: Heart, iconColor: 'text-brass', iconBg: 'bg-brass/10',
      title: a.title,
      subtitle: new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: a.amount > 0 ? formatCurrency(a.amount) : null,
      isCurrency: false,
    })),
    ...(auditLogs || []).map(log => {
      const cfg = AUDIT_ICONS[log.action_type] || { icon: Activity, color: 'text-gray', bg: 'bg-slate-100' };
      return {
        id: `audit-${log.id}`,
        date: new Date(log.created_date),
        icon: cfg.icon, iconColor: cfg.color, iconBg: cfg.bg,
        title: log.description,
        subtitle: new Date(log.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: null,
        isCurrency: false,
      };
    }),
    ...notifications.map(n => ({
      id: `notif-${n.id}`,
      date: new Date(n.created_date),
      icon: Bell, iconColor: 'text-navy', iconBg: 'bg-navy/8',
      title: n.title,
      subtitle: new Date(n.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: null,
      isCurrency: false,
    })),
  ].sort((a, b) => b.date - a.date).slice(0, 10);

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <SectionTitle
        icon={Activity}
        title="Activity Timeline"
        right={<Link to="/accounts" className="text-navy text-[10px] font-semibold hover:underline">View All</Link>}
      />
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                <Icon size={15} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{item.title}</p>
                <p className="text-gray text-[10px]">{item.subtitle}</p>
              </div>
              {item.isCurrency ? (
                <span className={`text-sm font-bold whitespace-nowrap ${item.amount < 0 ? 'text-crimson' : 'text-mint'}`}>
                  {item.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
                </span>
              ) : item.amount ? (
                <span className="text-sm font-bold text-brass whitespace-nowrap">{item.amount}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}