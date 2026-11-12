import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Package } from 'lucide-react';

function formatOrderAmount(order) {
  const currency = order.currency || order.currency_code;
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(order.total_amount);
  if (!Number.isFinite(amount)) return 'Amount not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Amount not verified';
  }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        const rows = await base44.entities.HeroBoxOrder.filter({ user_id: me.id }, '-created_date', 50);
        if (!Array.isArray(rows)) throw new Error('HeroBox order query returned an invalid shape.');
        if (active) setOrders(rows);
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status">Loading order records…</div>;
  }

  if (unavailable) {
    return (
      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
        <h2 className="font-semibold">Order history unavailable</h2>
        <p className="mt-1">The order record source could not be retrieved. This is not confirmation that no orders exist.</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Package size={26} className="mx-auto mb-3 text-slate-400" />
        <h2 className="font-semibold text-navy">No order records returned</h2>
        <p className="mt-1 text-sm text-slate-500">No order records were returned for this member by the connected source.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const date = order.created_date ? new Date(order.created_date) : null;
        const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Date not supplied';
        return (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-navy">{order.order_number || 'Order record'}</h3>
                <p className="mt-1 text-xs text-slate-500">{dateLabel}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{order.status || 'Status not supplied'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{formatOrderAmount(order)}</p>
          </article>
        );
      })}
    </div>
  );
}
