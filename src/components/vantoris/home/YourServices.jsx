import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package, Wallet, CreditCard, Lock,
  Building2, ChevronRight, Truck, Heart, RefreshCw
} from 'lucide-react';

const SERVICE_REGISTRY = [
  {
    id: 'herobox',
    title: 'HeroBox',
    subtitle: 'Mission support platform',
    icon: Package,
    route: '/herobox',
    requiresHeroBox: true,
  },
  {
    id: 'banking',
    title: 'Banking',
    subtitle: 'Checking & savings',
    icon: Wallet,
    route: '/accounts',
    accountTypes: ['Checking', 'Savings', 'Money Market', 'CD', 'Joint'],
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Debit & credit cards',
    icon: CreditCard,
    route: '/move-money',
    requiresAccount: true,
  },
  {
    id: 'wealth-vault',
    title: 'Wealth Vault',
    subtitle: 'Premium savings & MM',
    icon: Lock,
    route: '/accounts',
    accountTypes: ['Savings', 'Money Market'],
  },
  {
    id: 'business-treasury',
    title: 'Business Treasury',
    subtitle: 'Business banking suite',
    icon: Building2,
    route: '/accounts',
    accountTypes: ['Business'],
  },
];

export function getAvailableServices(accounts, heroboxProfile) {
  const accountTypes = new Set(accounts.map(a => a.account_type));
  const hasAccount = accounts.length > 0;

  return SERVICE_REGISTRY.filter(service => {
    if (service.requiresHeroBox) return !!heroboxProfile;
    if (service.requiresAccount && hasAccount) return true;
    if (service.accountTypes?.some(t => accountTypes.has(t))) return true;
    return false;
  });
}

export function getDiscoverServices(accounts, heroboxProfile) {
  const available = new Set(getAvailableServices(accounts, heroboxProfile).map(s => s.id));
  return SERVICE_REGISTRY.filter(s => !available.has(s.id));
}

function HeroBoxCard({ navigate, transactions }) {
  const heroboxTxns = transactions.filter(t =>
    t.description?.toLowerCase().includes('herobox') ||
    t.description?.toLowerCase().includes('care package') ||
    t.description?.toLowerCase().includes('sponsored') ||
    t.reference === 'HeroBox'
  ).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="vantoris-glass-premium p-5 mb-3 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brass/[0.06] blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brass/12 flex items-center justify-center">
              <Package size={18} className="text-brass" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-sm">HeroBox</h3>
              <p className="text-gray text-[11px]">Care packages worldwide</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/services')}
            className="text-brass text-xs font-medium flex items-center gap-0.5"
          >
            Manage <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => navigate('/herobox')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all"
          >
            <Package size={16} className="text-navy" />
            <span className="text-gray text-[10px] font-medium">Sponsor</span>
          </button>
          <button
            onClick={() => navigate('/herobox')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all"
          >
            <Truck size={16} className="text-navy" />
            <span className="text-gray text-[10px] font-medium">Track</span>
          </button>
          <button
            onClick={() => navigate('/herobox')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all"
          >
            <RefreshCw size={16} className="text-navy" />
            <span className="text-gray text-[10px] font-medium">Mission</span>
          </button>
        </div>

        {heroboxTxns.length > 0 ? (
          <div>
            <p className="text-gray/60 text-[10px] uppercase tracking-wider font-medium mb-2">Recent Activity</p>
            <div className="space-y-1.5">
              {heroboxTxns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Heart size={12} className="text-brass/60 flex-shrink-0" />
                    <p className="text-foreground text-xs font-medium truncate">{txn.description || 'HeroBox activity'}</p>
                  </div>
                  <span className="text-gray text-[10px] flex-shrink-0">
                    {new Date(txn.transaction_date || txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50/60 text-center">
            <p className="text-gray text-[11px]">No mission activity yet — sponsor your first package</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function YourServices({ accounts, transactions, heroboxProfile }) {
  const navigate = useNavigate();
  const services = getAvailableServices(accounts, heroboxProfile);

  if (services.length === 0) return null;

  const herobox = services.find(s => s.id === 'herobox');
  const otherServices = services.filter(s => s.id !== 'herobox');

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">Your Services</h3>
        <span className="text-gray text-[11px]">{services.length} active</span>
      </div>

      {herobox && <HeroBoxCard navigate={navigate} transactions={transactions} />}

      {otherServices.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {otherServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(service.route)}
                className="vantoris-glass p-4 text-left hover:shadow-float transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-navy/8 border border-navy/10 flex items-center justify-center mb-3 group-hover:bg-navy/12 transition-all">
                  <Icon size={18} className="text-navy" strokeWidth={2} />
                </div>
                <p className="text-foreground font-semibold text-sm">{service.title}</p>
                <p className="text-gray text-[11px] mt-0.5">{service.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}