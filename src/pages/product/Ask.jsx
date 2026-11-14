import React from 'react';
import ProductShell from './ProductShell';
import AgentChat from '@/components/vantoris/AgentChat';

export default function Ask() {
  return (
    <ProductShell
      kicker="Vantoris Intelligence"
      title="Ask"
      subtitle="General information and educational guidance. The assistant cannot access accounts or perform institutional actions."
    >
      <AgentChat singleColumn title="Vantoris Assistant" subtitle="Informational only" />
    </ProductShell>
  );
}
