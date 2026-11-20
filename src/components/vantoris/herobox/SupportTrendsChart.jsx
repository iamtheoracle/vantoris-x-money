import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SupportTrendsChart({ data = [] }) {
  const rows = Array.isArray(data) ? data : [];
  const first = rows[0] || {};
  const valueKey = Object.keys(first).find(key => typeof first[key] === 'number' && key !== 'id');
  const labelKey = ['month','period','date','label','name'].find(key => key in first) || 'month';
  return <section className="vantoris-glass-premium rounded-2xl p-5"><h3 className="text-sm font-semibold text-foreground">Support trends</h3><p className="mb-4 mt-1 text-[11px] text-gray">From returned activity records</p>{rows.length && valueKey ? <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={labelKey} tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Area type="monotone" dataKey={valueKey} stroke="#123A6E" fill="#123A6E" fillOpacity={0.12} /></AreaChart></ResponsiveContainer></div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No trend series returned.</p>}</section>;
}