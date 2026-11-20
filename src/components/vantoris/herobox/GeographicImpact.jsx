import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

export default function GeographicImpact() {
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><MapPin size={16} className="text-brass" /><h3 className="text-sm font-semibold text-foreground">Geographic impact</h3></div><div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><p>Verified geographic coordinates and a trusted mapping data source are not connected, so no impact map is shown.</p></div></section>;
}