import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { HeartPulse, CheckCircle2 } from 'lucide-react';

export default function SystemHealth() {
  const services = [
    { name: 'Authentication Service', status: 'Operational' },
    { name: 'Database', status: 'Operational' },
    { name: 'Notification Engine', status: 'Operational' },
    { name: 'Transaction Processor', status: 'Operational' },
    { name: 'Statement Generator', status: 'Operational' },
    { name: 'File Storage', status: 'Operational' },
  ];

  return (
    <OperationsPageLayout title="System Health" description="Real-time platform health monitoring" icon={HeartPulse}>
      <div className="vantoris-card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-olive/20 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">All Systems Operational</p>
            <p className="text-[#AAB4C3] text-sm">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.name} className="vantoris-card p-4 flex items-center justify-between">
            <span className="text-white text-sm font-medium">{s.name}</span>
            <span className="flex items-center gap-2 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </OperationsPageLayout>
  );
}