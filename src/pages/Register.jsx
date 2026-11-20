import React, { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import StepProgress from "@/components/auth/StepProgress";
import ProductSelection, { PRODUCTS } from "@/components/auth/ProductSelection";
import ApplicationStatus from "@/components/auth/ApplicationStatus";
import StepPersonalInfo from "@/components/auth/StepPersonalInfo";
import StepContactInfo from "@/components/auth/StepContactInfo";
import StepVerification from "@/components/auth/StepVerification";
import StepAddress from "@/components/auth/StepAddress";
import StepIdentity from "@/components/auth/StepIdentity";
import StepFinancial from "@/components/auth/StepFinancial";
import StepSecurity from "@/components/auth/StepSecurity";
import StepReview from "@/components/auth/StepReview";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const INITIAL_DATA = {
  firstName: "", middleName: "", lastName: "", suffix: "", dob: "",
  email: "", phone: "",
  street: "", apt: "", city: "", state: "", zip: "", country: "US",
  ssn: "", govId: null, govIdFront: null, govIdBack: null, selfie: null,
  employment: "", employer: "", occupation: "", annualIncome: "", sourceOfFunds: "",
  userId: "", password: "", confirmPassword: "", securityPin: "", faceId: false,
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [phase, setPhase] = useState("products");
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [consents, setConsents] = useState({ regulatory: false, privacy: false, electronic: false });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const submittingRef = useRef(false);

  const updateData = useCallback((updates) => setData((prev) => ({ ...prev, ...updates })), []);

  function deriveUsernameFromEmail(email) {
    if (!email) return "";
    return email.split("@")[0];
  }

  function handleBack() {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      setPhase("products");
    }
  }

  function isStepValid() {
    switch (step) {
      case 1: return data.firstName && data.lastName && data.dob;
      case 2: return data.email && data.phone;
      case 3: return !!data.phone;
      case 4: return data.street && data.city && data.state && data.zip && data.country;
      case 5: return data.ssn && data.govIdFront && data.selfie;
      case 6: return data.employment && data.annualIncome && data.sourceOfFunds;
      case 7: return data.userId && data.password && data.confirmPassword && data.securityPin && data.password === data.confirmPassword;
      case 8: return consents.regulatory && consents.privacy && consents.electronic;
      default: return true;
    }
  }

  async function handleNext() {
    setError("");
    if (step < 7) {
      if (step === 6) {
        updateData({ userId: data.userId || deriveUsernameFromEmail(data.email) });
      }
      setStep(step + 1);
      return;
    }
    if (step === 7) {
      if (!/^[a-zA-Z0-9_]{3,}$/.test(data.userId)) {
        setError("User ID must be at least 3 characters and contain only letters, numbers, and underscores.");
        return;
      }
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (data.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!/[a-zA-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
        setError("Password must contain at least one letter and one number.");
        return;
      }
      setLoading(true);
      try {
        await base44.auth.register({ email: data.email, password: data.password });
        setOtpSent(true);
      } catch (err) {
        setError(err.message || "Registration failed. This email may already be in use.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 8) {
      await handleSubmitApplication();
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: data.email, otpCode });
      if (!result?.access_token) {
        setError("Verification completed but no session token was returned. Please try again.");
        return;
      }
      base44.setToken(result.access_token);
      base44.auth.setToken(result.access_token);
      try { await checkUserAuth(); } catch (_) {}
      await trackReferral();
      await base44.auth.updateMe({
        full_name: [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" "),
        username: data.userId,
      });
      setOtpSent(false);
      setStep(8);
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    try {
      await base44.auth.resendOtp(data.email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    }
  }

  async function trackReferral() {
    if (!refCode) return;
    try {
      const me = await base44.auth.me();
      const referrers = await base44.entities.User.filter({ referral_code: refCode });
      if (referrers.length > 0) {
        await base44.entities.Referral.create({
          referrer_id: referrers[0].id,
          referred_id: me.id,
          referred_email: data.email,
          referred_name: `${data.firstName} ${data.lastName}`,
          status: "completed",
        });
      }
    } catch (refErr) {
      console.error("Referral tracking failed:", refErr);
    }
  }

  async function createComplianceNotifications(userId, accountType) {
    const notifications = [
      {
        user_id: userId,
        title: "Identity Verification Required",
        message: `To activate your ${accountType} account, complete identity verification. Required: Government-issued photo ID, SSN or ITIN, proof of address, and selfie verification.`,
        type: "action",
      },
    ];
    if (accountType === "Joint") {
      notifications.push({
        user_id: userId,
        title: "Co-Applicant Verification Required",
        message: "Your Joint account requires co-applicant identity verification. Both account holders must complete KYC before activation.",
        type: "action",
      });
    }
    if (accountType === "Business") {
      notifications.push({
        user_id: userId,
        title: "Business Verification Required",
        message: "Your Business account requires enhanced verification: EIN, business formation documents, beneficial ownership disclosure, and authorized signer identification.",
        type: "action",
      });
    }
    notifications.push({
      user_id: userId,
      title: "Opening Deposit Required",
      message: `An opening deposit is required to activate your ${accountType} account. Visit the Opening Deposit section to submit your payment.`,
      type: "info",
    });
    for (const n of notifications) {
      try { await base44.entities.Notification.create(n); } catch (e) { console.error("Notification failed:", e); }
    }
  }

  async function handleSubmitApplication() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const me = await base44.auth.me();
      if (!me?.id) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      if (!selectedProduct?.accountType) {
        setError("Please select an account type before submitting.");
        return;
      }

      const fullName = [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" ");
      const fullAddress = [data.street, data.apt, data.city, `${data.state} ${data.zip}`, data.country].filter(Boolean).join(", ");
      const accountType = selectedProduct.accountType;

      // Upload KYC documents — ID front, ID back (optional), selfie
      const docUrls = [];
      for (const file of [data.govIdFront, data.govIdBack, data.selfie]) {
        if (file) {
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            docUrls.push(file_url);
          } catch (uploadErr) {
            setError("Failed to upload your documents. Please check your connection and try again.");
            return;
          }
        }
      }

      // Check for existing approved applications
      const approvedApps = await base44.entities.Application.filter({
        user_id: me.id,
        application_status: "approved",
      });
      const heldTypes = approvedApps.map((a) => a.account_type);

      // Already holds this type
      if (heldTypes.includes(accountType)) {
        setError("You already have an approved account of this type.");
        return;
      }

      // No approved apps — create Application (with idempotency)
      if (heldTypes.length === 0) {
        const existingPending = await base44.entities.Application.filter({
          user_id: me.id,
          account_type: accountType,
          application_status: "pending",
        });

        let application;
        if (existingPending.length > 0) {
          application = existingPending[0];
        } else {
          application = await base44.entities.Application.create({
            user_id: me.id,
            full_name: fullName,
            email: data.email,
            phone: data.phone,
            address: fullAddress,
            business_name: ["Business", "Institutional", "Organization"].includes(selectedProduct.label) ? data.employer || "" : "",
            account_type: accountType,
            kyc_status: "not_started",
            kyc_documents: docUrls,
            kyc_notes: JSON.stringify({
              product: selectedProduct.label,
              dob: data.dob,
              ssn: data.ssn,
              employment: data.employment,
              employer: data.employer,
              occupation: data.occupation,
              annualIncome: data.annualIncome,
              sourceOfFunds: data.sourceOfFunds,
              securityPin: data.securityPin ? "set" : "",
              faceId: data.faceId,
            }),
            application_status: "pending",
          });

          await createComplianceNotifications(me.id, accountType);
        }

        try {
          await base44.entities.Notification.create({
            user_id: me.id,
            title: "Application Received",
            message: `Your ${selectedProduct.label} application has been received and is under review. You will be notified once a determination has been made.`,
            type: "info",
          });
        } catch (e) { /* non-critical */ }

        setStatus({
          type: "review",
          reference: `VAN-${application.id.slice(-8).toUpperCase()}`,
        });
        setPhase("status");
        return;
      }

      // Holds other type(s) — create AccountEnquiry
      const existingEnquiries = await base44.entities.AccountEnquiry.filter({
        created_by_id: me.id,
        requested_product_type: accountType,
      });
      const openEnquiry = existingEnquiries.find((e) => e.status === "pending" || e.status === "in_review");

      if (openEnquiry) {
        setStatus({
          type: "enquiry",
          reference: `VAN-${openEnquiry.id.slice(-8).toUpperCase()}`,
        });
        setPhase("status");
        return;
      }

      const enquiry = await base44.entities.AccountEnquiry.create({
        requested_product_type: accountType,
        reason: "",
        status: "pending",
      });

      try {
        await base44.entities.Notification.create({
          user_id: me.id,
          title: "Enquiry Submitted",
          message: `Your enquiry for a ${accountType} account has been received and is under review.`,
          type: "info",
        });
      } catch (e) { /* non-critical */ }

      setStatus({
        type: "enquiry",
        reference: `VAN-${enquiry.id.slice(-8).toUpperCase()}`,
      });
      setPhase("status");
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("402") || err?.status === 402) {
        setError("A service dependency is temporarily unavailable. Please try again in a moment.");
      } else if (msg.includes("401") || err?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (msg.includes("409")) {
        setError("You already have an application of this type.");
      } else {
        setError(msg || "Failed to submit application. Please try again.");
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  if (phase === "products") {
    return (
      <AuthLayout
        bare
        footer={
          <span>
            Already a member?{" "}
            <Link to="/login" className="text-navy font-medium hover:underline">
              Sign In
            </Link>
          </span>
        }
      >
        <ProductSelection
          selected={selectedProduct}
          onSelect={setSelectedProduct}
          onBack={() => navigate("/login")}
        />
        {selectedProduct && (
          <button
            onClick={() => { setPhase("application"); setStep(1); }}
            className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 mt-6"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        )}
      </AuthLayout>
    );
  }

  if (phase === "status") {
    return (
      <AuthLayout bare>
        <ApplicationStatus status={status} onContinue={() => { window.location.href = "/"; }} />
      </AuthLayout>
    );
  }

  if (otpSent) {
    return (
      <AuthLayout title="Verify Your Email" subtitle={`We sent a verification code to ${data.email}`}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <button
          onClick={handleVerifyOtp}
          disabled={loading || otpCode.length < 6}
          className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify Code"}
        </button>
        <div className="flex items-center justify-between mt-4 text-xs">
          <button onClick={() => { setOtpSent(false); setError(""); }} className="text-gray hover:text-foreground">
            ← Back to form
          </button>
          <button onClick={handleResendOtp} className="text-navy font-medium hover:underline">
            Resend code
          </button>
        </div>
      </AuthLayout>
    );
  }

  const stepTitles = {
    1: "Personal Information",
    2: "Contact Information",
    3: "Verification",
    4: "Residential Address",
    5: "Identity Verification",
    6: "Financial Information",
    7: "Security",
    8: "Review & Submit",
  };

  return (
    <AuthLayout title={stepTitles[step]}>
      <StepProgress currentStep={step} />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        {step === 1 && <StepPersonalInfo data={data} updateData={updateData} />}
        {step === 2 && <StepContactInfo data={data} updateData={updateData} />}
        {step === 3 && <StepVerification data={data} />}
        {step === 4 && <StepAddress data={data} updateData={updateData} />}
        {step === 5 && <StepIdentity data={data} updateData={updateData} />}
        {step === 6 && <StepFinancial data={data} updateData={updateData} />}
        {step === 7 && <StepSecurity data={data} updateData={updateData} />}
        {step === 8 && (
          <StepReview
            data={data}
            product={selectedProduct}
            onEditStep={(s) => s === 0 ? setPhase("products") : setStep(s)}
            consents={consents}
            onConsentChange={(key, val) => setConsents((prev) => ({ ...prev, [key]: val }))}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray hover:text-foreground transition px-2"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid() || loading}
          className="flex-1 h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : step === 8 ? (
            <><ShieldCheck size={18} /> Submit Application</>
          ) : (
            <>Continue <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </AuthLayout>
  );
}