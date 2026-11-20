import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Search, Loader2, RefreshCw, Globe, AlertTriangle, CheckCircle, Clock, ExternalLink, Activity, Database, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { executeDiscoveryRun, checkFreshness, refreshProductCatalog, verifyDiscoveryRecord, refreshStaleRecords, detectProductChanges } from '@/lib/discoveryEngine';
import { useToast } from '@/components/ui/use-toast';

const DISCOVERY_DOMAINS = [
  { id: 'humanitarian', label: 'Humanitarian', icon: Globe, color: 'text-brass' },
  { id: 'commerce', label: 'Commerce', icon: Activity, color: 'text-champagne' },
  { id: 'news', label: 'News', icon: Globe, color: 'text-navy' },
  { id: 'legal_regulatory', label: 'Legal & Regulatory', icon: ShieldAlert, color: 'text-crimson' },
  { id: 'market', label: 'Market', icon: Activity, color: 'text-mint' },
  { id: 'organization', label: 'Organizations', icon: Globe, color: 'text-brass' },
  { id: 'risk', label: 'Risk & Fraud', icon: AlertTriangle, color: 'text-warning' },
  { id: 'internal', label: 'Internal', icon: Database, color: 'text-gray' },
];

export default function DiscoveryNetwork() {
  const [records, setRecords] = useState([]);
  const [runs, setRuns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sources, setSources] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState(null);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [recs, recentRuns, openAlerts, srcs, recentChanges] = await Promise.all([
        base44.entities.DiscoveryRecord.filter({ status: 'active' }, '-discovered_date', 50).catch(() => []),
        base44.entities.DiscoveryRun.filter({}, '-started_at', 10).catch(() => []),
        base44.entities.DiscoveryAlert.filter({ status: 'open' }, '-created_date', 10).catch(() => []),
        base44.entities.DiscoverySource.filter({}, '-last_checked', 20).catch(() => []),
        base44.entities.DiscoveryChange.filter({ requires_review: true }, '-detected_at', 10).catch(() => []),
      ]);
      setRecords(recs);
      setRuns(recentRuns);
      setAlerts(openAlerts);
      setSources(srcs);
      setChanges(recentChanges);
    } catch (err) {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRunDiscovery(domain) {
    setRunning(true);
    toast({ title: 'Discovery started', description: `Running ${DISCOVERY_DOMAINS.find(d => d.id === domain)?.label} discovery...` });
    try {
      const result = await executeDiscoveryRun(domain, { triggered_by: 'manual' });
      toast({
        title: 'Discovery completed',
        description: `Discovered ${result.recordsDiscovered} new, updated ${result.recordsUpdated} records.`,
      });
      loadData();
    } catch (err) {
      toast({ title: 'Discovery failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  async function handleFreshnessCheck() {
    setRunning(true);
    try {
      const result = await checkFreshness();
      toast({ title: 'Freshness check complete', description: `${result.staleCount} stale records marked.` });
      loadData();
    } catch (err) {
      toast({ title: 'Check failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  async function handleProductRefresh() {
    setRunning(true);
    try {
      const result = await refreshProductCatalog();
      toast({
        title: 'Product refresh complete',
        description: result.reason || `Refreshed ${result.refreshed} products from ${result.sources} sources.`,
      });
      loadData();
    } catch (err) {
      toast({ title: 'Refresh failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  async function handleVerify(recordId) {
    toast({ title: 'Verifying record...', description: 'Cross-checking with additional sources.' });
    try {
      const result = await verifyDiscoveryRecord(recordId);
      toast({
        title: result.verified ? 'Verified' : 'Verification result',
        description: `Result: ${result.result || 'failed'}, Confidence: ${result.confidence || 'low'}`,
      });
      loadData();
    } catch (err) {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    }
  }

  async function handleStaleRefresh() {
    setRunning(true);
    toast({ title: 'Refreshing stale records...', description: 'Re-verifying stale discovery records.' });
    try {
      const result = await refreshStaleRecords();
      toast({
        title: 'Stale refresh complete',
        description: `${result.refreshed} refreshed, ${result.stillStale} still stale, ${result.unavailable} unavailable.`,
      });
      loadData();
    } catch (err) {
      toast({ title: 'Refresh failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  async function handleProductChangeDetection() {
    setRunning(true);
    try {
      const result = await detectProductChanges();
      toast({
        title: 'Product change detection complete',
        description: `${result.changesDetected} changes detected across ${result.totalProducts} products.`,
      });
      loadData();
    } catch (err) {
      toast({ title: 'Detection failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }

  const filteredRecords = activeDomain ? records.filter((r) => r.discovery_domain === activeDomain) : records;

  if (loading) {
    return (
      <OperationsPageLayout title="Discovery & Intelligence Network" icon={Search}>
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Discovery & Intelligence Network"
      description="Autonomous research, discovery, verification, and monitoring"
      icon={Search}
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleStaleRefresh}
            disabled={running}
            className="px-3 py-2 rounded-lg bg-champagne/10 text-champagne text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> Refresh Stale
          </button>
          <button
            onClick={handleFreshnessCheck}
            disabled={running}
            className="px-3 py-2 rounded-lg bg-navy/10 text-navy text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> Check Freshness
          </button>
        </div>
      }
    >
      {/* Discovery Domain Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {DISCOVERY_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const count = records.filter((r) => r.discovery_domain === domain.id).length;
          return (
            <button
              key={domain.id}
              onClick={() => handleRunDiscovery(domain.id)}
              disabled={running}
              className="vantoris-glass p-3 text-left hover:ring-2 hover:ring-brass/30 transition disabled:opacity-50"
            >
              <Icon size={18} className={domain.color} />
              <p className="text-xs font-bold text-foreground mt-2">{domain.label}</p>
              <p className="text-[10px] text-gray">{count} records</p>
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" /> Active Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="vantoris-glass-flat p-3 flex items-start gap-3">
                <AlertTriangle size={16} className={`mt-0.5 ${alert.severity === 'critical' ? 'text-crimson' : alert.severity === 'high' ? 'text-warning' : 'text-gray'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{alert.description}</p>
                  <p className="text-[10px] text-gray mt-0.5 capitalize">{alert.alert_type.replace(/_/g, ' ')} · {alert.severity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Detection */}
      {changes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity size={16} className="text-champagne" /> Changes Requiring Review ({changes.length})
          </h3>
          <div className="space-y-2">
            {changes.slice(0, 5).map((change) => (
              <div key={change.id} className="vantoris-glass-flat p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{change.change_summary}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/10 text-champagne font-medium capitalize">
                    {change.change_type.replace(/_/g, ' ')}
                  </span>
                </div>
                {change.previous_value && change.new_value && (
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-crimson/5 p-1.5 rounded">
                      <p className="text-gray font-medium mb-0.5">Previous:</p>
                      <p className="text-gray break-all">{change.previous_value}</p>
                    </div>
                    <div className="bg-mint/5 p-1.5 rounded">
                      <p className="text-gray font-medium mb-0.5">New:</p>
                      <p className="text-gray break-all">{change.new_value}</p>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-gray mt-1">
                  {change.detected_at ? new Date(change.detected_at).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Recent Discovery Runs</h3>
          <div className="space-y-2">
            {runs.slice(0, 5).map((run) => (
              <div key={run.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground capitalize">{run.run_type.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray">{run.summary || run.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    run.status === 'completed' ? 'bg-mint/10 text-mint' :
                    run.status === 'failed' ? 'bg-crimson/10 text-crimson' :
                    run.status === 'running' ? 'bg-champagne/10 text-champagne' :
                    'bg-slate-100 text-gray'
                  }`}>
                    {run.status}
                  </span>
                  {run.records_discovered > 0 && <span className="text-[10px] text-gray">+{run.records_discovered} new</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Discovery Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sources.map((source) => (
              <div key={source.id} className="vantoris-glass-flat p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{source.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    source.status === 'active' ? 'bg-mint/10 text-mint' :
                    source.status === 'unavailable' ? 'bg-crimson/10 text-crimson' :
                    'bg-slate-100 text-gray'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray mt-0.5 capitalize">{source.source_type} · {source.discovery_domain}</p>
                <div className="flex items-center gap-2 mt-1">
                  {source.api_available ? (
                    <span className="text-[10px] text-mint font-medium">API Connected</span>
                  ) : (
                    <span className="text-[10px] text-warning">No API — Web Search Only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Records */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Discovery Records</h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveDomain(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${!activeDomain ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}
          >
            All
          </button>
          {DISCOVERY_DOMAINS.slice(0, 4).map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDomain(activeDomain === d.id ? null : d.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${activeDomain === d.id ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Database size={28} className="text-gray mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No discovery records yet</p>
          <p className="text-xs text-gray mt-1">Run a discovery domain above to start discovering and verifying information.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.slice(0, 20).map((record) => (
            <div key={record.id} className="vantoris-glass p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{record.title}</p>
                  <p className="text-xs text-gray mt-0.5 line-clamp-2">{record.content_summary || record.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-gray capitalize">{record.discovery_domain.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      record.verification_status === 'verified' ? 'bg-mint/10 text-mint' :
                      record.verification_status === 'conflicting' ? 'bg-crimson/10 text-crimson' :
                      record.verification_status === 'failed' ? 'bg-crimson/10 text-crimson' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {record.verification_status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      record.freshness_status === 'current' ? 'bg-mint/10 text-mint' :
                      record.freshness_status === 'stale' ? 'bg-warning/10 text-warning' :
                      'bg-slate-100 text-gray'
                    }`}>
                      {record.freshness_status}
                    </span>
                    <span className="text-[10px] text-gray">Confidence: {record.confidence_level}</span>
                    {record.metadata && (() => {
                      let meta = {};
                      try { meta = JSON.parse(record.metadata || '{}'); } catch (e) {}
                      return meta._reliability_tier ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          meta._reliability_tier === 'high' ? 'bg-mint/10 text-mint' :
                          meta._reliability_tier === 'medium' ? 'bg-champagne/10 text-champagne' :
                          'bg-crimson/10 text-crimson'
                        }`}>
                          Reliability: {meta._reliability_tier} ({meta._reliability_score})
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {record.source_url && (
                    <a href={record.source_url} target="_blank" rel="noopener noreferrer" className="text-gray hover:text-navy">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleVerify(record.id)}
                    className="text-[10px] text-navy font-medium px-2 py-1 rounded bg-navy/10 hover:bg-navy/20"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}