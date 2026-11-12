import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plane, ShieldAlert } from 'lucide-react';

export default function DiscoverFlights() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link to="/discover" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back to discovery">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Vantoris Private Institution</p>
          <h1 className="font-heading font-bold text-navy">Flight information</h1>
          <p className="truncate text-[10px] font-mono text-slate-500">Licensed provider not connected</p>
        </div>
      </div>

      <div className="relative h-40 overflow-hidden bg-navy">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass">Travel</p>
          <p className="font-heading text-xl font-bold">Flight tracking</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-800" />
            <div>
              <h2 className="font-semibold text-amber-950">Commercial flight-data provider not verified</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">
                OpenSky research data is not used in this commercial client workspace because commercial-use rights have not been verified. No sample or simulated aircraft are displayed.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <Plane size={23} />
          </span>
          <h2 className="mt-4 font-semibold text-navy">Live flight tracking unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Flight positions, schedules, fares, and booking status will appear only after the relevant licensed providers are connected and verified. Tracking data does not itself create a reservation or ticket.
          </p>
          <Link to="/travel" className="mt-5 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
            Open travel workspace
          </Link>
        </section>
      </div>
    </div>
  );
}
