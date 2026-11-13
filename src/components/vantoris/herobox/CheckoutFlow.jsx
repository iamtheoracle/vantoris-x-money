import React from 'react';
import { LockKeyhole, X } from 'lucide-react';

function formatAmount(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Price currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 'Price not verified';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Price not verified';
  }
}

export default function CheckoutFlow({ cart = [], onClose }) {
  const currencies = [...new Set(cart.map((item) => item.currency || item.currency_code))];
  const allPricesVerified = cart.length > 0 && cart.every((item) => {
    const currency = item.currency || item.currency_code;
    const price = Number(item.price);
    return typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) && Number.isFinite(price) && price >= 0;
  });
  const oneCurrency = currencies.length === 1 && typeof currencies[0] === 'string' && /^[A-Z]{3}$/.test(currencies[0]);
  const total = allPricesVerified && oneCurrency
    ? cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 0), 0)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-3 sm:items-center">
      <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="checkout-title" className="text-lg font-bold text-navy">Review cart</h2>
          <button type="button" onClick={onClose} aria-label="Close checkout" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.product_id} className="flex justify-between gap-3 text-sm">
              <span>{item.name || 'Item'} × {item.quantity}</span>
              <span className="font-mono">{formatAmount(Number(item.price) * Number(item.quantity || 0), item.currency || item.currency_code)}</span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t border-slate-100 pt-3">
          <div className="flex justify-between font-semibold text-navy">
            <span>Cart estimate</span>
            <span>{total === null ? 'Total not verified' : formatAmount(total, currencies[0])}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Estimate only. Taxes, shipping, inventory, and final price have not been confirmed.</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold"><LockKeyhole size={16} /> Checkout is unavailable</p>
          <p className="mt-1 text-xs leading-relaxed">An authorized order backend, inventory confirmation, and payment provider must be connected before an order can be placed. Nothing has been purchased.</p>
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white">Close</button>
      </section>
    </div>
  );
}
