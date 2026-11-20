import React from 'react';
import { LockKeyhole } from 'lucide-react';

export default function QuickActionsMenu() {
  return <button type="button" disabled title="Requires an authorized server-side operations workflow" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-gray/60 opacity-70"><LockKeyhole size={14} /> Quick actions unavailable</button>;
}