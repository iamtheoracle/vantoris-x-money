import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Signal, Loader2, AlertCircle } from 'lucide-react';

export default function InvestmentSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const records = await base44.entities.InvestmentSignal.list('-created_date', 50);
    if (!Array.isArray(records)) throw new Error('Investment signal source returned an invalid response.');
    setSignals(records);
  }, []);

  useEffect(() => { loadData().catch(() => setError('Investment signal records are unavailable. No empty-signal conclusion can be drawn.')).finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="Investment Signals" description="Manage investment signals — no fabricated predictions" icon={Signal}>
      <div className="bg-warning/8 border border-warning/20 rounded-xl p-4 mb-5 flex items-start gap-3">
        <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray">
          Signals must not be fake AI predictions. Each signal must have structured information with honest confidence metrics and risk disclosures. Never promise returns. If market data is not connected, signals must be marked as stale.
        </p>
      </div>
      {error ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p> : signals.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <Signal size={32} className="text-gray mx-auto mb-3" />
          <p className="text-gray">No signal records were returned by the current query.</p>
          <p className="text-xs text-gray mt-2">Create signals with real methodology and honest uncertainty disclosure.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map(s => (
            <div key={s.id} className="vantoris-glass p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-foreground">{s.asset_symbol} {s.asset_name && `· ${s.asset_name}`}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.signal_type === 'buy' ? 'bg-mint/10 text-mint' :
                  s.signal_type === 'sell' ? 'bg-crimson/10 text-crimson' :
                  'bg-gray/10 text-gray'
                }`}>{s.signal_type || 'Signal type not supplied'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray">
                <span>Timeframe: <span className="capitalize">{s.timeframe || 'Not supplied'}</span></span>
                <span>Confidence: <span className="capitalize">{s.confidence || 'Not supplied'}</span></span>
                <span>Status: <span className="capitalize">{s.status || 'Status not supplied'}</span></span>
                <span>Generated: {s.generated_date?.substring(0, 10) || 'Date not supplied'}</span>
              </div>
              {s.risk_considerations && <p className="text-xs text-gray mt-2">Risk: {s.risk_considerations}</p>}
              {s.provider_connected === false && <p className="text-xs text-warning mt-2">Market data provider not connected.</p>}{s.provider_connected == null && <p className="text-xs text-warning mt-2">Provider connection status not supplied.</p>}
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}