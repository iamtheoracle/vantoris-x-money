import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, ShieldCheck, Bell } from 'lucide-react';

export default function AIRecommendations({ unreadCount }) {
  const navigate = useNavigate();
  const insights = [
    unreadCount > 0
      ? { icon: Bell, color: 'text-brass', bg: 'bg-brass/12', text: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''} requiring attention.` }
      : null,
    { icon: ShieldCheck, color: 'text-mint', bg: 'bg-mint/12', text: 'Your accounts are secure and monitored 24/7 by Vantoris Security.' },
  ].filter(Boolean);

  return (
    <div className="vantoris-glass-flat p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brass/12 flex items-center justify-center">
            <Sparkles size={14} className="text-brass" />
          </div>
          <h3 className="text-foreground font-semibold text-sm">AI Insights & Security</h3>
        </div>
        <button onClick={() => navigate('/advisor')} className="text-brass text-xs font-medium flex items-center gap-0.5">
          Ask Advisor <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className={`w-8 h-8 rounded-lg ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={insight.color} />
              </div>
              <p className="text-gray text-xs leading-relaxed flex-1">{insight.text}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}