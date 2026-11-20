import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Send, FileText, Package, Wallet, Heart } from 'lucide-react';

const EXAMPLES = [
  { label: 'Transfer money', icon: Send, route: '/move-money' },
  { label: 'View accounts', icon: Wallet, route: '/accounts' },
  { label: 'Sponsor a Hero', icon: Package, route: '/herobox' },
  { label: 'Send with Zelle', icon: Send, route: '/move-money?tab=zelle' },
  { label: 'View statements', icon: FileText, route: '/documents' },
  { label: 'Track my package', icon: Heart, route: '/herobox' },
];

export default function AIConcierge({ firstName }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="vantoris-glass-premium p-5 mb-5 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-champagne/[0.04] blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-navy/8 border border-navy/10 flex items-center justify-center">
            <Sparkles size={16} className="text-brass" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-sm">AI Concierge</h3>
            <p className="text-gray text-[11px]">Your intelligent financial assistant</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assistant')}
          className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all group mb-3"
        >
          <p className="text-foreground text-sm font-medium">
            What would you like to do today, {firstName}?
          </p>
          <p className="text-gray text-[11px] mt-0.5">Tap to start a conversation</p>
        </button>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => {
            const Icon = ex.icon;
            return (
              <button
                key={ex.label}
                onClick={() => navigate(ex.route)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-navy/5 border border-slate-100 transition-all group"
              >
                <Icon size={11} className="text-gray group-hover:text-navy transition-colors" />
                <span className="text-gray group-hover:text-navy text-[11px] font-medium transition-colors">{ex.label}</span>
                <ArrowRight size={10} className="text-gray/30 group-hover:text-navy/50 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}