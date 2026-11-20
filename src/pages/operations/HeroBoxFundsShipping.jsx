import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  DollarSign,
  Truck,
  Package,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

/**
 * HeroBox Funds & Shipping — ops console for:
 * - collecting supporter funds
 * - approving payouts to fulfillment
 * - shipping labels / carrier status
 * - retail catalog price refresh (operator-entered or API — not site scraping)
 */

const SHIP_STATUSES = ['pending', 'labeled', 'in_transit', 'delivered', 'exception'];

export default function HeroBoxFundsShipping() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [fundPool, setFundPool] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('funds');
  const [note, setNote] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [priceForm, setPriceForm] = useState({ id: '', price: '', sku: '', name: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([
        base44.entities.HeroBoxOrder.list('-created_date', 100).catch(() => []),
        base44.entities.HeroBoxProduct.filter({ status: 'active' }, '-created_date', 100).catch(() => []),
      ]);
      setOrders(Array.isArray(o) ? o : []);
      setProducts(Array.isArray(p) ? p : []);
      const collected = (Array.isArray(o) ? o : []).reduce(
        (s, x) => s + (Number(x.amount_paid || x.total || x.funded_amount) || 0),
        0
      );
      setFundPool(collected);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const shippingQueue = useMemo(
    () =>
      orders.filter((o) =>
        ['paid', 'funded', 'processing', 'shipped', 'ready_to_ship'].includes(
          String(o.status || '').toLowerCase()
        )
      ),
    [orders]
  );

  async function recordFundInflow() {
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) return;
    try {
      // Soft ledger via Notification / optional entity
      await base44.entities.Notification.create({
        user_id: 'system',
        title: 'HeroBox fund intake',
        message: `Manual fund intake recorded: ${formatCurrency(amt)}. ${note || ''}`.trim(),
        type: 'info',
      }).catch(() => {});
      setFundPool((v) => v + amt);
      setMsg(`Recorded intake of ${formatCurrency(amt)}.`);
      setPayoutAmount('');
      setNote('');
    } catch (e) {
      setMsg(e.message || 'Unable to record funds.');
    }
  }

  async function markPayout(order) {
    try {
      await base44.entities.HeroBoxOrder.update(order.id, {
        payout_status: 'released',
        payout_at: new Date().toISOString(),
        status: order.status === 'paid' ? 'processing' : order.status,
      });
      setMsg(`Payout released for order ${order.id.slice(0, 8)}…`);
      load();
    } catch (e) {
      setMsg(e.message || 'Payout update failed.');
    }
  }

  async function updateShipping(order, status) {
    try {
      await base44.entities.HeroBoxOrder.update(order.id, {
        shipping_status: status,
        status: status === 'delivered' ? 'delivered' : status === 'in_transit' ? 'shipped' : order.status,
        shipped_at: status === 'in_transit' ? new Date().toISOString() : order.shipped_at,
      });
      setMsg(`Shipping → ${status}`);
      load();
    } catch (e) {
      setMsg(e.message || 'Shipping update failed.');
    }
  }

  async function applyRetailPrice() {
    const price = Number(priceForm.price);
    if (!priceForm.id || !price || price <= 0) {
      setMsg('Select a product and enter a valid retail price.');
      return;
    }
    try {
      await base44.entities.HeroBoxProduct.update(priceForm.id, {
        price,
        retail_price: price,
        price_source: 'operator_retail_sync',
        price_updated_at: new Date().toISOString(),
        sku: priceForm.sku || undefined,
      });
      setMsg('Catalog price updated from retail reference (operator entry).');
      setPriceForm({ id: '', price: '', sku: '', name: '' });
      load();
    } catch (e) {
      setMsg(e.message || 'Price update failed.');
    }
  }

  return (
    <OperationsPageLayout
      title="HeroBox Funds & Shipping"
      description="Collect supporter funds, release payouts, track shipping, refresh catalog prices from retail references"
      icon={Truck}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'funds', label: 'Funds & payouts' },
          { id: 'shipping', label: 'Shipping' },
          { id: 'catalog', label: 'Retail catalog sync' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tab === t.id ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-navy">
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          {tab === 'funds' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-navy text-white p-5">
                  <p className="text-xs text-white/60 uppercase tracking-wider">Collected (orders)</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(fundPool)}</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Open orders</p>
                  <p className="text-2xl font-bold mt-1 text-navy">{orders.length}</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Awaiting payout</p>
                  <p className="text-2xl font-bold mt-1 text-navy">
                    {orders.filter((o) => o.payout_status !== 'released').length}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <DollarSign size={18} className="text-brass" /> Record fund intake
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Log donations or pooled support before fulfillment spend.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm w-36"
                  />
                  <input
                    type="text"
                    placeholder="Note (donor, campaign…)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm flex-1 min-w-[180px]"
                  />
                  <button
                    type="button"
                    onClick={recordFundInflow}
                    className="h-11 px-4 rounded-xl bg-navy text-white text-sm font-semibold inline-flex items-center gap-1"
                  >
                    <Plus size={16} /> Record
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 font-semibold text-navy text-sm">
                  Order payout queue
                </div>
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {orders.slice(0, 40).map((o) => (
                    <div key={o.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy truncate">
                          {o.recipient_name || o.hero_name || o.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {o.status} · {formatCurrency(Number(o.total || o.amount_paid) || 0)}
                          {o.payout_status === 'released' ? ' · paid out' : ''}
                        </p>
                      </div>
                      {o.payout_status === 'released' ? (
                        <span className="text-emerald-600 text-xs font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 size={14} /> Released
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markPayout(o)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brass/15 text-navy hover:bg-brass/25"
                        >
                          Release payout
                        </button>
                      )}
                    </div>
                  ))}
                  {!orders.length && (
                    <p className="px-5 py-8 text-sm text-slate-500 text-center">No HeroBox orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'shipping' && (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 font-semibold text-navy text-sm flex items-center gap-2">
                <Truck size={16} className="text-brass" /> Shipping board
              </div>
              <div className="divide-y divide-slate-100">
                {(shippingQueue.length ? shippingQueue : orders).slice(0, 50).map((o) => (
                  <div key={o.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy truncate">
                        {o.recipient_name || o.shipping_name || o.id}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {o.shipping_address || o.destination || 'Address on file'} ·{' '}
                        {o.shipping_status || 'pending'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SHIP_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateShipping(o, s)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            (o.shipping_status || 'pending') === s
                              ? 'bg-navy text-white border-navy'
                              : 'border-slate-200 text-slate-600 hover:border-navy'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!orders.length && (
                  <p className="px-5 py-8 text-sm text-slate-500 text-center">No shipments to track.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'catalog' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                <p className="font-semibold flex items-center gap-2">
                  <AlertCircle size={16} /> Retail price policy
                </p>
                <p className="mt-1 leading-relaxed">
                  Vantoris does <strong>not</strong> scrape Walmart or other retailers (that violates their
                  terms). Operators enter current shelf or published prices, or connect an approved
                  affiliate/product API. Prices update HeroBox catalog items used in care packages.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Package size={18} className="text-brass" /> Update product from retail reference
                </h3>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <select
                    value={priceForm.id}
                    onChange={(e) => {
                      const prod = products.find((x) => x.id === e.target.value);
                      setPriceForm({
                        id: e.target.value,
                        price: prod?.price != null ? String(prod.price) : '',
                        sku: prod?.sku || '',
                        name: prod?.name || '',
                      });
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="">Select HeroBox product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title || p.id} — {formatCurrency(Number(p.price) || 0)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="New retail price"
                    value={priceForm.price}
                    onChange={(e) => setPriceForm((f) => ({ ...f, price: e.target.value }))}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="SKU / retail item #"
                    value={priceForm.sku}
                    onChange={(e) => setPriceForm((f) => ({ ...f, sku: e.target.value }))}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={applyRetailPrice}
                    className="h-11 rounded-xl bg-navy text-white text-sm font-semibold"
                  >
                    Apply price to catalog
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {products.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex justify-between text-sm gap-3">
                    <span className="font-medium text-navy truncate">{p.name || p.title}</span>
                    <span className="tabular-nums text-slate-600 shrink-0">
                      {formatCurrency(Number(p.price) || 0)}
                      {p.price_updated_at ? (
                        <span className="text-xs text-slate-400 ml-2">
                          <Clock size={12} className="inline" /> updated
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
                {!products.length && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">No active products.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </OperationsPageLayout>
  );
}
