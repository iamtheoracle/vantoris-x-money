import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Signal, Loader2, AlertCircle } from 'lucide-react';

export default function InvestmentSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setSignals(await base44.entities.InvestmentSignal.list('-created_date', 50));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="Investment Signals" description="Manage investment signals — no fabricated predictions" icon={Signal}>
      <div className="bg-warning/8 border border-warning/20 rounded-xl p-4 mb-5 flex items-start gap-3">
        <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray">
          Signals must not be fake AI predictions. Each signal must have structured information with honest confidence metrics and risk disclosures. Never promise returns. If market data is not connected, signals must be marked as stale.
        </p>
      </div>
      {signals.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <Signal size={32} className="text-gray mx-auto mb-3" />
          <p className="text-gray">No signals created.</p>
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
                }`}>{s.signal_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray">
                <span>Timeframe: <span className="capitalize">{s.timeframe}</span></span>
                <span>Confidence: <span className="capitalize">{s.confidence}</span></span>
                <span>Status: <span className="capitalize">{s.status}</span></span>
                <span>Generated: {s.generated_date?.substring(0, 10)}</span>
              </div>
              {s.risk_considerations && <p className="text-xs text-gray mt-2">Risk: {s.risk_considerations}</p>}
              {!s.provider_connected && <p className="text-xs text-warning mt-2">⚠ Market data not connected</p>}
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}