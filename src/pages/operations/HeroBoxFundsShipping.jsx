import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, Truck, Wallet, ShieldCheck } from 'lucide-react';

function displayStatus(value) {
  return typeof value === 'string' && value.trim()
    ? value.replace(/_/g, ' ')
    : 'Not supplied';
}

function RecordPanel({ title, status, error, empty, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-navy">{title}</h2>
        <span className="text-xs text-slate-500">{status === 'loaded' ? 'Read only' : status === 'loading' ? 'Loading' : 'Unavailable'}</span>
      </div>
      {status === 'loading' && <p role="status" className="text-sm text-slate-500">Loading records…</p>}
      {status === 'error' && <p role="alert" className="text-sm text-amber-800">{error} This is not confirmation that the records are empty.</p>}
      {status === 'loaded' && empty && <p className="text-sm text-slate-500">No records were returned by the connected data source.</p>}
      {status === 'loaded' && !empty && children}
    </section>
  );
}

export default function HeroBoxFundsShipping() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderState, setOrderState] = useState('loading');
  const [productState, setProductState] = useState('loading');
  const [orderError, setOrderError] = useState('');
  const [productError, setProductError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      base44.entities.HeroBoxOrder.list('-created_date', 50),
      base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 50),
    ]).then(([orderResult, productResult]) => {
      if (!active) return;
      if (orderResult.status === 'fulfilled' && Array.isArray(orderResult.value)) {
        setOrders(orderResult.value);
        setOrderState('loaded');
      } else {
        setOrderError(orderResult.status === 'rejected' ? (orderResult.reason?.message || 'Order records could not be loaded.') : 'Order source returned an invalid response.');
        setOrderState('error');
      }
      if (productResult.status === 'fulfilled' && Array.isArray(productResult.value)) {
        setProducts(productResult.value);
        setProductState('loaded');
      } else {
        setProductError(productResult.status === 'rejected' ? (productResult.reason?.message || 'Catalog records could not be loaded.') : 'Catalog source returned an invalid response.');
        setProductState('error');
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout
      title="HeroBox Funds & Shipping"
      description="Read-only view of recorded orders and catalog records. No funds, payouts, or carrier updates are executed here."
      icon={Package}
    >
      <div role="note" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        Funding intake, payout release, price changes, and shipment status changes are disabled. No payment settlement, payout, shipping label, or delivery is confirmed by this workspace. Those actions require provider evidence, server authorization, reconciliation, and an auditable approval lifecycle.
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { title: 'Payments & funds', icon: Wallet, detail: 'No verified payment ledger or settlement provider is connected to this workflow.' },
          { title: 'Payouts', icon: ShieldCheck, detail: 'Payout release is disabled until dual approval and provider settlement are verified.' },
          { title: 'Shipping', icon: Truck, detail: 'Carrier labels, tracking events, and delivery confirmation are not connected.' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Icon size={18} className="mb-3 text-navy" />
              <h3 className="text-sm font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <RecordPanel title="Recorded orders" status={orderState} error={orderError} empty={!orders.length}>
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">Order {String(order.id || '').slice(-8) || 'ID unavailable'}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">Recorded: {displayStatus(order.status)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">Recipient: {order.recipient_name || order.recipient || 'Not supplied'}</p>
                <p className="mt-1 text-xs text-slate-500">Payment record: {displayStatus(order.payment_status)} · Shipping record: {displayStatus(order.shipping_status)}</p>
              </article>
            ))}
          </div>
        </RecordPanel>

        <RecordPanel title="Active catalog records" status={productState} error={productError} empty={!products.length}>
          <div className="space-y-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm font-semibold text-navy">{product.name || 'Catalog item'}</p>
                <p className="mt-1 text-xs text-slate-500">{product.category || 'Category not supplied'} · {displayStatus(product.availability || product.status)}</p>
                <p className="mt-1 text-xs text-slate-500">Price and merchant provenance are not displayed here unless verified in the catalog contract.</p>
              </article>
            ))}
          </div>
        </RecordPanel>
      </div>
    </OperationsPageLayout>
  );
}
