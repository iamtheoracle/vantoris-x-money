import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

/** Recharts tooltip that formats supplied values without inventing metrics. */
export default function GlassTooltip({ active = false, payload = [], label = '', formatter = null, currency = false }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-600/40 bg-[#0E1A2B]/95 p-3 shadow-xl backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-white">{label || 'Data point'}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const value = typeof formatter === 'function'
            ? formatter(entry.value, entry.name)
            : (typeof entry.value === 'number' && /balance|amount|deposit|withdraw|volume|assets|funds/i.test(String(entry.name))
              ? formatCurrency(entry.value)
              : String(entry.value ?? '—'));
          return (
            <div key={entry.dataKey || entry.name || index} className="flex items-center gap-3 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color || '#C9A227' }} />
              <span className="text-slate-300">{entry.name || entry.dataKey}</span>
              <span className="ml-auto font-semibold text-white">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
