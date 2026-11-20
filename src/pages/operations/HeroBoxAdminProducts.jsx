import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, Loader2, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';

export default function HeroBoxAdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'essential', description: '', price: '', destination: '', availability: 'available' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setProducts(await base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 50).catch(() => []));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleAdd() {
    setSubmitting(true);
    try {
      await base44.entities.HeroBoxProduct.create({
        name: form.name,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price) || 0,
        destination: form.destination,
        availability: form.availability,
        currency: 'USD',
        shipping_required: true,
        freshness_status: 'fresh',
        retrieved_at: new Date().toISOString(),
        status: 'active',
      });
      toast({ title: 'Product added', description: `${form.name} has been added to the catalog.` });
      setShowAdd(false);
      setForm({ name: '', category: 'essential', description: '', price: '', destination: '', availability: 'available' });
      loadData();
    } catch (err) {
      toast({ title: 'Failed to add product', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout
      title="HeroBox Products"
      description="Manage the care-commerce product catalog"
      icon={Package}
      actions={
        <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded-lg bg-navy text-white text-sm font-semibold flex items-center gap-1.5">
          <Plus size={16} /> Add Product
        </button>
      }
    >
      {products.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <Package size={32} className="text-gray mx-auto mb-3" />
          <p className="text-gray">No products in the catalog.</p>
          <p className="text-xs text-gray mt-2">Add products to enable HeroBox care-commerce.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="vantoris-glass p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-foreground">{p.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.availability === 'available' ? 'bg-mint/10 text-mint' : 'bg-warning/10 text-warning'
                }`}>{p.availability}</span>
              </div>
              <p className="text-xs text-gray capitalize">{(p.category || '').replace(/_/g, ' ')}</p>
              {p.destination && <p className="text-xs text-gray">📍 {p.destination}</p>}
              <p className="text-sm font-bold text-foreground mt-2">{formatCurrency(p.price)}</p>
              {p.freshness_status === 'stale' && <p className="text-[10px] text-warning mt-1">Pricing may be stale</p>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add Product</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border px-4 py-2.5 text-sm">
                <option value="essential">Essential / Starter</option>
                <option value="comfort">Comfort</option>
                <option value="body_care">Body Care</option>
                <option value="snack_food">Snack / Food</option>
                <option value="mobile_tech">Mobile / Tech</option>
                <option value="premium">Premium</option>
                <option value="executive">Executive</option>
                <option value="executive_plus">Executive Plus</option>
                <option value="phones">Phones</option>
                <option value="airtime_data">Airtime / Data</option>
                <option value="subscriptions">Subscriptions</option>
                <option value="deployment_card">Deployment Card</option>
              </select>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm min-h-[60px]" />
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price (USD)" type="number" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm" />
              <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Destination (empty = global)" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm" />
              <select value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} className="w-full rounded-lg border border-border px-4 py-2.5 text-sm">
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="requires_config">Requires Configuration</option>
              </select>
              <button onClick={handleAdd} disabled={submitting || !form.name || !form.price} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OperationsPageLayout>
  );
}