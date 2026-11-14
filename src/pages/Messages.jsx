import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function Messages(){
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secure member communications</p><h1 className="mt-2 text-3xl font-semibold text-navy">Messages</h1>
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex gap-3"><MessageSquare size={22} className="mt-0.5 text-navy"/><div><h2 className="font-semibold text-navy">Vantoris member messaging</h2><p className="mt-2 text-sm leading-6 text-slate-600">The legacy vendor messaging connection has been disconnected. Vantoris's first-party member/staff messaging and notification store is not yet implemented. No messages are being simulated or marked as delivered.</p><p className="mt-3 text-sm leading-6 text-slate-600">Use your established Vantoris member-support channel for time-sensitive communication.</p></div></div></section>
 </main>;
}
