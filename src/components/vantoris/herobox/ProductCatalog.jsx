import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Package, ShoppingCart } from 'lucide-react';

export default function ProductCatalog({ cart = [], onAddToCart, onRemoveFromCart, view = 'shop' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 50).catch(() => []);
        if (active) setProducts(Array.isArray(rows) ? rows : []);
      } catch (error) { console.error('HeroBox catalog unavailable', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status">Loading active catalog records…</div>;
  if (!products.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Package size={26} className="mx-auto mb-3 text-slate-400" /><h2 className="font-semibold text-navy">No active catalog items</h2><p className="mt-1 text-sm text-slate-500">Only products returned by the connected backend are shown.</p></div>;
  return <div className="grid gap-4 sm:grid-cols-2">{products.map(product => {
    const inCart = cart.find(item => item.product_id === product.id);
    const price = Number(product.price);
    return <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-50">{product.image_url ? <img src={product.image_url} alt={product.name || 'Catalog item'} className="h-full w-full object-cover" loading="lazy" /> : <Package size={28} className="text-slate-300" />}</div><h3 className="font-semibold text-navy">{product.name || 'Catalog item'}</h3><p className="mt-1 text-sm text-slate-500">{product.description || product.category || 'Details not supplied'}</p><p className="mt-3 font-mono text-sm font-semibold text-navy">{Number.isFinite(price) ? formatCurrency(price) : 'Price not supplied'}</p><div className="mt-4 flex items-center gap-2">{inCart ? <><button type="button" onClick={() => onRemoveFromCart?.(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">−</button><span className="text-sm font-semibold">{inCart.quantity}</span><button type="button" onClick={() => onAddToCart?.(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">+</button></> : <button type="button" onClick={() => onAddToCart?.(product)} disabled={!Number.isFinite(price) || price < 0} className="inline-flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><ShoppingCart size={14} /> Add to cart</button>}</div></article>;
  })}<p className="text-[11px] text-slate-400 sm:col-span-2">Cart changes are local only. Checkout remains disabled until an authorized order and payment provider is connected.</p></div>;
}