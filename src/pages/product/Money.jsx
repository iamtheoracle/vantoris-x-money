import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  FileText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useBankingRecords } from "@/hooks/useBankingRecords";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  BankingPage,
  BankLoading,
  BankError,
  BankEmpty,
  AccountRow,
  ActivityRow,
} from "@/components/banking/BankingUI";

export default function Money({ accountsOnly = false, overview = false }) {
  const { accounts, transactions, loading, error, activityError, retry } =
    useBankingRecords({ activity: !accountsOnly });
  const [hidden, setHidden] = useState(false);
  const hasCompleteBalance =
    accounts.length > 0 &&
    accounts.every(
      (account) =>
        account.balance != null && Number.isFinite(Number(account.balance)),
    );
  const balance = accounts.reduce(
    (sum, account) => sum + (Number(account.balance) || 0),
    0,
  );
  return (
    <BankingPage
      title={
        overview
          ? "Good to see you."
          : accountsOnly
            ? "Your accounts"
            : "Your money, in view."
      }
      description={
        overview
          ? "Your everyday money. One clear place to start."
          : accountsOnly
            ? "Your accounts, balances, and details. All together."
            : "A clear view of today. A little more room for tomorrow."
      }
      action={
        <Link
          className="bank-icon-button"
          aria-label="Account documents"
          to="/documents"
        >
          <FileText size={19} />
        </Link>
      }
    >
      {loading ? (
        <BankLoading />
      ) : error ? (
        <BankError onRetry={retry} />
      ) : (
        <div className="bank-grid">
          <div>
            <section className="bank-card bank-balance">
              <div className="bank-balance-label">
                <p>Recorded account balance · USD</p>
                <button
                  className="bank-icon-button"
                  onClick={() => setHidden((value) => !value)}
                  aria-label={hidden ? "Show balances" : "Hide balances"}
                >
                  {hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
              <strong className="bank-balance-number">
                {hidden
                  ? "••••••"
                  : hasCompleteBalance
                    ? formatCurrency(balance)
                    : "—"}
              </strong>
              <small>
                {accounts.length
                  ? `Across ${accounts.length} account${accounts.length === 1 ? "" : "s"} · Check account details before a transfer`
                  : "Your balance appears when an account is linked."}
              </small>
            </section>
            <nav className="bank-actions" aria-label="Money actions">
              {[
                ["/move-money?action=send", "Send", ArrowUpRight],
                ["/move-money?action=request", "Request", ArrowDownLeft],
                ["/move-money?action=deposit", "Add money", Plus],
                ["/move-money?action=bank-transfer", "Transfer", ArrowRight],
              ].map(([to, label, Icon]) => (
                <Link key={label} to={to}>
                  <i>
                    <Icon size={21} />
                  </i>
                  {label}
                </Link>
              ))}
            </nav>
            <section className="bank-card">
              <div className="bank-section-heading">
                <h2>Your accounts</h2>
                <span className="bank-label">{accounts.length} linked</span>
              </div>
              {accounts.length ? (
                accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    hidden={hidden}
                  />
                ))
              ) : (
                <BankEmpty
                  title="Make yourself at home."
                  action={
                    <Link to="/support" className="bank-button secondary">
                      Get account help <ArrowRight size={15} />
                    </Link>
                  }
                >
                  Your account details appear here once they’re available. Need
                  a hand with your membership?
                </BankEmpty>
              )}
            </section>
            {!accountsOnly && (
              <section className="bank-card">
                <div className="bank-section-heading">
                  <h2>Recent activity</h2>
                  <Link className="bank-text-link" to="/transactions">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
                {activityError ? (
                  <BankError onRetry={retry} />
                ) : transactions.length ? (
                  transactions
                    .slice(0, 5)
                    .map((tx) => <ActivityRow key={tx.id} transaction={tx} />)
                ) : (
                  <BankEmpty title="A fresh start.">
                    Your payments and deposits appear here as they’re recorded.
                  </BankEmpty>
                )}
              </section>
            )}
          </div>
          <aside>
            {overview && (
              <div className="bank-help-card">
                <h2>Your next goal starts with a number.</h2>
                <p>
                  Put a timeframe around something you’re saving for. Our
                  planner helps you find a monthly starting point.
                </p>
                <Link className="bank-text-link" to="/learn?topic=saving">
                  Make a savings plan <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
            <div className="bank-help-card">
              <Wallet size={25} />
              <h2>
                Your next move,
                <br />
                made simpler.
              </h2>
              <p>
                Find bank transfers, money requests, and ways to add money in
                one place. See what’s available before you begin.
              </p>
              <Link className="bank-button" to="/move-money">
                Pay & transfer <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="bank-card">
              <ShieldCheck size={23} />
              <h2 className="mt-4 text-lg font-semibold">
                A moment to double-check.
              </h2>
              <p className="bank-description">
                Know the recipient. Check the details. Only send money to people
                and businesses you trust.
              </p>
              <Link className="bank-text-link mt-4" to="/support">
                Get help with a payment <ArrowRight size={14} />
              </Link>
            </div>
            <Link className="bank-action-item" to="/documents">
              <FileText size={23} />
              <span className="bank-row-copy">
                <strong>Statements & documents</strong>
                <small>Your account paperwork, in one place.</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          </aside>
        </div>
      )}
    </BankingPage>
  );
}
