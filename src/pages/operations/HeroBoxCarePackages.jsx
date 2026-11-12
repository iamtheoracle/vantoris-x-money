import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Package, Search, Truck, CheckCircle2, MapPin, Clock } from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';

const STATUS_META = {
  pending: { label: 'Recorded pending', color: 'text-brass', bg: 'bg-brass/12' },
  under_review: { label: 'Recorded under review', color: 'text-champagne', bg: 'bg-champagne/12' },
  approved: { label: 'Recorded approved', color: 'text-mint', bg: 'bg-mint/12' },
  in_progress: { label: 'Recorded in transit', color: 'text-champagne', bg: 'bg-champagne/12' },
  delivered: { label: 'Recorded delivered', color: 'text-mint', bg: 'bg-mint/12' },
  completed: { label: 'Recorded completed', color: 'text-mint', bg: 'bg-mint/12' },
};

export default function HeroBoxCarePackages() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await base44.entities.HeroBoxRequest.filter({ request_type: 'care_package' }, '-created_date', 200);
      if (!Array.isArray(data)) throw new Error('Care package source returned an invalid response.');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load care packages:', error);
      setLoadError(error.message || 'Care package records could not be loaded.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => requests.filter(r => {
    const matchesSearch = !search ||
      (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.recipient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.recipient_location || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [requests, search, statusFilter]);

  const stats = useMemo(() => [
    { label: 'Recorded requests', value: requests.length, icon: Package, color: 'text-navy' },
    { label: 'Marked in transit', value: requests.filter(r => r.status === 'in_progress').length, icon: Truck, color: 'text-champagne' },
    { label: 'Marked delivered', value: requests.filter(r => ['delivered', 'completed'].includes(r.status)).length, icon: CheckCircle2, color: 'text-mint' },
    { label: 'Pending review', value: requests.filter(r => ['pending', 'under_review'].includes(r.status)).length, icon: Clock, color: 'text-brass' },
  ], [requests]);

  const statusOptions = ['all', ...Object.keys(STATUS_META)];

  return (
    <OperationsPageLayout
      title="Care Packages"
      description="Read-only care-package request records. Carrier and recipient confirmation are not connected."
      icon={Package}
      breadcrumb="HeroBox · Operations"
    >
      <div role="note" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
        Statuses and tracking references below are application records only. They are not independently verified by a carrier or recipient. No shipping or delivery event is asserted by this page.
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, recipient, or location..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-gray/40 focus:border-brass/40 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-gray hover:text-foreground'}`}
            >
              {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {!loading && loadError && (
        <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {loadError} This is not confirmation that there are no care-package requests.
          <button type="button" onClick={loadRequests} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}

      {!loading && !loadError && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="vantoris-glass p-3.5">
                <Icon size={15} className={stat.color} />
                <p className="mt-1.5 text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-gray">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div role="status" className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
        </div>
      ) : loadError ? null : filtered.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Package size={32} className="mx-auto mb-2 text-gray/30" />
          <p className="text-sm text-gray">No care-package request records returned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg, i) => {
            const meta = STATUS_META[pkg.status] || { label: 'Recorded status not supplied', color: 'text-gray', bg: 'bg-slate-100' };
            return (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="vantoris-glass p-4 transition-all hover:shadow-float">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brass/12"><Package size={18} className="text-brass" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{pkg.title || 'Care package request'}</p>
                      <p className="text-[10px] text-gray">{pkg.created_date && Number.isFinite(new Date(pkg.created_date).getTime()) ? new Date(pkg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not supplied'}</p>
                    </div>
                  </div>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                </div>
                {pkg.description && <p className="mb-3 line-clamp-2 text-xs text-gray">{pkg.description}</p>}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  {pkg.recipient_name && <div className="flex items-center gap-2 text-[11px]"><span className="w-16 text-gray/60">Recipient</span><span className="truncate font-medium text-foreground">{pkg.recipient_name}</span></div>}
                  {pkg.recipient_location && <div className="flex items-center gap-2 text-[11px]"><MapPin size={12} className="text-gray/50" /><span className="truncate text-gray">{pkg.recipient_location}</span></div>}
                  {pkg.tracking_number && <div className="flex items-center gap-2 text-[11px]"><Truck size={12} className="text-gray/50" /><span className="font-mono text-gray">Recorded tracking reference: {pkg.tracking_number}</span></div>}
                  {pkg.estimated_delivery && <div className="flex items-center gap-2 text-[11px]"><Clock size={12} className="text-gray/50" /><span className="text-gray">Recorded ETA: {Number.isFinite(new Date(pkg.estimated_delivery).getTime()) ? new Date(pkg.estimated_delivery).toLocaleDateString() : 'Date not supplied'}</span></div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}
