import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import PrivateInvestmentCardGallery from '@/components/vantoris/PrivateInvestmentCardGallery';
import FinancialHeritage from '@/components/vantoris/FinancialHeritage';

export default function DiscoverMarketing() {
  return (
    <div className="min-h-screen bg-[#F7F5EF] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E4DDCF] bg-[#FCFAF5]/95 px-4 py-3 backdrop-blur-md">
        <Link to="/discover" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back to client spaces">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B6C35]">Institutional identity</p>
          <h1 className="font-display text-xl text-[#102638]">Brand & communications</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6">
        <section className="rounded-[26px] bg-[#102638] p-5 text-white sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D8C18A]">Identity collection</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">A considered visual language</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Original vector card artwork, restrained navy and brass, and editorial financial history. This page presents approved in-product design assets, not campaign performance or customer endorsements.
          </p>
        </section>

        <section className="rounded-2xl border border-[#E4DDCF] bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#9A7A43]" />
            <h2 className="font-display text-2xl text-[#102638]">Card artwork editions</h2>
          </div>
          <PrivateInvestmentCardGallery />
        </section>

        <FinancialHeritage compact />

        <p className="rounded-xl border border-[#E4DDCF] bg-white p-4 text-xs leading-5 text-slate-600">
          Card faces are vector design concepts, not issued cards or payment credentials. Historical portraits remain attributed to their source collections; reproduction rights and source resolution must be checked before external print runs.
        </p>
      </div>
    </div>
  );
}
