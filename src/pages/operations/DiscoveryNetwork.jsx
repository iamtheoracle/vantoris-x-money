import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Search, RefreshCw, Globe, AlertTriangle, ExternalLink, Activity, Database, ShieldAlert, Clock } from 'lucide-react';

const DISCOVERY_DOMAINS = [
  { id: 'humanitarian', label: 'Humanitarian', icon: Globe },
  { id: 'commerce', label: 'Commerce', icon: Activity },
  { id: 'news', label: 'News', icon: Globe },
  { id: 'legal_regulatory', label: 'Legal & Regulatory', icon: ShieldAlert },
  { id: 'market', label: 'Market', icon: Activity },
  { id: 'organization', label: 'Organizations', icon: Globe },
  { id: 'risk', label: 'Risk & Fraud', icon: AlertTriangle },
  { id: 'internal', label: 'Internal', icon: Database },
];

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

function label(value) {
  return value ? String(value).replace(/_/g, ' ') : 'Not supplied';
}

function parseMetadata(value) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

export default function DiscoveryNetwork() {
  const [records, setRecords] = useState([]);
  const [runs, setRuns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sources, setSources] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ records: false, runs: false, alerts: false, sources: false, changes: false });
  const [activeDomain, setActiveDomain] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    const [recordResult, runResult, alertResult, sourceResult, changeResult] = await Promise.all([
      safeList(base44.entities.DiscoveryRecord.filter({ status: 'active' }, '-discovered_date', 50)),
      safeList(base44.entities.DiscoveryRun.filter({}, '-started_at', 10)),
      safeList(base44.entities.DiscoveryAlert.filter({ status: 'open' }, '-created_date', 10)),
      safeList(base44.entities.DiscoverySource.filter({}, '-last_checked', 20)),
      safeList(base44.entities.DiscoveryChange.filter({ requires_review: true }, '-detected_at', 10)),
    ]);
    setRecords(recordResult.rows);
    setRuns(runResult.rows);
    setAlerts(alertResult.rows);
    setSources(sourceResult.rows);
    setChanges(changeResult.rows);
    setErrors({
      records: recordResult.failed,
      runs: runResult.failed,
      alerts: alertResult.failed,
      sources: sourceResult.failed,
      changes: changeResult.failed,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRecords = useMemo(() => activeDomain ? records.filter((record) => record.discovery_domain === activeDomain) : records, [records, activeDomain]);

  return (
    <OperationsPageLayout
      title="Discovery & Intelligence Network"
      description="Read-only discovery records, sources, and review history. Discovery ingestion and verification actions are disabled."
      icon={Search}
      actions={<button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload records</button>}
    >
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Discovery automation and verification are disabled</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            No discovery run, source refresh, verification, stale-record update, product change detection, or approval is initiated from this page. These actions require server-side source validation, human review, dual approval where applicable, and immutable audit evidence.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {DISCOVERY_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const count = records.filter((record) => record.discovery_domain === domain.id).length;
          return (
            <button key={domain.id} type="button" onClick={() => setActiveDomain(activeDomain === domain.id ? null : domain.id)} className={'rounded-xl border p-3 text-left ' + (activeDomain === domain.id ? 'border-brass bg-brass/10' : 'border-slate-200 bg-white')}>
              <Icon size={17} className="text-brass" />
              <p className="mt-2 text-xs font-bold text-navy">{domain.label}</p>
              <p className="mt-1 text-[10px] text-slate-500">{errors.records ? 'Count unavailable' : count + ' records returned'}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="vantoris-glass rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><AlertTriangle size={16} className="text-warning" /> Open alert records</h2>
          {loading ? <p className="py-4 text-xs text-gray">Loading alert records…</p> : errors.alerts ? <p role="status" className="text-xs text-amber-700">Alert records unavailable; zero alerts must not be inferred.</p> : alerts.length === 0 ? <p className="py-4 text-xs text-gray">No open alert records were returned.</p> : alerts.slice(0, 5).map((alert) => <div key={alert.id} className="border-b border-slate-100 py-2 last:border-0"><p className="text-xs font-medium text-foreground">{alert.description || 'Alert description not supplied'}</p><p className="mt-0.5 text-[10px] text-gray">{label(alert.alert_type)} · recorded severity: {label(alert.severity)}</p></div>)}
        </section>

        <section className="vantoris-glass rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><Activity size={16} className="text-champagne" /> Change records requiring review</h2>
          {loading ? <p className="py-4 text-xs text-gray">Loading change records…</p> : errors.changes ? <p role="status" className="text-xs text-amber-700">Change records unavailable; no empty-queue conclusion is drawn.</p> : changes.length === 0 ? <p className="py-4 text-xs text-gray">No change records were returned for this filter.</p> : changes.slice(0, 5).map((change) => <div key={change.id} className="border-b border-slate-100 py-2 last:border-0"><p className="text-xs font-medium text-foreground">{change.change_summary || 'Change summary not supplied'}</p><p className="mt-0.5 text-[10px] text-gray">{label(change.change_type)} · {dateLabel(change.detected_at)}</p></div>)}
        </section>
      </div>

      <section className="mb-6 vantoris-glass rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold text-foreground">Recorded discovery runs</h2>
        {loading ? <p className="py-4 text-xs text-gray">Loading run records…</p> : errors.runs ? <p role="status" className="text-xs text-amber-700">Discovery run history unavailable.</p> : runs.length === 0 ? <p className="py-4 text-xs text-gray">No discovery run records were returned.</p> : runs.slice(0, 5).map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0"><div><p className="text-xs font-medium capitalize text-foreground">{label(run.run_type)}</p><p className="text-[10px] text-gray">{run.summary || 'Summary not supplied'} · {dateLabel(run.started_at)}</p></div><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">Recorded status: {label(run.status)}</span></div>)}
        <p className="mt-2 text-[10px] text-gray">Historical run records are not proof that sources were independently verified or that records remain current.</p>
      </section>

      <section className="mb-6 vantoris-glass rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold text-foreground">Recorded discovery sources</h2>
        {loading ? <p className="py-4 text-xs text-gray">Loading source records…</p> : errors.sources ? <p role="status" className="text-xs text-amber-700">Discovery source records unavailable.</p> : sources.length === 0 ? <p className="py-4 text-xs text-gray">No discovery source records were returned.</p> : <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{sources.map((source) => <div key={source.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-foreground">{source.name || 'Source name not supplied'}</p><span className="text-[10px] capitalize text-gray">Recorded status: {label(source.status)}</span></div><p className="mt-1 text-[10px] text-gray">{label(source.source_type)} · {label(source.discovery_domain)}</p><p className="mt-1 text-[10px] text-gray">API availability field: {source.api_available === true ? 'reported true' : source.api_available === false ? 'reported false' : 'not supplied'} · Last checked: {dateLabel(source.last_checked)}</p></div>)}</div>}
      </section>

      <section className="vantoris-glass rounded-2xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">Discovery record history</h2>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setActiveDomain(null)} className={'rounded-full px-2.5 py-1 text-[10px] font-medium ' + (!activeDomain ? 'bg-navy text-white' : 'bg-slate-100 text-gray')}>All</button>
            {DISCOVERY_DOMAINS.slice(0, 4).map((domain) => <button key={domain.id} type="button" onClick={() => setActiveDomain(activeDomain === domain.id ? null : domain.id)} className={'rounded-full px-2.5 py-1 text-[10px] font-medium ' + (activeDomain === domain.id ? 'bg-navy text-white' : 'bg-slate-100 text-gray')}>{domain.label}</button>)}
          </div>
        </div>
        {loading ? <p className="py-8 text-center text-xs text-gray">Loading discovery records…</p> : errors.records ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">Discovery records unavailable. No empty-record conclusion is drawn.</p> : filteredRecords.length === 0 ? <p className="py-8 text-center text-xs text-gray">No discovery records were returned for this filter.</p> : (
          <div className="space-y-2">
            {filteredRecords.slice(0, 20).map((record) => {
              const metadata = parseMetadata(record.metadata);
              return (
                <article key={record.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{record.title || 'Title not supplied'}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray">{record.content_summary || record.description || 'Summary not supplied'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray">
                        <span>{label(record.discovery_domain)}</span>
                        <span>Recorded verification: {label(record.verification_status)}</span>
                        <span>Recorded freshness: {label(record.freshness_status)}</span>
                        <span>Confidence field: {label(record.confidence_level)}</span>
                        {metadata._reliability_tier && <span>Recorded reliability: {label(metadata._reliability_tier)}</span>}
                        <span>Discovered: {dateLabel(record.discovered_date)}</span>
                      </div>
                    </div>
                    {record.source_url && <a href={record.source_url} target="_blank" rel="noopener noreferrer" aria-label="Open recorded source" className="text-gray hover:text-navy"><ExternalLink size={14} /></a>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-[10px] text-gray">Records and verification fields are displayed as stored metadata. No source validation or state transition is performed here.</p>
      </section>
    </OperationsPageLayout>
  );
}
