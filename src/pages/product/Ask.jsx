import React from 'react';
import { Link } from 'react-router-dom';
import ProductShell from './ProductShell';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function Ask() {
  return (
    <ProductShell
      kicker="Vantoris Intelligence"
      title="Assistant unavailable"
      subtitle="The assistant is optional and is not part of the institution's financial authority."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy">
          <Sparkles size={20} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-navy">Not enabled</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Vantoris has not enabled an independently verified private assistant endpoint. No assistant provider is connected, and this service cannot read member accounts, balances, identity records or staff operations.
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy" />
          <p>Member sign-in, accounts, internal transfers, statements and institutional operations remain independent of this optional service.</p>
        </div>
        <Link to="/" className="mt-5 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">Return to Vantoris</Link>
      </section>
    </ProductShell>
  );
}
