import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import SplashScreen from "@/components/auth/SplashScreen";
import OnboardingCarousel from "@/components/auth/OnboardingCarousel";
import { Loader2, Lock, User } from "lucide-react";

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

export default function Login() {
  const [phase, setPhase] = useState("login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("vantoris_user_id");
    if (saved) {
      setUserId(saved);
      setRememberId(true);
    }
  }, []);

  function handleSplashDone() {
    const seen = localStorage.getItem("vantoris_onboarding_seen");
    setPhase(seen ? "login" : "onboarding");
  }

  function handleOnboardingComplete() {
    localStorage.setItem("vantoris_onboarding_seen", "true");
    setPhase("login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!mfaSetup) {
        if (rememberId) localStorage.setItem("vantoris_user_id", userId.trim());
        else localStorage.removeItem("vantoris_user_id");
      }

      const confirmingSetup = Boolean(mfaSetup);
      const headers = { "content-type": "application/json", accept: "application/json" };
      if (confirmingSetup) headers["x-csrf-token"] = readCookie("__Host-vantoris_mfa_csrf");
      const body = confirmingSetup
        ? { action: "mfa-enroll-confirm", otp }
        : { action: "login", email: userId.trim(), password, otp };
      const response = await fetch("/api/member-auth", {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));

      if (result.error === "mfa_setup_required") {
        setMfaSetup(result.mfaSetup || null);
        setMfaRequired(false);
        setOtp("");
        setError(result.message || "Set up your Vantoris authenticator to continue.");
        return;
      }
      if (result.error === "mfa_required") {
        setMfaRequired(true);
        setError("Enter the current six-digit code from your Vantoris authenticator.");
        return;
      }
      if (result.error === "mfa_code_invalid") {
        setError("That authenticator code is not valid. Check the code and try again.");
        return;
      }
      if (result.error === "mfa_enrollment_expired") {
        setMfaSetup(null);
        setOtp("");
        setError("Your authenticator setup expired. Sign in again to restart it.");
        return;
      }
      if (result.error === "mfa_enrollment_required") {
        setError("Your Vantoris security setup must be completed before sign-in.");
        return;
      }
      if (!response.ok || !result.member?.id) {
        setError(result.message || (response.status === 429
          ? "Sign-in is temporarily locked. Please try again later."
          : "Your email or password is incorrect."));
        return;
      }

      const authenticated = await checkUserAuth();
      if (!authenticated) {
        setError("Your session could not be confirmed. Please try again.");
        return;
      }
      setMfaSetup(null);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Vantoris sign-in is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (phase === "onboarding") {
    return (
      <OnboardingCarousel
        onGetStarted={() => navigate("/register")}
        onSignIn={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />
    );
  }

  return (
    <AuthLayout
      title="Sign In to Your Account"
      footer={
        <span>
          Need to open an account?{" "}
          <Link to="/register" className="text-navy font-medium hover:underline">
            Get Started
          </Link>
        </span>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">Email address</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="email"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        {mfaSetup && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">Set up your Vantoris authenticator</p>
            <p className="mt-1 text-xs leading-5">Add this account in an authenticator app. This secret is displayed once; store it securely.</p>
            <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs">{mfaSetup.secret}</p>
            <p className="mt-2 break-all text-[11px] leading-4">{mfaSetup.otpauthUri}</p>
          </div>
        )}
        {(mfaRequired || mfaSetup) && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray">Authenticator code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white px-3 text-center text-lg tracking-[0.35em] text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberId}
            onChange={(e) => setRememberId(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy/20"
          />
          <span className="text-sm text-gray">Remember email address</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>
      <div className="flex flex-col gap-2 mt-5 text-center text-xs">
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Forgot User ID</Link>
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Forgot Password</Link>
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Need Help?</Link>
      </div>
    </AuthLayout>
  );
}
