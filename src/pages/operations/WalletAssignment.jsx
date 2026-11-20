import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Wallet } from 'lucide-react';

export default function WalletAssignment() {
  return (
    <OperationsPageLayout title="Wallet Assignment" description="Assign digital wallets to member accounts" icon={Wallet}>
      <div className="vantoris-card p-12 text-center">
        <Wallet size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">No wallet assignments</p>
        <p className="text-[#AAB4C3] text-sm">Wallet-to-account mappings will appear here once configured.</p>
      </div>
    </OperationsPageLayout>
  );
}