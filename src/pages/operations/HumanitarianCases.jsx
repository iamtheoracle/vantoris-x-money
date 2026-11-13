import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Heart, Loader2, Clock, ExternalLink, MapPin, FileText, AlertCircle, ShieldAlert } from 'lucide-react';

const RECIPIENT_TYPE_LABELS = {
  individual: 'Individual',
  family: 'Family',
  childrens_home: "Children's Home",
  orphanage: 'Orphanage',
  shelter: 'Shelter',
  ngo: 'NGO',
  organization: 'Organization',
  military_personnel: 'Military Personnel',
  military_family: 'Military Family',
  community: 'Community',
};

const CATEGORY_LABELS = {
  financial_assistance: 'Financial Assistance',
  surgery_medical: 'Surgery / Medical',
  food: 'Food',
  essential_supplies: 'Essential Supplies',
  children_support: 'Children Support',
  shelter: 'Shelter',
  emergency: 'Emergency',
  military_support: 'Military Support',
  communication: 'Communication',
  other: 'Other',
};

function statusLabel(value) {
  return value ? String(value).replace(/_/g, ' ') : 'Not supplied';
}

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString();
}

function amountLabel() {
  return 'Estimate withheld pending independent verification';
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HumanitarianCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;
    base44.entities.HumanitarianCase.filter({}, '-date_discovered', 50)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Humanitarian case query returned an invalid shape.');
        if (active) setCases(rows);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredCases = useMemo(() => filter === 'all' ? cases : cases.filter((item) => item.case_status === filter), [cases, filter]);

  return (
    <OperationsPageLayout
      title="Humanitarian case records"
      description="Read-only case records for source and verification review. Case status does not authorize publication, donations, or fulfilment."
      icon={Heart}
    >
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Case approval and activation are unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            Existing verification and case-status fields are displayed as recorded metadata only. They do not prove independent verification or authorize donor visibility. Approval requires source evidence, human review, dual control, and an immutable server-side audit trail. Donations and fulfilment are not enabled here.
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All records' },
          { id: 'discovered', label: 'Discovered' },
          { id: 'verification_pending', label: 'Verification pending' },
          { id: 'review_pending', label: 'Review pending' },
          { id: 'approved', label: 'Recorded as approved' },
          { id: 'active', label: 'Recorded as active' },
          { id: 'stale', label: 'Stale' },
          { id: 'rejected', label: 'Recorded as rejected' },
        ].map((tab) => (
          <button key={tab.id} type="button" onClick={() => setFilter(tab.id)} className={'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ' + (filter === tab.id ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600')}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 text-xs text-slate-500">{loadError ? 'Case records unavailable' : cases.length + ' case records returned · query limit 50'}</div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Humanitarian case records are unavailable. This is not confirmation that no cases exist.</p>
      ) : filteredCases.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Heart size={28} className="mx-auto mb-2 text-gray" />
          <p className="text-sm font-medium text-foreground">No case records returned for this filter</p>
          <p className="mt-1 text-xs text-gray">No humanitarian need is invented or inferred when the source returns no records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredCases.map((item) => {
            const evidence = parseArray(item.evidence);
            const flags = parseArray(item.risk_flags);
            return (
              <article key={item.id} className="vantoris-glass p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{item.case_title || 'Case title not supplied'}</p>
                    <p className="mt-0.5 text-xs text-gray">{RECIPIENT_TYPE_LABELS[item.recipient_type] || item.recipient_type || 'Recipient type not supplied'} · {CATEGORY_LABELS[item.category] || item.category || 'Category not supplied'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600">{statusLabel(item.case_status)}</span>
                </div>

                {item.recipient_name && <p className="text-xs font-medium text-foreground">{item.recipient_name}</p>}
                {item.location && <p className="mt-1 flex items-center gap-1 text-[10px] text-gray"><MapPin size={10} /> {item.location}</p>}
                {item.stated_need && <p className="mt-2 line-clamp-3 text-xs text-gray">{item.stated_need}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">Recorded verification: {statusLabel(item.verification_status)}</span>
                  <span className="text-[10px] text-gray">Confidence field: {statusLabel(item.confidence_level)}</span>
                  <span className="text-[10px] text-gray">Estimated need: {amountLabel(item)}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-gray"><Clock size={9} /> {dateLabel(item.date_discovered)}</span>
                </div>

                {evidence.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-gray"><FileText size={11} /> {evidence.length} evidence reference(s) stored; content not independently reviewed here.</p>}
                {flags.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700"><AlertCircle size={12} /> {flags.length} recorded risk flag(s): {flags.join(', ')}</p>}

                {item.source_url && <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-brass"><ExternalLink size={10} /> Open recorded source</a>}
                {item.source_name && <p className="mt-0.5 text-[10px] text-gray">Source label: {item.source_name}</p>}

                <button type="button" disabled title="Requires human review and server-side dual approval" className="mt-3 w-full cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">Approval unavailable</button>
                <p className="mt-2 text-[10px] text-gray">Recorded active status does not enable donations or confirm recipient delivery.</p>
              </article>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}
