import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, ShoppingCart } from 'lucide-react';

function formatProductPrice(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Price currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 'Price not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Price not verified';
  }
}

export default function ProductCatalog({ cart = [], onAddToCart, onRemoveFromCart, view = 'shop' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 50);
        if (!Array.isArray(rows)) throw new Error('HeroBox catalog query returned an invalid shape.');
        if (active) setProducts(rows);
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status">Loading active catalog records…</div>;
  }

  if (unavailable) {
    return (
      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
        <h2 className="font-semibold">HeroBox catalog unavailable</h2>
        <p className="mt-1">The catalog source could not be retrieved. This is not confirmation that the catalog is empty.</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Package size={26} className="mx-auto mb-3 text-slate-400" />
        <h2 className="font-semibold text-navy">No active catalog items returned</h2>
        <p className="mt-1 text-sm text-slate-500">No active products were returned by the connected catalog source.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => {
        const inCart = cart.find((item) => item.product_id === product.id);
        const price = Number(product.price);
        const currency = product.currency || product.currency_code;
        const priceVerified = Number.isFinite(price) && price >= 0 && typeof currency === 'string' && /^[A-Z]{3}$/.test(currency);
        return (
          <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
              {product.image_url ? <img src={product.image_url} alt={product.name || 'Catalog item'} className="h-full w-full object-cover" loading="lazy" /> : <Package size={28} className="text-slate-300" />}
            </div>
            <h3 className="font-semibold text-navy">{product.name || 'Catalog item'}</h3>
            <p className="mt-1 text-sm text-slate-500">{product.description || product.category || 'Details not supplied'}</p>
            <p className="mt-3 font-mono text-sm font-semibold text-navy">{formatProductPrice(product.price, currency)}</p>
            <div className="mt-4 flex items-center gap-2">
              {inCart ? (
                <>
                  <button type="button" onClick={() => onRemoveFromCart?.(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">−</button>
                  <span className="text-sm font-semibold">{inCart.quantity}</span>
                  <button type="button" onClick={() => onAddToCart?.(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">+</button>
                </>
              ) : (
                <button type="button" onClick={() => onAddToCart?.(product)} disabled={!priceVerified} className="inline-flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <ShoppingCart size={14} /> Add to cart
                </button>
              )}
            </div>
          </article>
        );
      })}
      <p className="text-[11px] text-slate-400 sm:col-span-2">Cart changes are local only. Checkout remains disabled until an authorized order backend, inventory confirmation, and payment provider are connected.</p>
    </div>
  );
}
