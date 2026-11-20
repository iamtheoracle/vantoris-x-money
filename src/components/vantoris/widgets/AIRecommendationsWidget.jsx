import React from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';

export default function AIRecommendationsWidget() {
  return <section className="vantoris-glass-premium rounded-2xl p-5"><div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-brass" /><h3 className="text-sm font-semibold text-foreground">AI recommendations</h3></div><div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><ShieldAlert size={17} className="mt-0.5 flex-shrink-0" /><p>Operational recommendations are disabled until an authenticated private AI workflow can verify the data context. No generated recommendation is being presented as fact.</p></div></section>;
}