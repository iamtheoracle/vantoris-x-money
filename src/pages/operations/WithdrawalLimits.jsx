import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, DollarSign, Save } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';

const ACCOUNT_TYPES = ['Personal', 'Joint', 'Business', 'Organization'];

export default function WithdrawalLimits() {
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLimits(); }, []);

  async function loadLimits() {
    try {
      const all = await base44.entities.WithdrawalLimit.filter({}, '-created_date', 50);
      const byType = {};
      ACCOUNT_TYPES.forEach(type => {
        const limit = all.find(l => l.account_type === type);
        byType[type] = limit || { account_type: type, daily_limit: 0, monthly_limit: 0, single_limit: 0, enabled: true };
      });
      setLimits(byType);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const type of ACCOUNT_TYPES) {
        const limit = limits[type];
        if (limit.id) {
          await base44.entities.WithdrawalLimit.update(limit.id, limit);
        } else {
          await base44.entities.WithdrawalLimit.create(limit);
        }
      }
      await logAuditEntry({
        action_type: 'account_status_changed',
        description: 'Updated withdrawal limits configuration',
        details: JSON.stringify(limits, null, 2),
      });
      loadLimits();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Withdrawal Limits</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Configure per-account-type withdrawal limits to prevent fraud and manage risk</p>

      <div className="space-y-4">
        {ACCOUNT_TYPES.map(type => (
          <div key={type} className="vantoris-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">{type} Accounts</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={limits[type]?.enabled ?? true}
                  onChange={e => setLimits({ ...limits, [type]: { ...limits[type], enabled: e.target.checked } })}
                  className="w-4 h-4"
                />
                <span className="text-[#AAB4C3] text-sm">Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Single Request Limit (USD)</label>
                <input
                  type="number"
                  value={limits[type]?.single_limit || 0}
                  onChange={e => setLimits({ ...limits, [type]: { ...limits[type], single_limit: parseFloat(e.target.value) || 0 } })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Daily Limit (USD)</label>
                <input
                  type="number"
                  value={limits[type]?.daily_limit || 0}
                  onChange={e => setLimits({ ...limits, [type]: { ...limits[type], daily_limit: parseFloat(e.target.value) || 0 } })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="e.g., 100000"
                />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Monthly Limit (USD)</label>
                <input
                  type="number"
                  value={limits[type]?.monthly_limit || 0}
                  onChange={e => setLimits({ ...limits, [type]: { ...limits[type], monthly_limit: parseFloat(e.target.value) || 0 } })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="e.g., 500000"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-lg disabled:opacity-40"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="mt-8 bg-brass/10 border border-brass/30 rounded-lg p-4 flex gap-3">
        <AlertCircle size={20} className="text-brass flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#AAB4C3]">
          <p className="font-medium text-white mb-1">Withdrawal requests exceeding these limits will be flagged for manual review.</p>
          <p>Set to 0 to disable a limit for that account type.</p>
        </div>
      </div>
    </div>
  );
}