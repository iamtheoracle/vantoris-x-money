import React from 'react';
import { Link } from 'react-router-dom';

export default function UnavailableState({ title, detail, action = null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">Not connected</p>
      <h2 className="mt-2 text-lg font-bold text-navy">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
      {action}
      <p className="mt-4 text-[11px] text-slate-400">
        Vantoris will not invent balances, bookings, listings, shipments, donations, or news.
      </p>
      <Link to="/support" className="mt-3 inline-block text-sm font-semibold text-navy underline">
        Contact support
      </Link>
    </div>
  );
}
