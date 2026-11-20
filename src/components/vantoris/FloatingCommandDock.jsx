import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { logAuditEntry } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';
import {
  Command, X, Sparkles, Lock, Check, Shield,
} from 'lucide-react';

// ============================================================
// Circular, floating, movable Quick Action control
// ============================================================
// - Perfectly circular (width === height, 50% border radius)
// - Fixed positioning, floats above page content
// - Responsive diameter (mobile 76 / tablet 82 / desktop 88)
// - Pointer Events drag (mouse + touch + pen)
// - Tap vs drag threshold so taps open the menu, drags move it
// - Clamped to viewport with edge margin + safe-area insets
// - Position persisted per-device in localStorage
// - Re-clamped on resize / orientation change
// - Accessible: button semantics, aria-label, keyboard activation

const EDGE_MARGIN = 16;      // min distance from viewport edge (px)
const DRAG_THRESHOLD = 6;    // px movement before a press counts as a drag
const STORAGE_KEY = 'vantoris.quickAction.pos';
const BOTTOM_NAV_RESERVE = 84; // keep clear of the bottom navigation

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

// Responsive button diameter
function getSize() {
  if (typeof window === 'undefined') return 82;
  const vw = window.innerWidth;
  if (vw < 768) return 76;    // mobile  72–84
  if (vw < 1024) return 82;   // tablet  76–88
  return 88;                  // desktop 80–92
}

function loadSavedPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    }
  } catch {}
  return null;
}

function clampPos(x, y, size) {
  if (typeof window === 'undefined') return { x, y };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxX = Math.max(EDGE_MARGIN, vw - size - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, vh - size - EDGE_MARGIN);
  return {
    x: Math.min(Math.max(x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, EDGE_MARGIN), maxY),
  };
}

function defaultPos(size) {
  if (typeof window === 'undefined') return { x: EDGE_MARGIN, y: EDGE_MARGIN };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Bottom-right by default, clearing the bottom navigation.
  return clampPos(vw - size - EDGE_MARGIN, vh - size - EDGE_MARGIN - BOTTOM_NAV_RESERVE, size);
}

export default function FloatingCommandDock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Responsive size ---
  const [size, setSize] = useState(getSize);

  // --- Draggable position state ---
  const [pos, setPos] = useState(() => loadSavedPos() || defaultPos(getSize()));
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const buttonRef = useRef(null);

  const isMember = user?.role === 'user';

  useEffect(() => {
    if (!user || !isMember) return;
    let cancelled = false;
    async function loadAccounts() {
      try {
        const accts = await base44.entities.Account.filter({ user_id: user.id });
        if (!cancelled) setAccounts(accts);
      } catch {}
    }
    loadAccounts();
    return () => { cancelled = true; };
  }, [user, isMember]);

  // Re-clamp on viewport resize / orientation change (also updates size)
  useEffect(() => {
    const handler = () => {
      const newSize = getSize();
      setSize(newSize);
      setPos((p) => clampPos(p.x, p.y, newSize));
    };
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  // Persist position locally (UI position only — no sensitive data)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
  }, [pos]);

  const actions = [
    { id: 'assistant', label: 'Assistant', icon: Sparkles, color: 'bg-navy/8 text-navy', onClick: () => navigate('/ask') },
    { id: 'freeze', label: 'Freeze My Card', icon: Lock, color: 'bg-crimson/10 text-crimson', onClick: () => { setFreezeOpen(true); setExpanded(false); } },
  ];

  // Operations staff get Mission Control instead of Freeze Card
  if (hasOperationsAccess(user?.role)) {
    actions[1] = { id: 'mission-control', label: 'Mission Control', icon: Shield, color: 'bg-navy text-white', onClick: () => navigate('/operations') };
  }

  function handleAction(action) {
    haptic(8);
    setExpanded(false);
    action.onClick();
  }

  // --- Pointer-based drag with tap detection ---
  const onPointerDown = useCallback((e) => {
    // Only primary button / touch
    if (e.button && e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setDragging(false);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }, [pos.x, pos.y]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) {
      e.preventDefault();
      const next = clampPos(d.origX + dx, d.origY + dy, size);
      setPos(next);
    }
  }, [size]);

  const endDrag = useCallback((e) => {
    const d = dragRef.current;
    dragRef.current = { active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false };
    try { e?.currentTarget?.releasePointerCapture?.(e.pointerId); } catch {}
    // If it never crossed the drag threshold, treat as a tap → toggle menu
    if (!d.moved) {
      haptic(8);
      setExpanded((v) => !v);
    }
    setDragging(false);
  }, []);

  async function handleFreeze() {
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      await base44.entities.Account.update(selectedAccount, { status: 'frozen' });
      await base44.entities.Transaction.create({
        account_id: selectedAccount,
        type: 'adjustment',
        amount: 0,
        description: 'Card frozen by member',
        balance_after: account.balance,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Card Frozen',
        message: `Your card for ${account.account_name} has been frozen. No new transactions will be processed.`,
        type: 'warning',
      });
      await logAuditEntry({
        action_type: 'card_frozen',
        description: `Member froze card for account: ${account.account_name}`,
        account_id: selectedAccount,
        target_user_id: user.id,
      });
      toast({ title: 'Card Frozen', description: `${account.account_name} has been frozen. No new transactions will be processed.` });
      setFreezeOpen(false);
      setSelectedAccount(null);
    } catch (e) {
      toast({ title: 'Unable to Freeze Card', description: e.message || 'Please try again. If the problem continues, contact support.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  if (!user) return null;

  // Panel placement: above the button when room exists, otherwise below.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const panelMaxWidth = Math.min(380, vw - 32);
  const panelX = Math.min(Math.max(pos.x + size / 2 - panelMaxWidth / 2, 16), Math.max(16, vw - panelMaxWidth - 16));
  const roomAbove = pos.y > 260;
  const panelStyle = roomAbove
    ? { bottom: (window.innerHeight - pos.y) + 12, left: panelX, width: panelMaxWidth }
    : { top: pos.y + size + 12, left: panelX, width: panelMaxWidth };

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { haptic(5); setExpanded(false); }}
            className="fixed inset-0 z-40 bg-navy/10 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: roomAbove ? 24 : -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: roomAbove ? 24 : -24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ position: 'fixed', zIndex: 50, ...panelStyle }}
          >
            <div className="vantoris-glass-dropdown p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Command size={14} className="text-navy" strokeWidth={2.5} />
                  <span className="text-foreground font-bold text-sm">Quick Actions</span>
                </div>
                <button
                  onClick={() => { haptic(5); setExpanded(false); }}
                  className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  aria-label="Close Quick Actions"
                >
                  <X size={14} className="text-gray" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {actions.map(action => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleAction(action)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <span className="text-foreground text-xs font-medium text-center">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular floating Quick Action — Vantoris V command mark */}
      <motion.button
        ref={buttonRef}
        type="button"
        aria-label="Quick Actions"
        aria-expanded={expanded}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            haptic(8);
            setExpanded((v) => !v);
          }
        }}
        whileTap={{ scale: dragging ? 1 : 0.94 }}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          zIndex: 50,
          touchAction: 'none',
          background: 'linear-gradient(145deg, #071C38 0%, #0E2A4A 100%)',
          boxShadow: '0 10px 30px rgba(7, 28, 56, 0.28), 0 2px 8px rgba(7, 28, 56, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
        }}
        className="rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 focus-visible:ring-offset-2 cursor-pointer select-none"
      >
        {/* Subtle secondary inner ring — restrained brass accent */}
        <div
          className="absolute rounded-full border border-brass/25 pointer-events-none"
          style={{ inset: Math.round(size * 0.11) }}
        />
        {/* Vantoris V command mark — white against the dark center */}
        <VantorisMonogram
          size={Math.round(size * 0.54)}
          variant="flat"
          theme="dark"
          className="pointer-events-none relative z-10"
        />
      </motion.button>

      {/* Freeze Card Dialog */}
      <AnimatePresence>
        {freezeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-navy/20 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setFreezeOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="vantoris-glass-premium w-full sm:max-w-sm p-6 rounded-t-3xl sm:rounded-3xl safe-bottom"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-crimson/10 flex items-center justify-center">
                  <Lock size={20} className="text-crimson" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold text-base">Freeze My Card</h3>
                  <p className="text-gray text-xs">Select an account to freeze its card immediately.</p>
                </div>
              </div>

              {accounts.length === 0 ? (
                <p className="text-gray text-sm py-4 text-center">No accounts available to freeze.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {accounts.map(acct => (
                      <button
                        key={acct.id}
                        onClick={() => setSelectedAccount(acct.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedAccount === acct.id
                            ? 'border-crimson/30 bg-crimson/5'
                            : 'border-border bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-foreground font-medium text-sm">{acct.account_name}</p>
                          <p className="text-gray text-xs font-mono">••••{acct.account_number?.slice(-4) || '----'}</p>
                        </div>
                        {selectedAccount === acct.id && <Check size={16} className="text-crimson" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setFreezeOpen(false)}
                      className="px-6 py-3 bg-slate-100 text-gray rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFreeze}
                      disabled={!selectedAccount || submitting}
                      className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Freezing...</>
                      ) : (
                        <><Lock size={14} /> Freeze Card</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}