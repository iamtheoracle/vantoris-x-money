import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Clock, ShieldAlert } from 'lucide-react';

export default function SessionTimeoutModal({ show, onExtend, onLogout }) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!show) {
      setCountdown(60);
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [show, onLogout]);

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) onExtend(); }}>
      <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
              <ShieldAlert size={20} className="text-brass" />
            </div>
            <DialogTitle className="text-white">Session Expiring</DialogTitle>
          </div>
          <DialogDescription className="text-[#AAB4C3] text-sm">
            For your security, you'll be automatically logged out in <span className="text-brass font-semibold">{countdown}s</span> due to inactivity.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onExtend}
            className="flex-1 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-3 bg-[#242D38] text-white font-medium rounded-xl hover:bg-[#2a3340] transition-all"
          >
            Log Out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}