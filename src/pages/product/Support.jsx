import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  CreditCard,
  Landmark,
  FileText,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { BankingPage } from "@/components/banking/BankingUI";
const topics = [
  [
    "A payment is pending. What happens next?",
    "Pending means a payment or request has not reached a final state. Check its status in Activity. A submitted bank-transfer request still requires review and bank processing; it is not a completed payment.",
  ],
  [
    "How do I add money?",
    "Open Pay & transfer and choose Add money to check availability. Electronic and check deposits are not enabled here yet. Ask support which funding options are available for your account.",
  ],
  [
    "How do I find my account details?",
    "Open Accounts, choose an account, and review its details. Only share account and routing information with people or organisations you trust.",
  ],
  [
    "I don’t recognise a transaction.",
    "Review the date, description, amount, and status in Activity. Contact support promptly through Messages if it is still unfamiliar. Never share a password or one-time code.",
  ],
];
export default function Support() {
  const [expanded, setExpanded] = useState(null);
  return (
    <BankingPage
      title="A little help, right here."
      description="Find an answer or start a conversation. Let’s get you moving."
    >
      <div className="bank-grid">
        <div>
          <section className="bank-card">
            <div className="bank-section-heading">
              <h2>How can we help?</h2>
            </div>
            <div className="bank-action-list">
              {[
                [Landmark, "Accounts & payments", "/move-money"],
                [CreditCard, "Cards & card availability", "/cards"],
                [FileText, "Statements & documents", "/documents"],
              ].map(([Icon, label, to]) => (
                <Link className="bank-action-item" key={to} to={to}>
                  <Icon size={21} />
                  <span className="bank-row-copy">
                    <strong>{label}</strong>
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          </section>
          <section className="bank-card">
            <h2 className="text-lg font-semibold mb-3">
              Good questions. Clear answers.
            </h2>
            {topics.map(([question, answer], i) => (
              <div
                key={question}
                className="border-b border-[#e5eade] last:border-0"
              >
                <h3>
                  <button
                    className="w-full flex items-center justify-between gap-4 text-left text-[13px] font-semibold py-5"
                    aria-expanded={expanded === i}
                    aria-controls={`support-answer-${i}`}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    {question}
                    <ChevronDown size={17} className="shrink-0" />
                  </button>
                </h3>
                <p
                  id={`support-answer-${i}`}
                  hidden={expanded !== i}
                  className="text-xs leading-7 text-[#697c64] pb-5"
                >
                  {answer}
                </p>
              </div>
            ))}
          </section>
        </div>
        <aside>
          <div className="bank-help-card">
            <MessageCircle size={27} />
            <h2>
              Some things are
              <br />
              better talked through.
            </h2>
            <p>
              Open your member messages to contact the support team and follow
              your conversations.
            </p>
            <Link to="/messages" className="bank-button">
              Go to messages <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="bank-notice">
            <ShieldCheck size={22} className="mb-3" />
            <strong>Keep your information yours.</strong>Don’t share passwords,
            PINs, full card details, or verification codes in a support message.
          </div>
        </aside>
      </div>
    </BankingPage>
  );
}
