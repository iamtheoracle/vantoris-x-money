import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Package } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        const rows = await base44.entities.HeroBoxOrder.filter({ user_id: me.id }, '-created_date', 50).catch(() => []);
        if (active) setOrders(Array.isArray(rows) ? rows : []);
      } catch (error) { console.error('Order history unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status">Loading order records…</div>;
  if (!orders.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Package size={26} className="mx-auto mb-3 text-slate-400" /><h2 className="font-semibold text-navy">No order records found</h2><p className="mt-1 text-sm text-slate-500">No orders have been returned for this member.</p></div>;
  return <div className="space-y-3">{orders.map(order => <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-navy">{order.order_number || 'Order record'}</h3><p className="mt-1 text-xs text-slate-500">{order.created_date ? new Date(order.created_date).toLocaleString() : 'Date not supplied'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{order.status || 'Status not supplied'}</span></div><p className="mt-3 text-sm text-slate-600">{formatCurrency(Number(order.total_amount) || 0)}</p></article>)}</div>;
}