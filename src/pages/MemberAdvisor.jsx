import React from 'react';
import MemberAdvisorChat from '@/components/vantoris/MemberAdvisorChat';

export default function MemberAdvisor() {
  return (
    <div className="px-4 pt-4">
      <div className="mb-4">
        <p className="text-gray text-xs uppercase tracking-[0.2em] font-semibold mb-1">Vantoris Assistant</p>
        <h1 className="text-xl font-bold text-foreground">Secure Messaging</h1>
      </div>
      <MemberAdvisorChat />
    </div>
  );
}