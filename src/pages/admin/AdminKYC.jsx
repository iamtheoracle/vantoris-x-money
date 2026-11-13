import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ShieldCheck, Eye, BellRing, AlertTriangle } from 'lucide-react';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

function statusLabel(value) {
  return value ? String(value).replace(/_/g, ' ') : 'Status not supplied';
}

export default function AdminKYC() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Application.list('-created_date', 50)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('KYC application query returned an invalid shape.');
        if (active) setApplications(rows);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesSearch = !query || [application.full_name, application.applicant_name, application.email, application.phone].filter(Boolean).join(' ').toLowerCase().includes(query);
      const kycStatus = String(application.kyc_status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || kycStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter((application) => ['pending', 'submitted', 'under_review'].includes(String(application.kyc_status || '').toLowerCase())).length;

  return (
    <OperationsPageLayout title="Identity verification review" description="Read-only KYC application records. Verification decisions and applicant notifications require a secure server-side workflow." icon={ShieldCheck} breadcrumb="Operations">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">KYC decisions and reminders unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            No verification status is changed and no reminder or notification is sent from this page. A secure review workflow must verify document provenance, identity evidence, reviewer authorization, audit history, and any required dual approval.
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-navy">{loadError ? 'Unavailable' : applications.length}</p><p className="mt-1 text-xs text-slate-500">Application records returned · limit 50</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-navy">{loadError ? 'Unavailable' : pendingCount}</p><p className="mt-1 text-xs text-slate-500">Pending KYC records in returned set</p></div>
        <button type="button" disabled title="Reminder delivery requires a verified server-side workflow" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"><BellRing size={17} /> Reminders unavailable</button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applicants" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brass" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="all">All KYC statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading identity review records…</p>
        ) : loadError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">KYC application records are unavailable. This is not confirmation that no applications exist.</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No KYC records matched this search.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((application) => (
              <article key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{application.full_name || application.applicant_name || 'Applicant name not supplied'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{application.email || 'Email not supplied'} · {dateLabel(application.created_date)}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">KYC: {statusLabel(application.kyc_status)} · Application: {statusLabel(application.application_status)}</p>
                </div>
                <button type="button" onClick={() => setSelected(application)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50"><Eye size={14} /> Review record</button>
              </article>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-400">The application query is bounded to the most recent 50 records; displayed counts are not complete KYC queue totals. Document review is not performed in this screen.</p>
      </section>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Identity review record</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-500">Applicant</p><p className="font-semibold text-navy">{selected.full_name || selected.applicant_name || 'Name not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-navy">{selected.email || 'Email not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-navy">{selected.phone || 'Phone not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">KYC status</p><p className="capitalize text-navy">{statusLabel(selected.kyc_status)}</p></div>
              <div><p className="text-xs text-slate-500">Application status</p><p className="capitalize text-navy">{statusLabel(selected.application_status)}</p></div>
              <div><p className="text-xs text-slate-500">Submitted</p><p className="text-navy">{dateLabel(selected.created_date)}</p></div>
              <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">This is a record summary only. Identity documents have not been independently reviewed or verified in this screen.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}
