import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import AgentChat from './AgentChat';
import ActionSuggestions from './ActionSuggestions';

export default function FloatingAIDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.4 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 safe-bottom text-4xl"
        style={{
          background: 'linear-gradient(145deg, #071C38 0%, #0E2A4A 100%)',
          border: '1px solid rgba(201, 162, 39, 0.3)',
          boxShadow: '0 8px 24px rgba(7, 28, 56, 0.25)'
        }}
        title="Ask Vantoris AI">
        
        <Bot size={24} className="text-brass opacity-100" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-mint rounded-full border-2 border-white" />
      </motion.button>

      {/* Slide-in panel — shows listing first, then transitions to chat */}
      <AnimatePresence>
        {open &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/20" />
          
            <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[600px] flex flex-col safe-top safe-bottom">
            
              <AgentChat
              agentName="vantoris_assistant"
              title="Vantoris AI Assistant"
              subtitle="Operations Co-Pilot"
              inputPlaceholder="Ask about members, applications, KYC, accounts, withdrawals…"
              singleColumn={true}
              onClose={() => setOpen(false)}
              renderActionSuggestions={({ setInput, sendMessage }) =>
              <ActionSuggestions onAction={(q) => {setInput(q);setTimeout(() => sendMessage(q), 50);}} />
              } />
            
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}