import React from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import FinancialHeritage from '@/components/vantoris/FinancialHeritage';

export default function Investment() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris investment records</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Investments</h1>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <ChartNoAxesCombined size={24} className="text-navy" />
        <h2 className="mt-4 font-semibold text-navy">No investment balance is currently available</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Investment holdings and returns will be shown only when Vantoris has verified the underlying asset records and posts the corresponding institutional journals. No third-party portfolio figure is treated as a Vantoris balance.
        </p>
      </section>
      <div className="mt-8">
        <FinancialHeritage compact />
      </div>
    </main>
  );
}
