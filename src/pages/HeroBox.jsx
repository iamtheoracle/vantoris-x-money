import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, ShoppingBag, Package, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProductCatalog from '@/components/vantoris/herobox/ProductCatalog';
import CheckoutFlow from '@/components/vantoris/herobox/CheckoutFlow';
import OrderHistory from '@/components/vantoris/herobox/OrderHistory';
import DonationFlow from '@/components/vantoris/herobox/DonationFlow';

const TABS = [
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'donate', label: 'Donate', icon: Heart },
];

export default function HeroBox() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const profiles = await base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []);
    if (profiles[0]) {
      setProfile(profiles[0]);
      return;
    }
    try {
      const created = await base44.entities.HeroBoxProfile.create({ user_id: me.id, role: 'sponsor', status: 'active' });
      setProfile(created);
    } catch (error) {
      const retry = await base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []);
      setProfile(retry[0] || null);
    }
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  function handleAddToCart(product) {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product_id: product.id, name: product.name, category: product.category, price: product.price, discount: product.discount || 0, quantity: 1 }];
    });
  }

  function handleRemoveFromCart(product) {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.product_id !== product.id);
      return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function handleOrderComplete() {
    setCart([]);
    setActiveTab('orders');
    toast({ title: 'Order placed', description: 'Your HeroBox order has been created.' });
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brass" /></div>;

  if (!profile) {
    return <div className="px-5 pt-6 min-h-screen"><div className="vantoris-glass-premium p-8 text-center"><Heart size={32} className="text-brass mx-auto mb-4" /><h2 className="text-xl font-bold text-foreground mb-2">HeroBox is temporarily unavailable</h2><p className="text-gray text-sm leading-relaxed">We could not initialize your HeroBox membership. Please refresh and try again.</p></div></div>;
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-brass/10 border border-brass/15 flex items-center justify-center"><Heart size={22} className="text-brass" /></div><div><h1 className="text-xl font-bold text-foreground">HeroBox</h1><p className="text-xs text-gray">They are our heroes. We can be theirs too.</p></div></div>
        {cartCount > 0 && <button onClick={() => setShowCheckout(true)} aria-label="Open cart" className="relative w-11 h-11 rounded-xl bg-navy flex items-center justify-center"><ShoppingCart size={20} className="text-white" /><span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brass text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span></button>}
      </div>

      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-gray'}`}><Icon size={14} /> {tab.label}</button>; })}
      </div>

      {activeTab === 'packages' && <div><ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="packages" />{cartCount > 0 && <button onClick={() => setShowCheckout(true)} className="fixed bottom-24 left-5 right-5 max-w-md mx-auto py-3.5 rounded-xl bg-brass text-white font-semibold shadow-lg flex items-center justify-center gap-2 z-40"><ShoppingCart size={18} /> Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})</button>}</div>}
      {activeTab === 'shop' && <div><ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="shop" />{cartCount > 0 && <button onClick={() => setShowCheckout(true)} className="fixed bottom-24 left-5 right-5 max-w-md mx-auto py-3.5 rounded-xl bg-brass text-white font-semibold shadow-lg flex items-center justify-center gap-2 z-40"><ShoppingCart size={18} /> Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})</button>}</div>}
      {activeTab === 'orders' && <OrderHistory />}
      {activeTab === 'donate' && <div><div className="vantoris-glass-premium p-6 mb-5 text-center"><Heart size={28} className="text-brass mx-auto mb-3" /><h3 className="text-base font-bold text-foreground mb-1">Donate to Verified Needs</h3><p className="text-gray text-xs leading-relaxed">Support verified humanitarian cases discovered by the Vantoris Discovery Engine. Every case is verified — Vantoris never fabricates people, needs, or emergencies. You choose exactly where your donation goes.</p></div><button onClick={() => setShowDonation(true)} className="w-full py-3.5 rounded-xl bg-brass text-white font-semibold flex items-center justify-center gap-2"><Heart size={18} /> Start a Donation</button></div>}

      {showCheckout && <CheckoutFlow cart={cart} onClose={() => setShowCheckout(false)} onOrderComplete={handleOrderComplete} />}
      {showDonation && <DonationFlow onClose={() => setShowDonation(false)} onOrderComplete={() => setActiveTab('orders')} />}
    </div>
  );
}
