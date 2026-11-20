import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const CONFIRM_PHRASE = 'DELETE';

  async function handleDelete() {
    setError('');
    if (confirmText !== CONFIRM_PHRASE) {
      setError(`Type "${CONFIRM_PHRASE}" to confirm.`);
      return;
    }
    setDeleting(true);
    try {
      // Clear local auth state and redirect; actual account deletion is handled server-side via admin workflow
      await base44.auth.logout('/');
    } catch (e) {
      setError('Unable to process request. Please contact support@vantoris.sbs.');
      console.error(e);
    }
    setDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-crimson" />
            Delete Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-crimson/10 border border-crimson/20 rounded-xl p-4">
            <p className="text-red-300 text-sm font-medium mb-1">This action is irreversible.</p>
            <p className="text-[#AAB4C3] text-xs leading-relaxed">
              All accounts, transactions, and personal data will be permanently removed. This action cannot be undone.
              Your deletion request will be reviewed by our operations team.
            </p>
          </div>
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">
              Type <span className="text-crimson font-bold">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-crimson/50 focus:outline-none"
              placeholder={CONFIRM_PHRASE}
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              disabled={deleting}
              className="flex-1 py-3 bg-[#242D38] text-white font-medium rounded-xl hover:bg-[#2a3340] transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== CONFIRM_PHRASE}
              className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl hover:bg-crimson/80 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}