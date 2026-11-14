import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><ShieldCheck size={23} /></span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris Private Banking</p>
        <h1 className="mt-2 text-2xl font-semibold text-navy">Membership is by invitation</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Vantoris controls member admission and identity review directly. An online form or third-party verification flag does not create a member account.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          If Vantoris has already approved your membership, use the sign-in details or activation instructions provided by the institution.
        </p>
        <Link to="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Return to sign in</Link>
      </section>
    </main>
  );
}
