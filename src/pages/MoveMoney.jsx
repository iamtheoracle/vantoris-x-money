import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Landmark,
  Plus,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  FileText,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/formatCurrency";
import { useBankingRecords } from "@/hooks/useBankingRecords";
import { dollarsToCents, validRoutingNumber } from "@/lib/banking-experience";
import {
  BankingPage,
  BankLoading,
  BankError,
  BankDialog,
  BankEmpty,
} from "@/components/banking/BankingUI";

const actions = [
  {
    id: "bank-transfer",
    title: "Transfer to a U.S. bank",
    description: "Prepare an ACH or domestic wire request.",
    status: "Request review",
    Icon: Landmark,
  },
  {
    id: "send",
    title: "Send money to someone",
    description: "Pay people you know and trust.",
    status: "Not available yet",
    Icon: ArrowUpRight,
  },
  {
    id: "request",
    title: "Request money",
    description: "Ask someone to pay you back.",
    status: "Not available yet",
    Icon: ArrowDownLeft,
  },
  {
    id: "deposit",
    title: "Add money",
    description: "Explore deposit and funding options.",
    status: "Not available yet",
    Icon: Plus,
  },
];
const unavailable = {
  send: [
    "Sending money isn’t available yet.",
    "Person-to-person payments are not enabled for this experience. No money is sent from this screen.",
  ],
  request: [
    "Money requests aren’t available yet.",
    "Payment links and money requests are not enabled. You can still review your accounts and payment activity.",
  ],
  deposit: [
    "Deposit options are coming together.",
    "Electronic deposits and mobile check deposits are not enabled here. Contact support to confirm funding options for your account.",
  ],
};
export default function MoveMoney() {
  const { accounts, loading, error, retry } = useBankingRecords();
  const [params, setParams] = useSearchParams();
  const rawAction = params.get("action");
  const action = rawAction === "add" ? "deposit" : rawAction;
  const openAction = (id) => {
    const next = new URLSearchParams(params);
    next.set("action", id);
    setParams(next);
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("action");
    setParams(next, { replace: true });
  };
  return (
    <BankingPage
      title="Pay & transfer"
      description="Your money has places to be. Choose how it gets there."
      action={
        <Link className="bank-text-link" to="/transactions">
          Activity <ArrowRight size={15} />
        </Link>
      }
    >
      <div className="bank-grid">
        <div>
          <section className="bank-card">
            <div className="bank-section-heading">
              <h2>What would you like to do?</h2>
            </div>
            <div className="bank-action-list">
              {actions.map(({ id, title, description, status, Icon }) => (
                <button
                  key={id}
                  className="bank-action-item"
                  onClick={() => openAction(id)}
                >
                  <span className="bank-account-icon">
                    <Icon size={21} />
                  </span>
                  <span className="bank-row-copy">
                    <strong>{title}</strong>
                    <small>
                      {description}
                      <br />
                      <span className="bank-label">{status}</span>
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          </section>
          {loading ? (
            <BankLoading />
          ) : error ? (
            <BankError onRetry={retry} />
          ) : (
            <div className="bank-notice">
              <strong>
                {accounts.length
                  ? `${accounts.length} account${accounts.length === 1 ? "" : "s"} on file`
                  : "No accounts linked yet"}
              </strong>
              {accounts.length
                ? "Bank-transfer requests go to review. A recorded request is not a completed payment."
                : "You need an eligible account before submitting a bank-transfer request."}{" "}
              <Link className="bank-text-link" to="/accounts">
                View accounts <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
        <aside>
          <div className="bank-help-card">
            <ShieldCheck size={26} />
            <h2>
              Pause. Check.
              <br />
              Then take the next step.
            </h2>
            <p>
              A bank will never ask you to transfer money to keep it “safe.”
              Confirm unexpected payment requests using a contact method you
              already trust.
            </p>
            <Link to="/support" className="bank-text-link">
              Something doesn’t look right? <ArrowRight size={15} />
            </Link>
          </div>
          <Link className="bank-action-item" to="/cards">
            <CreditCard size={22} />
            <span className="bank-row-copy">
              <strong>Looking for your card?</strong>
              <small>View your card details and availability.</small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
          <Link className="bank-action-item mt-3" to="/documents">
            <FileText size={22} />
            <span className="bank-row-copy">
              <strong>Find a statement</strong>
              <small>Visit your document centre.</small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
        </aside>
      </div>
      {action === "bank-transfer" && (
        <BankDialog
          open
          title="Bank-transfer request"
          description="Prepare your details, review them, then send a request for review."
          onClose={close}
        >
          {loading ? (
            <BankLoading />
          ) : error ? (
            <BankError onRetry={retry} />
          ) : (
            <TransferRequest
              accounts={accounts.filter(
                (account) => account.status === "active",
              )}
              onClose={close}
            />
          )}
        </BankDialog>
      )}
      {unavailable[action] && (
        <BankDialog
          open
          title={actions.find((item) => item.id === action)?.title}
          description="Availability for your member experience"
          onClose={close}
        >
          <BankEmpty
            title={unavailable[action][0]}
            action={
              <div className="bank-form-buttons">
                <button onClick={close} className="bank-button secondary">
                  Go back
                </button>
                <Link to="/support" className="bank-button">
                  Get help <ArrowRight size={16} />
                </Link>
              </div>
            }
          >
            {unavailable[action][1]}
          </BankEmpty>
        </BankDialog>
      )}
    </BankingPage>
  );
}
function TransferRequest({ accounts, onClose }) {
  const [details, setDetails] = useState({
    rail: "ACH",
    accountId: accounts[0]?.id || "",
    amount: "",
    beneficiary: "",
    bank: "",
    routing: "",
    last4: "",
    memo: "",
  });
  const [step, setStep] = useState("details");
  const stepHeading = useRef(null);
  useEffect(() => {
    if (step !== "details") stepHeading.current?.focus();
  }, [step]);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [reservation, setReservation] = useState(false);
  const [busy, setBusy] = useState(false);
  const submissionKey = useRef(null);
  const submitting = useRef(false);
  const update = (key, value) => {
    setDetails((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    submissionKey.current = null;
  };
  const account = accounts.find((item) => item.id === details.accountId);
  const cents = dollarsToCents(details.amount);
  function review(event) {
    event.preventDefault();
    const next = {};
    if (!account) next.accountId = "Choose an account.";
    if (cents === null)
      next.amount =
        "Enter an amount greater than zero, with up to two decimal places.";
    if (!details.beneficiary.trim())
      next.beneficiary = "Enter the recipient’s full name.";
    if (!details.bank.trim()) next.bank = "Enter the recipient’s bank name.";
    if (!validRoutingNumber(details.routing))
      next.routing = "Enter a valid 9-digit U.S. routing number.";
    if (!/^\d{4}$/.test(details.last4))
      next.last4 = "Enter the last four digits of the recipient’s account.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setFailure("");
    setStep("review");
  }
  async function submit() {
    if (submitting.current || !account || cents === null) return;
    submitting.current = true;
    setBusy(true);
    setFailure("");
    submissionKey.current ||= crypto.randomUUID();
    try {
      const response = await base44.functions.invoke("createTransferRequest", {
        rail: details.rail,
        source_account_id: details.accountId,
        amount_cents: cents,
        beneficiary_name: details.beneficiary.trim(),
        beneficiary_bank_name: details.bank.trim(),
        beneficiary_routing_number: details.routing,
        beneficiary_account_last4: details.last4,
        memo: details.memo.trim(),
        idempotency_key: submissionKey.current,
      });
      if (
        response?.status >= 400 ||
        response?.data?.error ||
        response?.data?.success === false ||
        !response?.data?.request?.id
      )
        throw new Error("Request was not confirmed");
      setReservation(response.data.funds_reserved === true);
      setStep("complete");
    } catch {
      setFailure(
        "We couldn’t confirm your request. Your details are still here. Retry this request or contact support before creating another one.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const field = (id, label, inputProps = {}) => (
    <div key={id}>
      <label htmlFor={`transfer-${id}`}>{label}</label>
      <input
        id={`transfer-${id}`}
        value={details[id]}
        onChange={(event) => update(id, event.target.value)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `error-${id}` : undefined}
        {...inputProps}
      />
      {errors[id] && (
        <p className="field-error" id={`error-${id}`}>
          {errors[id]}
        </p>
      )}
    </div>
  );
  if (!accounts.length)
    return (
      <BankEmpty
        title="An account comes first."
        action={
          <Link className="bank-button" to="/support">
            Get account help
          </Link>
        }
      >
        A linked, eligible account is required to submit a bank-transfer
        request.
      </BankEmpty>
    );
  if (step === "complete")
    return (
      <div className="bank-success" role="status">
        <CheckCircle2 size={48} />
        <h3 ref={stepHeading} tabIndex={-1}>
          Request recorded for review.
        </h3>
        <p>
          No bank payment has been sent.{" "}
          {reservation
            ? "The requested amount is reserved from available funds while the request is reviewed."
            : "Review the request with support to confirm any pending holds."}{" "}
          Your request still needs review and bank processing before a payment
          can be completed.
        </p>
        <button className="bank-button" onClick={onClose}>
          Back to payments <ArrowRight size={16} />
        </button>
      </div>
    );
  return (
    <>
      <div className="bank-steps" aria-label="Request progress">
        <span
          className={step === "details" ? "current" : ""}
          aria-current={step === "details" ? "step" : undefined}
        >
          01 / Details
        </span>
        <span
          className={step === "review" ? "current" : ""}
          aria-current={step === "review" ? "step" : undefined}
        >
          02 / Review
        </span>
        <span>03 / Request recorded</span>
      </div>
      {step === "details" ? (
        <form className="bank-form" onSubmit={review} noValidate>
          <div>
            <label htmlFor="transfer-rail">Transfer method</label>
            <select
              id="transfer-rail"
              value={details.rail}
              onChange={(event) => update("rail", event.target.value)}
            >
              <option value="ACH">ACH bank transfer</option>
              <option value="FEDWIRE">Domestic wire</option>
            </select>
          </div>
          <div>
            <label htmlFor="transfer-account">From account</label>
            <select
              id="transfer-account"
              value={details.accountId}
              onChange={(event) => update("accountId", event.target.value)}
            >
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.account_name || item.account_type} · ending{" "}
                  {String(item.account_number || "").slice(-4) ||
                    "not provided"}
                </option>
              ))}
            </select>
          </div>
          {field("amount", "Amount (USD)", {
            inputMode: "decimal",
            placeholder: "0.00",
            maxLength: 16,
          })}
          {field("beneficiary", "Recipient’s full name", {
            autoComplete: "off",
            maxLength: 120,
          })}
          {field("bank", "Recipient’s bank", { maxLength: 120 })}
          <div className="bank-form-grid">
            {field("routing", "Routing number", {
              inputMode: "numeric",
              maxLength: 9,
              placeholder: "9 digits",
            })}
            {field("last4", "Account last four", {
              inputMode: "numeric",
              maxLength: 4,
              placeholder: "4 digits",
            })}
          </div>
          {field("memo", "Memo (optional)", { maxLength: 140 })}
          <div className="bank-notice">
            <strong>A request, then a review.</strong>Submitting does not send a
            bank payment. The requested amount may be reserved from available
            funds pending review. Fees, timing, limits, and eligibility must be
            confirmed before bank processing.
          </div>
          <button className="bank-button" type="submit">
            Review request <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <div>
          <h3 ref={stepHeading} tabIndex={-1} className="sr-only">
            Review your bank-transfer request
          </h3>
          <dl className="bank-review">
            {[
              ["Amount", formatCurrency(cents / 100)],
              [
                "Method",
                details.rail === "ACH" ? "ACH bank transfer" : "Domestic wire",
              ],
              [
                "From",
                `${account?.account_name || account?.account_type} · •••• ${String(account?.account_number || "").slice(-4)}`,
              ],
              ["Recipient", details.beneficiary],
              ["Bank", details.bank],
              ["Routing number", details.routing],
              ["Account ending", details.last4],
              ["Memo", details.memo || "None"],
              ["Fees & timing", "Not quoted — confirm before authorization"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="bank-notice">
            <strong>Check every detail.</strong>This sends a request for review.
            It may reserve the requested amount from available funds. It does
            not authorize a bank payment or guarantee completion.
          </div>
          {failure && (
            <p className="bank-inline-error" role="alert">
              {failure}
            </p>
          )}
          <div className="bank-form-buttons">
            <button
              className="bank-button secondary"
              disabled={busy || !!failure}
              onClick={() => setStep("details")}
            >
              Edit details
            </button>
            <button className="bank-button" disabled={busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
