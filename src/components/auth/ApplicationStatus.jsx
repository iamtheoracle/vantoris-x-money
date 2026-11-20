import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ArrowRight, Shield, Search } from "lucide-react";

export default function ApplicationStatus({ status, onContinue }) {
  const isApproved = status?.type === "approved";

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
          isApproved ? "bg-mint/10" : "bg-navy/10"
        }`}
      >
        {isApproved ? <CheckCircle size={32} className="text-mint" /> : <Clock size={32} className="text-navy" />}
      </motion.div>

      {isApproved ? (
        <>
          <h2 className="text-xl font-bold text-foreground mb-2">Congratulations</h2>
          <p className="text-gray text-sm mb-8">Your account has been successfully opened.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Member ID</span>
              <span className="text-foreground text-sm font-semibold font-mono">{status.memberId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Account Number</span>
              <span className="text-foreground text-sm font-semibold font-mono">{status.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Routing Number</span>
              <span className="text-foreground text-sm font-semibold font-mono">{status.routingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Available Balance</span>
              <span className="text-foreground text-sm font-semibold">{status.balance}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-foreground mb-2">Your signup request has been received.</h2>
          <p className="text-gray text-sm mb-8 leading-relaxed">
            Our support team will reach out to you shortly. Stay tuned.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Reference Number</span>
              <span className="text-foreground text-sm font-semibold font-mono">{status.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Status</span>
              <span className="text-navy text-sm font-semibold">Under Review</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray text-xs uppercase tracking-wider">Estimated Review Time</span>
              <span className="text-foreground text-sm font-semibold">2–3 Business Days</span>
            </div>
          </div>
          <button
            onClick={onContinue}
            className="w-full h-12 bg-white border border-slate-200 text-foreground font-semibold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2 mb-3"
          >
            <Search size={16} />
            Track Application
          </button>
        </>
      )}

      <div className="flex items-center justify-center gap-2 mb-6 text-gray">
        <Shield size={14} />
        <span className="text-[11px]">Your information is protected by bank-grade encryption</span>
      </div>

      <button
        onClick={onContinue}
        className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2"
      >
        Continue to Dashboard
        <ArrowRight size={16} />
      </button>
    </div>
  );
}