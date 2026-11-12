import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Activity, Package, Users, MapPin, AlertTriangle, Download, Heart } from 'lucide-react';

function UnavailablePanel({ title, note, icon: Icon }) {
  return (
    <section className="vantoris-card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2"><Icon size={17} className="text-brass" /><h2 className="font-semibold text-white">{title}</h2></div>
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#526071] bg-[#0D1928]">
        <p className="text-sm font-semibold text-[#AAB4C3]">Verified metric unavailable</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#AAB4C3]">{note}</p>
    </section>
  );
}

export default function ImpactAnalytics() {
  const [counts, setCounts] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { count: Array.isArray(rows) ? rows.length : 0, failed: !Array.isArray(rows) };
      } catch {
        return { count: 0, failed: true };
      }
    };
    (async () => {
      const [profiles, activities, requests, cases] = await Promise.all([
        safeList(base44.entities.HeroBoxProfile.list('-created_date', 200)),
        safeList(base44.entities.HeroBoxActivity.list('-created_date', 500)),
        safeList(base44.entities.HeroBoxRequest.list('-created_date', 200)),
        safeList(base44.entities.HumanitarianCase.list('-date_discovered', 100)),
      ]);
      if (!active) return;
      setCounts({ profiles: profiles.count, activities: activities.count, requests: requests.count, cases: cases.count });
      setErrors({ profiles: profiles.failed, activities: activities.failed, requests: requests.failed, cases: cases.failed });
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    { key: 'profiles', label: 'HeroBox profile records returned', note: 'Bounded query · limit 200', icon: Users },
    { key: 'activities', label: 'HeroBox activity records returned', note: 'Bounded query · limit 500', icon: Activity },
    { key: 'requests', label: 'HeroBox request records returned', note: 'Bounded query · limit 200', icon: Package },
    { key: 'cases', label: 'Humanitarian case records returned', note: 'Bounded query · limit 100', icon: Heart },
  ];

  return (
    <OperationsPageLayout
      title="Impact analytics"
      description="Read-only HeroBox source-record overview. Verified humanitarian outcomes and financial impact are not yet available."
      icon={Activity}
      actions={<button type="button" disabled title="Requires a verified server-side impact reporting service" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"><Download size={14} /> Impact report unavailable</button>}
    >
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Impact totals are not independently verified</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Profile fields and activity records are not proof of funds distributed, packages delivered, volunteer hours completed, recipients served, or outcomes achieved. Financial impact requires reconciled ledger and provider settlement; fulfilment requires carrier and recipient confirmation.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <section key={stat.key} className="vantoris-card rounded-2xl p-5">
              <Icon size={18} className="mb-3 text-brass" />
              <p className="text-xl font-bold text-white">{loading ? '…' : errors[stat.key] ? 'Unavailable' : counts[stat.key]}</p>
              <p className="mt-1 text-xs text-[#AAB4C3]">{stat.label}</p>
              <p className="mt-2 text-[10px] text-[#AAB4C3]/70">{stat.note}</p>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <UnavailablePanel title="Verified funds distributed" note="Requires authorized donation capture, immutable ledger postings, provider settlement, refunds, reversals, and currency-aware reconciliation." icon={Heart} />
        <UnavailablePanel title="Verified care-package fulfilment" note="Requires supplier confirmation, inventory reservation, carrier tracking events, delivery proof, and recipient confirmation." icon={Package} />
        <UnavailablePanel title="Verified volunteer contribution" note="Requires consented volunteer records, attendance evidence, approved hour verification, and duplicate prevention." icon={Users} />
        <UnavailablePanel title="Verified geographic impact" note="Requires source-backed case locations, recipient consent, verified delivery outcomes, and privacy-safe aggregation." icon={MapPin} />
      </div>
      <p className="mt-5 text-[11px] text-[#AAB4C3]/70">Record counts describe bounded queries only. They are not impact totals, verified outcomes, or complete programme coverage.</p>
    </OperationsPageLayout>
  );
}
