import React from 'react';
import { Mail } from 'lucide-react';

/** Email summaries stay disabled until a trusted, authorized delivery workflow exists. */
export default function DailyEmailSummary() {
  return <button type="button" disabled title="Email delivery is not configured" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-gray/60 opacity-70"><Mail size={14} /> Email summary unavailable</button>;
}
