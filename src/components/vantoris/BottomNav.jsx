import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Gift, Clock } from 'lucide-react';
import { TabHistoryContext } from '@/lib/TabHistoryContext';

const navItems = [
  {
    label: 'Money',
    path: '/',
    icon: CreditCard,
    match: (p, search) =>
      (p === '/' && !new URLSearchParams(search).get('tab')) ||
      p.startsWith('/accounts') ||
      p.startsWith('/move-money'),
  },
  {
    label: 'Rewards',
    path: '/?tab=rewards',
    icon: Gift,
    match: (p, search) =>
      (p === '/' && new URLSearchParams(search).get('tab') === 'rewards') ||
      p.startsWith('/services') ||
      p.startsWith('/herobox'),
  },
  {
    label: 'Activity',
    path: '/?tab=activity',
    icon: Clock,
    match: (p, search) =>
      (p === '/' && new URLSearchParams(search).get('tab') === 'activity') ||
      p.startsWith('/more') ||
      p.startsWith('/messages'),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const { getTabPath } = useContext(TabHistoryContext);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#eff3f4]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-[430px] mx-auto px-2">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname, location.search);
          const Icon = item.icon;
          const to = item.path.startsWith('/?') ? item.path : getTabPath(item.path);
          return (
            <Link
              key={item.label}
              to={to}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-14 rounded-xl transition-colors ${
                isActive ? 'text-[#0f1419]' : 'text-[#536471] hover:text-[#0f1419]'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.6} />
              <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
