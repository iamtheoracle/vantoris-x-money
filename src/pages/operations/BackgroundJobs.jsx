import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Cog } from 'lucide-react';

export default function BackgroundJobs() {
  return (
    <OperationsPageLayout title="Background Jobs" description="Scheduled tasks and automated processes" icon={Cog}>
      <div className="vantoris-card p-12 text-center">
        <Cog size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">No background jobs configured</p>
        <p className="text-[#AAB4C3] text-sm">Scheduled tasks like statement archival and notification dispatch will appear here.</p>
      </div>
    </OperationsPageLayout>
  );
}