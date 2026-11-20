import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ title, subtitle, footer, children, bare = false }) {
  return <div className="auth-refresh min-h-screen bg-[#f5f8f1] text-[#173c32] px-5 py-8">
    <Link to="/welcome" className="inline-flex items-center gap-2 text-sm font-medium rounded-lg p-2"><ArrowLeft size={16}/> Back to Vantoris</Link>
    <main className="w-full max-w-md mx-auto py-8 sm:py-14">
      <Link to="/welcome" className="block text-center mb-9 text-[32px] font-bold tracking-[-1.5px]">vantoris.</Link>
      <div className={bare ? '' : 'bg-white border border-[#dce5d5] rounded-3xl p-6 sm:p-8 shadow-sm'}>
        {title && <div className="mb-7 text-center"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="text-[#667460] text-sm mt-2">{subtitle}</p>}</div>}
        {children}
      </div>
      {footer && <div className="text-center text-sm text-[#667460] mt-6">{footer}</div>}
      <p className="flex items-center justify-center gap-2 text-center text-xs text-[#667460] mt-8"><ShieldCheck size={16}/> Your details belong in a secure space.</p>
    </main>
  </div>;
}
