import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QrCode, Send, MessageCircle, ArrowLeftRight } from 'lucide-react';

const actions = [
  { label: 'Scan QR', icon: QrCode, route: '/move-money?tab=qr' },
  { label: 'Zelle®', icon: Send, route: '/move-money?tab=zelle' },
  { label: 'Chat Support', icon: MessageCircle, route: '/advisor' },
  { label: 'Transfer', icon: ArrowLeftRight, route: '/move-money' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(action.route)}
              title={action.label}
              aria-label={action.label}
              className="vantoris-balance-hero w-14 h-14 rounded-full flex items-center justify-center hover:shadow-lg transition-all flex-shrink-0"
            >
              <Icon size={22} className="text-white" strokeWidth={2} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}