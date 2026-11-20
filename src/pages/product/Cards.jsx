import React from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  Snowflake,
  SlidersHorizontal,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { useBankingRecords } from "@/hooks/useBankingRecords";
import {
  BankingPage,
  BankLoading,
  BankError,
  BankEmpty,
} from "@/components/banking/BankingUI";

export default function Cards() {
  const { cards, loading, error, retry } = useBankingRecords({ cards: true });
  return (
    <BankingPage
      title="Your cards"
      description="The details you need. A little peace of mind in your pocket."
    >
      {loading ? (
        <BankLoading />
      ) : error ? (
        <BankError onRetry={retry} />
      ) : (
        <div className="bank-grid">
          <section className="bank-card">
            {cards.length ? (
              cards.map((card) => (
                <article key={card.id}>
                  <div className="bank-debit">
                    <div>
                      <b>vantoris.</b>
                      <CreditCard size={26} />
                    </div>
                    <p>
                      •••• •••• ••••{" "}
                      {String(card.last_four || card.last4 || "").slice(-4) ||
                        "••••"}
                    </p>
                    <div>
                      <small>{card.cardholder_name || "CARD ON FILE"}</small>
                      <small>
                        {String(card.card_type || "Card").toUpperCase()}
                      </small>
                    </div>
                  </div>
                  <dl className="bank-review">
                    <div>
                      <dt>Status on file</dt>
                      <dd>{card.status || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Card type</dt>
                      <dd>{card.card_type || card.brand || "Not provided"}</dd>
                    </div>
                  </dl>
                </article>
              ))
            ) : (
              <BankEmpty
                title="Your next everyday companion."
                action={
                  <Link className="bank-button" to="/support">
                    Ask about card availability <ArrowUpRight size={16} />
                  </Link>
                }
              >
                No cards are linked to your membership yet. We can help you
                check eligibility and available options.
              </BankEmpty>
            )}
            <div className="bank-notice">
              <strong>Card controls are not enabled yet.</strong>Freezing,
              replacing, issuing cards, and changing spending limits require an
              enabled card service. Contact support if your card is lost or
              something looks wrong.
            </div>
            <div className="bank-action-list">
              {[
                [
                  Snowflake,
                  "Freeze or replace a card",
                  "Get help with a missing or compromised card.",
                ],
                [
                  SlidersHorizontal,
                  "Spending controls",
                  "Ask which controls are available for your card.",
                ],
              ].map(([Icon, title, copy]) => (
                <Link className="bank-action-item" to="/support" key={title}>
                  <Icon size={21} />
                  <span className="bank-row-copy">
                    <strong>{title}</strong>
                    <small>{copy}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </section>
          <aside>
            <div className="bank-help-card">
              <ShieldCheck size={26} />
              <h2>
                A few good habits
                <br />
                go a long way.
              </h2>
              <p>
                Keep your PIN private, check your activity regularly, and report
                unfamiliar transactions promptly.
              </p>
              <Link className="bank-text-link" to="/transactions">
                Review your activity <ArrowUpRight size={16} />
              </Link>
            </div>
            <Link to="/support" className="bank-action-item">
              <MessageCircle size={22} />
              <span className="bank-row-copy">
                <strong>Need a hand?</strong>
                <small>Find your support options.</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>
      )}
    </BankingPage>
  );
}
