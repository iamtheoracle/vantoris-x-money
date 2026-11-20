import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Code, Plus } from 'lucide-react';

export default function ApiManagement() {
  return (
    <OperationsPageLayout
      title="API Management"
      description="Manage API keys, webhooks, and developer access"
      icon={Code}
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-brass/15 text-brass rounded-xl text-xs font-medium hover:bg-brass/25 transition-all">
          <Plus size={14} /> Generate Key
        </button>
      }
    >
      <div className="vantoris-card p-12 text-center">
        <Code size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">No API keys configured</p>
        <p className="text-[#AAB4C3] text-sm">Generate API keys for external integrations and developer access.</p>
      </div>
    </OperationsPageLayout>
  );
}