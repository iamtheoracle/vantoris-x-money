import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, ShieldAlert } from 'lucide-react';

export default function DiscoverHousing() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link to="/discover" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back to discovery">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Vantoris Private Institution</p>
          <h1 className="font-heading font-bold text-navy">Property discovery</h1>
        </div>
      </div>

      <div className="relative h-40 overflow-hidden bg-navy">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass">Property</p>
          <p className="font-heading text-xl font-bold">Private property workspace</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-800" />
            <div>
              <h2 className="font-semibold text-amber-950">Live property inventory unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">
                No verified property inventory source is connected to this workspace. No sample listings, asking prices, availability claims, or estimated monthly payments are displayed.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy">
              <Building2 size={21} />
            </span>
            <div>
              <h2 className="font-semibold text-navy">Verified listings and financing</h2>
              <p className="text-xs text-slate-500">Inventory, price, location and lender data must be sourced.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Property search, listing details, saved properties, and mortgage planning remain part of the service scope. They will populate when a licensed inventory source and verified lender terms are connected. Financing estimates will not be presented as offers or approvals.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <MapPin size={15} className="text-brass" />
            <span>No location-specific listing results are currently available.</span>
          </div>
        </section>

        <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-brass">
          View available client services
        </Link>
      </div>
    </div>
  );
}
