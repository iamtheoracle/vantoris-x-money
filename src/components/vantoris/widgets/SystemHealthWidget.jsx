import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';

export default function SystemHealthWidget() {
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-3 flex items-center gap-2"><Activity size={16} className="text-brass" /><h3 className="text-sm font-semibold text-foreground">System health</h3></div><div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" /><p>Live service telemetry is not connected. System health cannot be verified from this screen.</p></div></section>;
}