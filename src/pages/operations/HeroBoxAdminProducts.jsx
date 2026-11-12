import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, ShieldCheck } from 'lucide-react';

function priceLabel(product) {
  const currency = product.currency || product.currency_code;
  const amount = Number(product.price);
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Price currency not supplied';
  if (!Number.isFinite(amount) || amount < 0) return 'Price not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Price not verified';
  }
}

export default function HeroBoxAdminProducts() {
  const [products, setProducts] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 50);
        if (!Array.isArray(rows)) throw new Error('Catalog source returned an invalid response.');
        if (active) {
          setProducts(rows);
          setState('loaded');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Catalog records could not be loaded.');
          setState('error');
        }
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <OperationsPageLayout
      title="HeroBox Product Catalogue"
      description="Read-only view of active catalog records. Product management is not enabled from this browser workspace."
      icon={Package}
    >
      <div role="note" className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>Adding, editing, pricing, or activating products requires a versioned catalog contract, server-side staff authorization, verified merchant/inventory provenance, and an audit trail. No catalog changes are made here.</p>
      </div>

      {state === 'loading' && <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading catalog records…</p>}
      {state === 'error' && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error} This is not confirmation that the catalog is empty.</p>}
      {state === 'loaded' && !products.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No active catalog records were returned.</p>}

      {state === 'loaded' && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {product.image_url ? <img src={product.image_url} alt={product.name || 'Catalog item'} loading="lazy" className="mb-3 h-32 w-full rounded-xl object-cover" /> : <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-slate-50"><Package size={28} className="text-slate-300" /></div>}
              <h2 className="font-semibold text-navy">{product.name || 'Catalog item'}</h2>
              <p className="mt-1 text-xs text-slate-500">{product.category || 'Category not supplied'} · {product.availability || 'Availability not supplied'}</p>
              <p className="mt-3 text-sm font-semibold text-navy">{priceLabel(product)}</p>
              <p className="mt-2 text-xs text-slate-500">{product.description || 'Description not supplied'}</p>
            </article>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}
