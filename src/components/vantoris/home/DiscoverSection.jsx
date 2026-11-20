import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Home, PiggyBank, Banknote, Crown, CalendarClock, Building2, CreditCard, Package, ChevronRight } from 'lucide-react';

// Each discover item has `hideIf` — an array of service IDs from YourServices.
// If the user has ANY of those services, the discover item is hidden.
const DISCOVER_CATALOG = [
  { id: 'insurance', title: 'Insurance', subtitle: 'Protect what matters', icon: Shield, route: '/services', hideIf: [] },
  { id: 'retirement', title: 'Retirement Plans', subtitle: 'Plan for tomorrow', icon: PiggyBank, route: '/services', hideIf: [] },
  { id: 'loans', title: 'Loans & Credit', subtitle: 'Flexible financing', icon: Banknote, route: '/services', hideIf: [] },
  { id: 'wealth-management', title: 'Wealth Management', subtitle: 'Expert advisory services', icon: Crown, route: '/advisor', hideIf: ['wealth-vault'] },
  { id: 'financial-planning', title: 'Financial Planning', subtitle: 'Plan your financial future', icon: CalendarClock, route: '/advisor', hideIf: [] },
  { id: 'business-banking', title: 'Business Banking', subtitle: 'Treasury & payroll solutions', icon: Building2, route: '/services', hideIf: ['business-treasury'] },
  { id: 'premium-cards', title: 'Premium Cards', subtitle: 'Exclusive card benefits', icon: CreditCard, route: '/services', hideIf: [] },
  { id: 'herobox-premium', title: 'HeroBox Premium', subtitle: 'Concierge care packages', icon: Package, route: '/herobox', hideIf: [] },
  { id: 'herobox', title: 'HeroBox', subtitle: 'Support our military heroes', icon: Package, route: '/herobox', hideIf: [] },
];

export default function DiscoverSection({ hiddenServiceIds = [] }) {
  const navigate = useNavigate();

  const visible = DISCOVER_CATALOG.filter(item =>
    !item.hideIf.some(id => hiddenServiceIds.includes(id))
  );

  if (visible.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-foreground font-semibold text-sm">Discover</h3>
          <p className="text-gray text-[11px] mt-0.5">Explore services tailored for you</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {visible.map((service, idx) => {
          const Icon = service.icon;
          return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(service.route)}
              className="w-full flex items-center gap-3 p-3.5 vantoris-glass-flat hover:bg-slate-100/60 transition-all group text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy/8 to-navy/4 border border-navy/8 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-navy" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm">{service.title}</p>
                <p className="text-gray text-[11px] truncate">{service.subtitle}</p>
              </div>
              <ChevronRight size={16} className="text-gray/30 group-hover:text-navy/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}