import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Package, Search, Truck, CheckCircle2, MapPin, Clock } from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { formatCurrency } from '@/lib/formatCurrency';

const STATUS_META = {
  pending: { label: 'Pending', color: 'text-brass', bg: 'bg-brass/12' },
  under_review: { label: 'Under Review', color: 'text-champagne', bg: 'bg-champagne/12' },
  approved: { label: 'Approved', color: 'text-mint', bg: 'bg-mint/12' },
  in_progress: { label: 'In Transit', color: 'text-champagne', bg: 'bg-champagne/12' },
  delivered: { label: 'Delivered', color: 'text-mint', bg: 'bg-mint/12' },
  completed: { label: 'Completed', color: 'text-mint', bg: 'bg-mint/12' },
};

export default function HeroBoxCarePackages() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    try {
      const data = await base44.entities.HeroBoxRequest.filter({ request_type: 'care_package' }, '-created_date', 200).catch(() => []);
      setRequests(data);
    } catch (e) {
      console.error('Failed to load care packages:', e);
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
    { label: 'Total Packages', value: requests.length, icon: Package, color: 'text-navy' },
    { label: 'In Transit', value: requests.filter(r => r.status === 'in_progress').length, icon: Truck, color: 'text-champagne' },
    { label: 'Delivered', value: requests.filter(r => ['delivered', 'completed'].includes(r.status)).length, icon: CheckCircle2, color: 'text-mint' },
    { label: 'Pending Review', value: requests.filter(r => ['pending', 'under_review'].includes(r.status)).length, icon: Clock, color: 'text-brass' },
  ], [requests]);

  const statusOptions = ['all', ...Object.keys(STATUS_META)];

  return (
    <OperationsPageLayout
      title="Care Packages"
      description="Mission support packages for deployed heroes"
      icon={Package}
      breadcrumb="HeroBox · Operations"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, recipient, or location..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-foreground placeholder:text-gray/40 focus:outline-none focus:border-brass/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-navy text-white'
                  : 'bg-white border border-slate-200 text-gray hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="vantoris-glass p-3.5">
              <Icon size={15} className={stat.color} />
              <p className="text-foreground font-bold text-xl mt-1.5">{stat.value}</p>
              <p className="text-gray text-[10px]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Package size={32} className="text-gray/30 mx-auto mb-2" />
          <p className="text-gray text-sm">No care packages found</p>
          <p className="text-gray/50 text-[11px] mt-1">Care package requests will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((pkg, i) => {
            const meta = STATUS_META[pkg.status] || STATUS_META.pending;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="vantoris-glass p-4 hover:shadow-float transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brass/12 flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-brass" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold truncate">{pkg.title}</p>
                      <p className="text-gray text-[10px]">{new Date(pkg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                {pkg.description && (
                  <p className="text-gray text-xs mb-3 line-clamp-2">{pkg.description}</p>
                )}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {pkg.recipient_name && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray/60 w-16">Recipient</span>
                      <span className="text-foreground font-medium truncate">{pkg.recipient_name}</span>
                    </div>
                  )}
                  {pkg.recipient_location && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin size={12} className="text-gray/50" />
                      <span className="text-gray truncate">{pkg.recipient_location}</span>
                    </div>
                  )}
                  {pkg.tracking_number && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Truck size={12} className="text-gray/50" />
                      <span className="text-gray font-mono">{pkg.tracking_number}</span>
                    </div>
                  )}
                  {pkg.estimated_delivery && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Clock size={12} className="text-gray/50" />
                      <span className="text-gray">ETA: {new Date(pkg.estimated_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  {pkg.amount > 0 && (
                    <div className="flex items-center gap-2 text-[11px] pt-1">
                      <span className="text-brass font-bold">{formatCurrency(pkg.amount)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}