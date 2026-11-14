import React from 'react';
import { Headphones } from 'lucide-react';

export default function Services(){
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris member services</p><h1 className="mt-2 text-3xl font-semibold text-navy">Member services</h1>
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex gap-3"><Headphones size={22} className="mt-0.5 text-navy"/><div><h2 className="font-semibold text-navy">Vantoris-controlled service requests</h2><p className="mt-2 text-sm leading-6 text-slate-600">The legacy service-request connection has been disconnected. A first-party Vantoris request and staff case workflow is not yet available, so this page will not accept or claim to submit a request.</p><p className="mt-3 text-sm leading-6 text-slate-600">Please use your established Vantoris member-support channel while the institution's service workflow is completed.</p></div></div></section>
 </main>;
}
