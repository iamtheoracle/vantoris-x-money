import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldAlert } from 'lucide-react';

export default function InviteUserDialog({ open, onOpenChange, onInvited = null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-navy"><ShieldAlert size={18} /> Invitations unavailable</DialogTitle>
          <DialogDescription className="text-slate-600">
            Invitations and role assignment are disabled until a trusted server-side workflow validates operator permissions and records an audit event. No invitation was sent and no role was changed.
          </DialogDescription>
        </DialogHeader>
        <button type="button" onClick={() => onOpenChange?.(false)} className="mt-3 w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white">Close</button>
      </DialogContent>
    </Dialog>
  );
}
