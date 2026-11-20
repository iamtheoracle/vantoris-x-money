import React from 'react';
import AgentChat from '@/components/vantoris/AgentChat';

export default function AdminAgent() {
  return (
    <div className="px-5 lg:px-6 py-5">
      <div className="mb-4">
        <p className="text-gray/60 text-[10px] uppercase tracking-[0.15em] font-semibold">AI & Administration</p>
        <h1 className="text-foreground font-bold text-xl">Assistant</h1>
      </div>
      <AgentChat agentName="vantoris_assistant" />
    </div>
  );
}