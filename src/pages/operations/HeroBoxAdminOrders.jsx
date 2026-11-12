import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, ShieldCheck } from 'lucide-react';

function recorded(value) {
  return typeof value === 'string' && value.trim() ? value.replace(/_/g, ' ') : 'Not supplied';
}

export default function HeroBoxAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.HeroBoxOrder.list('-created_date', 50);
        if (!Array.isArray(rows)) throw new Error('Order source returned an invalid response.');
        if (active) {
          setOrders(rows);
          setState('loaded');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Order records could not be loaded.');
          setState('error');
        }
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout
      title="HeroBox Orders"
      description="Read-only order records. Payment, fulfillment, and delivery states are not independently provider-confirmed."
      icon={Package}
    >
      <div role="note" className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>Order lifecycle changes are disabled. A recorded status such as “paid”, “shipped”, or “delivered” is not proof of settlement or carrier delivery. Status changes require server-side authorization and provider evidence.</p>
      </div>

      {state === 'loading' && <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading order records…</p>}
      {state === 'error' && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error} This is not confirmation that there are no orders.</p>}
      {state === 'loaded' && !orders.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No order records were returned.</p>}

      {state === 'loaded' && orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <article key={order.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_1fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-navy">Order {String(order.id || '').slice(-8) || 'ID unavailable'}</p>
                  <p className="mt-1 text-xs text-slate-500">{order.recipient_name || order.recipient || 'Recipient not supplied'}</p>
                </div>
                <div className="text-xs text-slate-600">
                  <p><span className="font-semibold">Recorded order:</span> {recorded(order.status)}</p>
                  <p className="mt-1"><span className="font-semibold">Recorded payment:</span> {recorded(order.payment_status)}</p>
                </div>
                <div className="text-xs text-slate-600">
                  <p><span className="font-semibold">Recorded shipping:</span> {recorded(order.shipping_status)}</p>
                  <p className="mt-1 text-slate-400">{order.created_date ? new Date(order.created_date).toLocaleString() : 'Date not supplied'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </OperationsPageLayout>
  );
}
