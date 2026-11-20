import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldAlert } from 'lucide-react';

/** Fail-closed PIN gate until a trusted server-side PIN verifier is integrated. */
export default function SecurityPinModal({ open, onClose, title = 'Security verification unavailable' }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }}>
      <DialogContent className="max-w-sm border border-slate-200 bg-white">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800"><ShieldAlert size={20} /></div>
            <DialogTitle className="text-navy">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            PIN verification is not connected to a trusted server-side verifier yet. For your protection, this action is blocked and no withdrawal request has been submitted.
          </DialogDescription>
        </DialogHeader>
        <button type="button" onClick={() => onClose?.()} className="mt-3 w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white">Close</button>
      </DialogContent>
    </Dialog>
  );
}
