import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Plug, Settings } from 'lucide-react';

const integrations = [
  { name: 'Google Drive', category: 'Document Storage', status: 'available', description: 'Archive statements and documents to Google Drive' },
  { name: 'Slack', category: 'Notifications', status: 'available', description: 'Send critical alerts to Slack channels' },
  { name: 'Stripe', category: 'Payments', status: 'available', description: 'Process card payments and deposits' },
  { name: 'Plaid', category: 'Banking', status: 'available', description: 'Connect bank accounts for verification' },
];

export default function Integrations() {
  return (
    <OperationsPageLayout title="Integrations" description="External service connections and API integrations" icon={Plug}>
      <div className="grid grid-cols-2 gap-4">
        {integrations.map(integration => (
          <div key={integration.name} className="vantoris-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
                <Plug size={18} className="text-brass" />
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-[#242D38] text-[#AAB4C3]">Available</span>
            </div>
            <p className="text-white font-medium text-sm mb-1">{integration.name}</p>
            <p className="text-brass text-xs mb-2">{integration.category}</p>
            <p className="text-[#AAB4C3] text-xs">{integration.description}</p>
          </div>
        ))}
      </div>
      <div className="vantoris-card p-5 mt-4">
        <div className="flex items-center gap-3">
          <Settings size={16} className="text-[#AAB4C3]" />
          <p className="text-[#AAB4C3] text-sm">Additional integrations can be added through the Configuration Center.</p>
        </div>
      </div>
    </OperationsPageLayout>
  );
}