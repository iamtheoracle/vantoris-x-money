import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper, ShieldAlert } from 'lucide-react';

export default function DiscoverNews() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link to="/discover" className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back to discovery">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Vantoris Private Institution</p>
          <h1 className="font-heading font-bold text-navy">Markets & news</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-800" />
            <div>
              <h2 className="font-semibold text-amber-950">Verified news feed not connected</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">
                No licensed or otherwise approved news source is connected to this workspace. No illustrative headlines, dates, market commentary, or fabricated article cards are displayed.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <Newspaper size={23} />
          </span>
          <h2 className="mt-4 font-semibold text-navy">Research and market updates</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            News, source attribution, publication timestamps, and market commentary will appear when an approved feed is connected. Investment decisions must not rely on unsourced or stale headlines.
          </p>
        </section>
      </div>
    </div>
  );
}
