import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function ImpactKpiCard({ label = 'Metric', value = '—', sublabel = null, change = null, trend = 'flat', icon: Icon = null, delay = 0 }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return <article className="vantoris-glass-premium rounded-2xl p-5" style={{ animationDelay: delay + 's' }}><div className="mb-4 flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brass/20 bg-brass/10 text-brass">{Icon && <Icon size={18} />}</div>{change !== undefined && <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><TrendIcon size={13} />{String(change)}%</span>}</div><p className="break-words text-2xl font-bold text-navy">{value}</p><p className="mt-1 text-xs font-medium text-slate-600">{label}</p>{sublabel && <p className="mt-1 text-[11px] text-slate-400">{sublabel}</p>}</article>;
}