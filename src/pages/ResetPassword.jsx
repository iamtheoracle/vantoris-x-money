import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><ShieldCheck size={22} /></span>
        <h1 className="mt-6 text-2xl font-semibold text-navy">Password reset</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Password changes are not accepted through a legacy vendor link. Vantoris must issue and validate a one-time recovery authorization before a new credential can be saved.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Contact Vantoris member support to complete recovery. Your existing member record and ledger history are not changed by this page.
        </p>
        <Link to="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Return to sign in</Link>
      </section>
    </main>
  );
}
