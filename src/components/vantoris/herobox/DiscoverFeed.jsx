import React from 'react';
import { Compass, Heart, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Public discovery is paused until legacy records have independent source
 * verification and a server-side human/dual-approval publication workflow.
 */
export default function DiscoverFeed({ standalone = false }) {
  const Icon = standalone ? Compass : Heart;
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brass">
          <Icon size={15} /> {standalone ? 'Discovery' : 'HeroBox'}
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          {standalone ? 'Public discovery' : 'Discover trusted opportunities'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Organization, humanitarian-case, and news listings will appear only after their source evidence and publication authorization are independently reviewed.
        </p>
      </header>

      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-800" />
          <div>
            <h2 className="font-semibold text-amber-950">Public discovery is temporarily paused</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">
              Legacy discovery records may contain machine-generated verification or approval states. Those fields alone are not sufficient evidence of a real organization, humanitarian need, news source, recipient, or delivery. No listings are published from those records until independent source review, human approval, dual control, and an immutable audit trail are available.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-slate-500" />
          <div>
            <h2 className="font-semibold text-navy">No unverified records are displayed</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Donations, payments, sponsorships, and fulfilment are not initiated by this discovery screen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
