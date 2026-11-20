import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ProductShell({ kicker, title, subtitle, children, back = '/' }) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28 text-navy">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[430px] items-center gap-2">
          <Link to={back} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Back">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">{kicker}</p>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[430px] px-4 py-5">
        {subtitle && <p className="mb-4 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
