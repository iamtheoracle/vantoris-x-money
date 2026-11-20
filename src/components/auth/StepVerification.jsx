import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Check, ShieldCheck } from "lucide-react";

export default function StepVerification({ data }) {
  const [confirmed, setConfirmed] = useState(false);
  const maskedPhone = data.phone
    ? data.phone.replace(/\d(?=\d{2})/g, "•")
    : "";

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center mx-auto mb-4">
          <Phone size={28} className="text-navy" />
        </div>
        <p className="text-sm text-gray leading-relaxed">
          We'll send a verification code to your mobile number to confirm it belongs to you.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray mb-1">Mobile Number</p>
        <p className="text-lg font-semibold text-foreground font-mono">{maskedPhone || "Not provided"}</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
        <button
          type="button"
          onClick={() => setConfirmed(!confirmed)}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
            confirmed ? "bg-navy border-navy" : "border-slate-300 bg-white"
          }`}
        >
          {confirmed && <Check size={12} className="text-white" />}
        </button>
        <span className="text-xs text-gray leading-relaxed">
          I confirm this mobile number is correct and I am authorized to use it. I consent to receiving verification codes via SMS.
        </span>
      </label>

      {confirmed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-mint/5 border border-mint/20 rounded-lg p-3"
        >
          <ShieldCheck size={16} className="text-mint flex-shrink-0" />
          <p className="text-xs text-mint">Number confirmed. Continue to proceed.</p>
        </motion.div>
      )}

      <p className="text-xs text-gray leading-relaxed">
        Your mobile number will be verified during account setup with a one-time passcode.
      </p>
    </div>
  );
}