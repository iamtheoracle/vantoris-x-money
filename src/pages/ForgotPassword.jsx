import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Mail, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check Your Email"
        footer={
          <Link to="/login" className="text-navy font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            Back to Log In
          </Link>
        }
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-navy" />
          </div>
          <p className="text-sm text-gray leading-relaxed">
            If an account exists with that email address, you will receive a password reset link shortly. Please check your inbox and follow the instructions provided.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="text-navy font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Back to Log In
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            <>Send Reset Link <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}