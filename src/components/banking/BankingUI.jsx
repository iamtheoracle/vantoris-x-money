import React from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Inbox,
  RefreshCw,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import "./member-banking.css";

export function BankingPage({
  eyebrow = "VANTORIS / EVERYDAY MONEY",
  title,
  description,
  action,
  children,
}) {
  return (
    <main className="bank-page">
      <header className="bank-page-heading">
        <div>
          <Link className="bank-back" to="/">
            <ArrowLeft size={16} /> Overview
          </Link>
          <p className="bank-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="bank-description">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </main>
  );
}
export function BankEmpty({ title, children, action }) {
  return (
    <div className="bank-empty">
      <span className="bank-empty-icon">
        <Inbox size={26} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function BankLoading() {
  return (
    <div
      role="status"
      aria-label="Loading your accounts"
      className="bank-loading"
    >
      <span className="sr-only">Loading your accounts…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
export function BankError({ onRetry }) {
  return (
    <div className="bank-error" role="alert">
      <h3>We couldn’t load your information.</h3>
      <p>
        Check your connection and try again. Your information hasn’t changed.
      </p>
      <button className="bank-button secondary" onClick={onRetry}>
        <RefreshCw size={16} /> Try again
      </button>
    </div>
  );
}
export function BankDialog({ title, description, open, onClose, children }) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="bank-overlay" />
        <Dialog.Content className="bank-dialog">
          <header>
            <div>
              <p className="bank-eyebrow">VANTORIS / PAY & TRANSFER</p>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="bank-icon-button" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function AccountRow({ account, hidden = false }) {
  const mask = String(account.account_number || account.mask || "").slice(-4);
  return (
    <Link className="bank-account-row" to={`/accounts/${account.id}`}>
      <span className="bank-account-icon">
        <Inbox size={21} />
      </span>
      <span className="bank-row-copy">
        <strong>
          {account.account_name ||
            String(account.account_type || "Account").replaceAll("_", " ")}
        </strong>
        <small>
          {mask ? `Ending in ${mask} · ` : ""}
          {account.status || "Status unavailable"}
        </small>
      </span>
      <span className="bank-row-amount">
        {hidden
          ? "••••••"
          : account.balance == null || !Number.isFinite(Number(account.balance))
            ? "—"
            : formatCurrency(account.balance)}
        <small>Recorded balance</small>
      </span>
      <ChevronRight size={17} />
    </Link>
  );
}
export function ActivityRow({ transaction: tx }) {
  const incoming = [
    "deposit",
    "credit",
    "transfer_in",
    "refund",
    "interest",
  ].includes(tx.type);
  const when = new Date(tx.created_date || tx.date);
  return (
    <div className="bank-activity-row">
      <span className={`bank-activity-icon ${incoming ? "incoming" : ""}`}>
        {incoming ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </span>
      <span className="bank-row-copy">
        <strong>
          {tx.description ||
            String(tx.type || "Transaction").replaceAll("_", " ")}
        </strong>
        <small>
          {Number.isNaN(when.getTime())
            ? "Date unavailable"
            : when.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
          · {String(tx.status || "Recorded").replaceAll("_", " ")}
        </small>
      </span>
      <strong className="bank-row-amount">{formatCurrency(tx.amount)}</strong>
    </div>
  );
}
