import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize, MapPin } from 'lucide-react';

/**
 * Housing desk — illustrative US market cards with real photography.
 * Not a live MLS/Zillow feed (no public Zillow API). Prices are sample market levels.
 */
const LISTINGS = [
  {
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 1840,
    city: 'Atlanta, GA',
    type: 'Single family',
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80',
  },
  {
    price: 689000,
    beds: 4,
    baths: 3,
    sqft: 2420,
    city: 'Austin, TX',
    type: 'Single family',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    price: 315000,
    beds: 2,
    baths: 2,
    sqft: 1120,
    city: 'Phoenix, AZ',
    type: 'Condo',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  },
  {
    price: 899000,
    beds: 3,
    baths: 2.5,
    sqft: 2100,
    city: 'Denver, CO',
    type: 'Townhome',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    price: 275000,
    beds: 3,
    baths: 2,
    sqft: 1650,
    city: 'Charlotte, NC',
    type: 'Single family',
    img: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1000&q=80',
  },
  {
    price: 1250000,
    beds: 5,
    baths: 4,
    sqft: 3800,
    city: 'Miami, FL',
    type: 'Single family',
    img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
  },
];

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function DiscoverHousing() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center gap-3 backdrop-blur-md">
        <Link to="/discover" className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading font-bold text-navy">Housing desk</h1>
      </div>

      <div className="relative h-40 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="font-mono text-[10px] text-brass uppercase tracking-wider">Property</p>
          <p className="font-heading font-bold text-xl">Market samples</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Sample US listings for education and cash-flow planning. Not a live MLS feed—there is no public
          Zillow API. Always verify with a licensed agent and local records.
        </p>
        {LISTINGS.map((l) => (
          <article key={l.city + l.price} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-44 relative">
              <img src={l.img} alt="" className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 rounded-full bg-navy/90 text-white text-xs font-bold px-2.5 py-1 font-mono">
                {money(l.price)}
              </span>
            </div>
            <div className="p-4">
              <p className="font-heading font-bold text-navy flex items-center gap-1">
                <MapPin size={14} className="text-brass" /> {l.city}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{l.type}</p>
              <div className="mt-3 flex gap-4 text-xs text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1"><Bed size={14} /> {l.beds} bd</span>
                <span className="inline-flex items-center gap-1"><Bath size={14} /> {l.baths} ba</span>
                <span className="inline-flex items-center gap-1"><Maximize size={14} /> {l.sqft.toLocaleString()} sqft</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-mono">
                Est. monthly @ 6.5% 30yr ≈ {money((l.price * 0.8 * 0.00632) + 350)} P&I+tax approx
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
