import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Flag, Plus } from 'lucide-react';

const flags = [
  { name: 'member_statements', label: 'Member Statement Generator', enabled: true },
  { name: 'auto_archival', label: 'Automatic Statement Archival', enabled: false },
  { name: 'bulk_operations', label: 'Bulk Application Processing', enabled: true },
  { name: 'crypto_withdrawals', label: 'Crypto Withdrawal Method', enabled: true },
  { name: 'ai_assistant', label: 'AI Operations Assistant', enabled: true },
  { name: 'document_storage', label: 'External Document Storage', enabled: false },
];

export default function FeatureFlags() {
  return (
    <OperationsPageLayout
      title="Feature Flags"
      description="Toggle platform features without deployment"
      icon={Flag}
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-brass/15 text-brass rounded-xl text-xs font-medium hover:bg-brass/25 transition-all">
          <Plus size={14} /> New Flag
        </button>
      }
    >
      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Feature</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Key</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {flags.map(f => (
              <tr key={f.name} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                <td className="px-5 py-4 text-white font-medium text-sm">{f.label}</td>
                <td className="px-5 py-4 text-[#AAB4C3] text-xs font-mono">{f.name}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${f.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#242D38] text-[#AAB4C3]'}`}>
                    {f.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OperationsPageLayout>
  );
}