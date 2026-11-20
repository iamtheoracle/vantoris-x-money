import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight, Download, Upload, Send, FileText, MessageCircle, LifeBuoy, Heart, Sparkles,
} from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

export default function ActionStrip({ hasAccounts, hasHeroBox, isMember, hasDocuments }) {
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();

  const actions = [];
  if (hasAccounts) {
    actions.push({ id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, onClick: () => navigate('/move-money'), color: 'bg-navy text-white' });
    actions.push({ id: 'send', label: 'Send', icon: Send, onClick: () => navigate('/move-money?tab=zelle'), color: 'bg-navy/8 text-navy' });
    actions.push({ id: 'deposit', label: 'Deposit', icon: Download, onClick: () => navigate('/move-money?tab=deposit'), color: 'bg-mint/10 text-mint' });
    actions.push({ id: 'withdraw', label: 'Withdraw', icon: Upload, onClick: () => navigate('/move-money?tab=withdraw'), color: 'bg-crimson/10 text-crimson' });
  }
  if (hasHeroBox) {
    actions.push({ id: 'sponsor', label: 'Sponsor', icon: Heart, onClick: () => navigate('/herobox'), color: 'bg-brass/15 text-brass' });
  }
  if (isMember) {
    actions.push({ id: 'advisor', label: 'Advisor', icon: Sparkles, onClick: () => navigate('/advisor'), color: 'bg-navy/8 text-navy' });
  }
  if (hasDocuments || hasAccounts) {
    actions.push({ id: 'statements', label: 'Statements', icon: FileText, onClick: () => navigate('/documents'), color: 'bg-navy/8 text-navy' });
  }
  actions.push({ id: 'messages', label: 'Messages', icon: MessageCircle, onClick: () => navigate('/messages'), color: 'bg-navy/8 text-navy' });
  actions.push({ id: 'support', label: 'Support', icon: LifeBuoy, onClick: () => window.open(whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'), '_blank', 'noopener,noreferrer'), color: 'bg-mint/10 text-mint' });

  if (actions.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="vantoris-glass-premium p-2.5">
        <div className="flex items-center gap-1 overflow-x-auto vantoris-scroll">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex-shrink-0 min-w-[64px]"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                  <Icon size={17} strokeWidth={2} />
                </div>
                <span className="text-gray text-[10px] font-medium whitespace-nowrap">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}