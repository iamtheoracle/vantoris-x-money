import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Lock, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        subtitle="This password reset link is missing or has expired"
        footer={
          <Link to="/forgot-password" className="text-navy font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-crimson/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-crimson" />
          </div>
          <p className="text-sm text-gray leading-relaxed">
            The link you used appears to be incomplete or has expired. Please request a new password reset email.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter your new password below"
      footer={
        <Link to="/login" className="text-navy font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Back to Log In
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
            <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}