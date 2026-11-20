import React from 'react';
import AgentChat from '@/components/vantoris/AgentChat';

const DISPUTE_SUGGESTIONS = [
  'I see a transaction I don\'t recognize',
  'My account balance doesn\'t look right',
  'I think I was charged twice',
  'A deposit is missing from my account',
];

export default function TransactionDispute() {
  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Transaction Dispute Resolution</h1>
      <p className="text-[#AAB4C3] text-sm mb-4">Identify and resolve discrepancies in your transaction history</p>
      <AgentChat
        agentName="vantoris_assistant"
        title="Dispute Resolution Assistant"
        subtitle="Transaction discrepancy investigation"
        suggestions={DISPUTE_SUGGESTIONS}
        inputPlaceholder="Describe the discrepancy you noticed..."
      />
    </div>
  );
}