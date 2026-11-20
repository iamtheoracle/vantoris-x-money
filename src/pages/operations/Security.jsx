import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Lock, ShieldCheck, KeyRound, Eye } from 'lucide-react';

export default function Security() {
  const items = [
    { label: 'Two-Factor Authentication', icon: KeyRound, status: 'Enforced' },
    { label: 'Session Management', icon: Eye, status: 'Active' },
    { label: 'Role-Based Access Control', icon: Lock, status: 'Active' },
    { label: 'Operations Route Guard', icon: ShieldCheck, status: 'Enforced' },
  ];

  return (
    <OperationsPageLayout title="Security" description="Access control, authentication, and platform security" icon={Lock}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="vantoris-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-olive/20 flex items-center justify-center">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{item.label}</p>
                <p className="text-emerald-400 text-xs">{item.status}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="vantoris-card p-5">
        <h3 className="text-white font-semibold mb-3">Access Control Policy</h3>
        <p className="text-[#AAB4C3] text-sm leading-relaxed">
          The Operations Center is completely isolated from the Member experience. Access is restricted to users
          with authorized roles (Operations Officer, Finance Officer, Compliance Officer, Executive, Administrator,
          Super Administrator). All Operations routes are protected by server-side role verification.
          Unauthorized users are silently redirected without exposure to operational information.
        </p>
      </div>
    </OperationsPageLayout>
  );
}