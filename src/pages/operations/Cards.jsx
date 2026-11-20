import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { CreditCard } from 'lucide-react';

export default function Cards() {
  return (
    <OperationsPageLayout title="Cards" description="Member debit and credit card management" icon={CreditCard}>
      <div className="vantoris-card p-12 text-center">
        <CreditCard size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">No cards issued</p>
        <p className="text-[#AAB4C3] text-sm">Member cards will appear here once the card issuance module is configured.</p>
      </div>
    </OperationsPageLayout>
  );
}