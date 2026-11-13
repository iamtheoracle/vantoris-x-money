import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, Eye, BellRing, AlertTriangle } from 'lucide-react';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

function amountLabel(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Amount not supplied';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return 'Amount not verified';
  }
}

function statusLabel(value) {
  return value ? String(value).replace(/_/g, ' ') : 'Status not supplied';
}

export default function AdminApplications() {
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
        if (!Array.isArray(rows)) throw new Error('Application query returned an invalid shape.');
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
      const matchesStatus = statusFilter === 'all' || String(application.application_status || '').toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter((application) => application.application_status === 'pending').length;

  return (
    <OperationsPageLayout title="Membership applications" description="Read-only application review. Decisions, account issuance, and applicant notifications require an audited server-side workflow." icon={FileText} breadcrumb="Operations">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Application decisions and reminders unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            No application status is changed, no account is issued, no opening balance is created, and no email or notification is sent from this page. A verified workflow must enforce eligibility, identity review, dual approval, ledger initialization, and audit logging.
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-navy">{loadError ? 'Unavailable' : applications.length}</p><p className="mt-1 text-xs text-slate-500">Application records returned · limit 50</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-semibold text-navy">{loadError ? 'Unavailable' : pendingCount}</p><p className="mt-1 text-xs text-slate-500">Pending records in returned set</p></div>
        <button type="button" disabled title="Email delivery requires a verified server-side workflow" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-400 disabled:cursor-not-allowed"><BellRing size={17} /> Reminders unavailable</button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applicants" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brass" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading application records…</p>
        ) : loadError ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Application records are unavailable. This is not confirmation that no applications exist.</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No application records matched this search.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((application) => (
              <article key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{application.full_name || application.applicant_name || 'Applicant name not supplied'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{application.email || 'Email not supplied'} · {dateLabel(application.created_date)}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">Application: {statusLabel(application.application_status)} · KYC: {statusLabel(application.kyc_status)}</p>
                </div>
                <button type="button" onClick={() => setSelected(application)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50"><Eye size={14} /> Review record</button>
              </article>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-400">The application query is bounded to the most recent 50 records; displayed counts are not complete queue totals.</p>
      </section>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Application record</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-500">Applicant</p><p className="font-semibold text-navy">{selected.full_name || selected.applicant_name || 'Name not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-navy">{selected.email || 'Email not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-navy">{selected.phone || 'Phone not supplied'}</p></div>
              <div><p className="text-xs text-slate-500">Application status</p><p className="capitalize text-navy">{statusLabel(selected.application_status)}</p></div>
              <div><p className="text-xs text-slate-500">KYC status</p><p className="capitalize text-navy">{statusLabel(selected.kyc_status)}</p></div>
              <div><p className="text-xs text-slate-500">Requested opening amount</p><p className="text-navy">{amountLabel(selected.opening_balance, selected.currency || selected.currency_code)}</p></div>
              <div><p className="text-xs text-slate-500">Submitted</p><p className="text-navy">{dateLabel(selected.created_date)}</p></div>
              <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Read-only review. This record has not been approved, rejected, or used to create an account from this screen.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}
