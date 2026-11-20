import React from 'react';
import { Sparkles, Headphones, UserCircle } from 'lucide-react';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';

const TABS = [
  { id: 'advisor', label: 'Advisor', icon: Sparkles, sub: 'AI Assistant' },
  { id: 'support', label: 'Support', icon: Headphones, sub: 'WhatsApp' },
  { id: 'manager', label: 'Manager', icon: UserCircle, sub: 'Your RM' },
];

export default function ConversationTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 vantoris-glass-header">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
              isActive
                ? 'bg-navy text-white shadow-sm'
                : 'bg-transparent text-gray hover:bg-slate-100'
            }`}
          >
            {tab.id === 'advisor' ? (
              <VantorisMonogram size={18} variant="flat" theme={isActive ? 'dark' : 'light'} />
            ) : (
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.5} />
            )}
            <div className="text-left">
              <p className="text-xs font-semibold leading-tight">{tab.label}</p>
              <p className={`text-[9px] leading-tight ${isActive ? 'text-white/60' : 'text-gray/60'}`}>{tab.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}