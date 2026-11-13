import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Landmark,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Settings,
  Plane,
  Building2,
  Compass,
  Package,
  MessageCircle,
  FileText,
  LifeBuoy,
  User,
  Menu,
  Newspaper,
} from 'lucide-react';
import ShieldLogo from './ShieldLogo';

const GROUPS = [
  {
    title: 'Overview',
    items: [
      { label: 'Home', to: '/', icon: Home, active: (path) => path === '/' },
    ],
  },
  {
    title: 'Accounts & wealth',
    items: [
      { label: 'Accounts', to: '/accounts', icon: Landmark, active: (path) => path.startsWith('/accounts') },
      { label: 'Money', to: '/money', icon: ArrowLeftRight, active: (path) => ['/money', '/move-money', '/move', '/qr'].some((route) => path.startsWith(route)) },
      { label: 'Investments', to: '/investment', icon: TrendingUp, active: (path) => path.startsWith('/investment') },
      { label: 'Cards', to: '/cards', icon: CreditCard, active: (path) => path.startsWith('/cards') },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Services', to: '/services', icon: Settings, active: (path) => path.startsWith('/services') },
      { label: 'Travel', to: '/travel', icon: Plane, active: (path) => path.startsWith('/travel') || path.startsWith('/discover/flights') },
      { label: 'Homes', to: '/homes', icon: Building2, active: (path) => path.startsWith('/homes') || path.startsWith('/discover/housing') },
      { label: 'HeroBox', to: '/herobox-hub', icon: Package, active: (path) => path.startsWith('/herobox') },
      { label: 'Discover', to: '/discover', icon: Compass, active: (path) => path === '/discover' || path === '/discovery' || ['/discover/fx', '/discover/ngo', '/discover/marketing'].some((route) => path.startsWith(route)) },
      { label: 'News', to: '/news', icon: Newspaper, active: (path) => path === '/news' || path.startsWith('/discover/news') },
    ],
  },
  {
    title: 'Relationship',
    items: [
      { label: 'Messages', to: '/messages', icon: MessageCircle, active: (path) => path.startsWith('/messages') },
      { label: 'Documents', to: '/documents', icon: FileText, active: (path) => path.startsWith('/documents') },
      { label: 'Support', to: '/support', icon: LifeBuoy, active: (path) => path.startsWith('/support') },
      { label: 'Profile', to: '/profile', icon: User, active: (path) => path.startsWith('/profile') },
      { label: 'More', to: '/more', icon: Menu, active: (path) => path.startsWith('/more') },
    ],
  },
];

export default function MemberSidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-[268px] shrink-0 flex-col border-r border-r border-[#E9E7E1] bg-[#FBFBF9] text-[#18212B]">
      <div className="flex items-center gap-3 border-b border-[#E9E7E1] px-5 py-6">
        <ShieldLogo size={40} theme="dark" variant="metallic" />
        <div className="min-w-0">
          <p className="truncate font-serif text-[19px] leading-tight tracking-wide text-[#14202B]">Vantoris</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9A7841]">Private Institution</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Member navigation">
        {GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h2 className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8A9096]">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.active(location.pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFBF9]',
                      active
                        ? 'bg-[#EFEDE7] font-semibold text-[#14202B] ring-1 ring-inset ring-[#D4AF37]/35'
                        : 'text-[#59636D] hover:bg-[#F0EFEA] hover:text-[#14202B]',
                    ].join(' ')}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.7} className={active ? 'text-[#9A7841]' : 'text-[#8A9096] group-hover:text-[#9A7841]'} />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#14202B]/45">Private client workspace</p>
        <p className="mt-1 text-[10px] text-[#9AA1A7]">Vantoris Private Institution</p>
      </div>
    </aside>
  );
}
