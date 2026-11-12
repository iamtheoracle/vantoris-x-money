import React from 'react';
import { Link } from 'react-router-dom';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';
import { PROVIDERS } from '@/lib/providers';

const AREAS = ['Everyday', 'Connect', 'Care', 'Service member', 'Digital', 'Home', 'Style', 'Mobility', 'Student', 'Giving'];

export default function HeroBoxHub() {
  return (
    <ProductShell kicker="HeroBox" title="Send · Give · Connect · Serve" subtitle="Marketplace, packages, and donations stay closed until merchant, carrier, and donation providers return real prices.">
      <div className="mb-4 flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <span key={a} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium">{a}</span>
        ))}
      </div>
      <div className="space-y-3">
        <UnavailableState title="Marketplace prices" detail={PROVIDERS.marketplace.note} />
        <UnavailableState title="Shipping quotes" detail={PROVIDERS.shipping.note} />
        <UnavailableState title="Giving" detail={PROVIDERS.donations.note} />
      </div>
      <Link to="/herobox" className="mt-4 inline-block text-sm font-semibold text-navy underline">Open existing HeroBox workspace</Link>
      <Link to="/services" className="mt-3 block text-sm font-semibold text-navy underline">Contact client services about HeroBox</Link>
    </ProductShell>
  );
}
