import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><LockKeyhole size={22} /></span>
        <h1 className="mt-6 text-2xl font-semibold text-navy">Secure account recovery</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Password recovery is handled by Vantoris staff after confirming your identity. No external identity or password-reset provider controls your member credentials.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Contact Vantoris through your established member-support channel to request a staff-issued recovery process.
        </p>
        <Link to="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Return to sign in</Link>
      </section>
    </main>
  );
}
