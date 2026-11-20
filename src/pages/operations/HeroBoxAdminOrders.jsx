import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, Loader2, Truck, Check, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';

const STATUS_FLOW = ['draft', 'payment_pending', 'paid', 'processing', 'packed', 'shipped', 'in_transit', 'delivered'];

export default function HeroBoxAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setOrders(await base44.entities.HeroBoxOrder.list('-created_date', 50).catch(() => []));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleAdvance(order) {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    setProcessing(order.id);
    try {
      const updates = { status: nextStatus };
      if (nextStatus === 'paid') updates.payment_status = 'completed';
      if (nextStatus === 'shipped') updates.shipped_date = new Date().toISOString().substring(0, 10);
      if (nextStatus === 'delivered') updates.delivered_date = new Date().toISOString().substring(0, 10);
      await base44.entities.HeroBoxOrder.update(order.id, updates);
      toast({ title: 'Order updated', description: `Status changed to: ${nextStatus.replace(/_/g, ' ')}` });
      loadData();
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing('');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="HeroBox Orders" description="Manage order fulfillment lifecycle" icon={Package}>
      {orders.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <Package size={32} className="text-gray mx-auto mb-3" />
          <p className="text-gray">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const currentIdx = STATUS_FLOW.indexOf(order.status);
            const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
            let items = [];
            try { items = JSON.parse(order.items || '[]'); } catch (e) {}
            return (
              <div key={order.id} className="vantoris-glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">VAN-{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray">{order.created_date?.substring(0, 10)} · {order.recipient_name} · {order.destination}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(order.total || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? 'bg-mint' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray capitalize font-medium">{(order.status || '').replace(/_/g, ' ')}</span>
                  {canAdvance && (
                    <button
                      onClick={() => handleAdvance(order)}
                      disabled={processing === order.id}
                      className="px-3 py-1.5 rounded-lg bg-navy/10 text-navy text-xs font-semibold hover:bg-navy/20 transition"
                    >
                      {processing === order.id ? 'Updating...' : `Advance to ${STATUS_FLOW[currentIdx + 1].replace(/_/g, ' ')}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}