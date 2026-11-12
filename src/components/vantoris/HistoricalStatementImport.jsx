import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HistoricalStatementImport({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Historical statement import unavailable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
            <p className="text-sm leading-6 text-amber-950">
              This workspace cannot import statement transactions directly from the browser. No transaction, statement, or balance record will be created here.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-navy" />
            <p className="text-xs leading-5 text-slate-600">
              A verified import service must validate account ownership, source-document provenance, date and currency consistency, idempotency, duplicate detection, reconciliation, and immutable audit evidence before historical records can be committed.
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white">Close</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
