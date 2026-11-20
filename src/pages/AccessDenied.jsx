import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import ShieldLogo from '@/components/vantoris/ShieldLogo';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1A2B] px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-crimson/15 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-crimson" />
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <ShieldLogo size={36} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          You do not have authorization to access the Vantoris Operating System.
          This area is restricted to authorized administrators and operators.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Vantoris
        </Link>
      </div>
    </div>
  );
}