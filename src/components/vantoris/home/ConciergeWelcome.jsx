import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { Volume2, VolumeX, ChevronRight } from 'lucide-react';
import ShieldLogo from '@/components/vantoris/ShieldLogo';

export default function ConciergeWelcome({
  firstName,
  greeting,
  totalBalance,
  accountCount,
  unreadCount,
  onComplete,
}) {
  const [phase, setPhase] = useState('entering'); // entering → speaking → done
  const [muted, setMuted] = useState(false);
  const spokenRef = useRef(false);

  const summaryParts = [
    `${greeting}, ${firstName}.`,
    `Welcome back to your Vantoris sanctuary.`,
    `Your total vault balance is ${formatCurrency(totalBalance)} across ${accountCount} ${accountCount === 1 ? 'account' : 'accounts'}.`,
    unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : 'All notifications are up to date.',
    'Your wealth is secured and monitored. Enjoy your day.',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('speaking');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'speaking' || spokenRef.current) return;
    spokenRef.current = true;

    if (muted || !('speechSynthesis' in window)) {
      // No voice — auto dismiss after a pause
      const t = setTimeout(() => dismiss(), 5000);
      return () => clearTimeout(t);
    }

    const fullText = summaryParts.join(' ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Try to pick a pleasant voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English') || v.lang === 'en-US');
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => dismiss();
    utterance.onerror = () => dismiss();

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line
  }, [phase, muted]);

  function dismiss() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPhase('done');
    setTimeout(() => onComplete?.(), 600);
  }

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(7,28,56,0.97) 0%, rgba(7,28,56,1) 70%)',
          }}
          onClick={dismiss}
        >
          {/* Ambient particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-brass/10 blur-2xl"
                style={{
                  width: `${60 + i * 30}px`,
                  height: `${60 + i * 30}px`,
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.15, 0.35, 0.15],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center px-8 max-w-md"
          >
            {/* Logo entrance */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 14 }}
              className="mb-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-2xl bg-brass/30 rounded-full" />
                <ShieldLogo size={80} className="relative z-10" />
              </div>
            </motion.div>

            {/* Greeting text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-brass text-xs uppercase tracking-[0.25em] font-semibold mb-2">{greeting}</p>
              <h1 className="text-white text-3xl font-bold tracking-tight mb-1">{firstName}</h1>
              <p className="text-white/50 text-sm">Welcome to your Vantoris sanctuary</p>
            </motion.div>

            {/* Summary chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-2 justify-center mt-6"
            >
              <div className="px-4 py-2 rounded-full bg-white/8 border border-white/10 backdrop-blur-sm">
                <span className="text-white/80 text-xs font-medium">{formatCurrency(totalBalance)}</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-white/8 border border-white/10 backdrop-blur-sm">
                <span className="text-white/80 text-xs font-medium">{accountCount} {accountCount === 1 ? 'Account' : 'Accounts'}</span>
              </div>
              {unreadCount > 0 && (
                <div className="px-4 py-2 rounded-full bg-brass/15 border border-brass/20">
                  <span className="text-brass text-xs font-medium">{unreadCount} Unread</span>
                </div>
              )}
            </motion.div>

            {/* Voice indicator */}
            {phase === 'speaking' && !muted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-1.5 mt-6"
              >
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-brass"
                    animate={{ height: [4, 16, 4] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex items-center justify-center gap-3 mt-8"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/12 transition-all"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-brass text-white text-xs font-bold hover:bg-brass/90 transition-all"
              >
                Enter Vault
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </motion.div>
          </motion.div>

          {/* Skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-0 right-0 text-center text-white/30 text-[11px]"
          >
            Tap anywhere to enter
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}