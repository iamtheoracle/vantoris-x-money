import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function FundsDistributedChart({ data = [], period = 'monthly', breakdown = 'Category' }) {
  const rows = Array.isArray(data) ? data : [];
  const first = rows[0] || {};
  const valueKey = Object.keys(first).find(key => typeof first[key] === 'number' && key !== 'id');
  const labelKey = ['month','period','category','mission','label','name'].find(key => key in first) || 'name';
  const hasData = rows.length > 0 && Boolean(valueKey);
  return <section className="vantoris-glass-premium rounded-2xl p-5"><h3 className="text-sm font-semibold text-foreground">Funds distribution</h3><p className="mb-4 mt-1 text-[11px] text-gray">{period} view · grouped by {breakdown}</p>{hasData ? <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={labelKey} tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Bar dataKey={valueKey} fill="#C9A227" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No distribution series returned.</p>}<p className="mt-3 text-[10px] text-gray/70">Only returned records are represented; this is not proof of settled funds.</p></section>;
}