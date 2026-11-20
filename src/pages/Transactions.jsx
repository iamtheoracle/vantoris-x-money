import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import { useBankingRecords } from "@/hooks/useBankingRecords";
import { filterActivity } from "@/lib/banking-experience";
import {
  BankingPage,
  BankLoading,
  BankError,
  BankEmpty,
  ActivityRow,
} from "@/components/banking/BankingUI";

export default function Transactions() {
  const { transactions, loading, error, activityError, retry } =
    useBankingRecords({ activity: true });
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [period, setPeriod] = useState("all"),
    [page, setPage] = useState(0);
  const filtered = useMemo(
    () => filterActivity(transactions, { query, status, period }),
    [transactions, query, status, period],
  );
  const count = Math.max(1, Math.ceil(filtered.length / 15));
  const current = Math.min(page, count - 1);
  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };
  return (
    <BankingPage
      title="Your activity"
      description="Find a payment, check its status, or take a closer look."
      action={
        <Link className="bank-button secondary" to="/move-money">
          Pay & transfer <ArrowUpRight size={16} />
        </Link>
      }
    >
      {loading ? (
        <BankLoading />
      ) : error || activityError ? (
        <BankError onRetry={retry} />
      ) : (
        <section className="bank-card">
          <div className="bank-filter">
            <div>
              <label htmlFor="activity-query">Search activity</label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3 top-4 text-[#6c8166]"
                />
                <input
                  id="activity-query"
                  value={query}
                  onChange={change(setQuery)}
                  placeholder="Search a name or description"
                  type="search"
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="activity-status">Status</label>
              <select
                id="activity-status"
                value={status}
                onChange={change(setStatus)}
              >
                <option value="all">All statuses</option>
                {[
                  ...new Set(
                    transactions.map((tx) => tx.status).filter(Boolean),
                  ),
                ].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="activity-period">Time period</label>
              <select
                id="activity-period"
                value={period}
                onChange={change(setPeriod)}
              >
                <option value="all">All loaded activity</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
          <p className="bank-eyebrow" role="status">
            {filtered.length} matching record{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.length ? (
            filtered
              .slice(current * 15, (current + 1) * 15)
              .map((tx) => <ActivityRow key={tx.id} transaction={tx} />)
          ) : (
            <BankEmpty
              title={
                transactions.length
                  ? "No matches this time."
                  : "Your story starts here."
              }
            >
              {transactions.length
                ? "Try another search or choose a different time period."
                : "Your payment and deposit activity appears here as it is recorded."}
            </BankEmpty>
          )}
          {filtered.length > 15 && (
            <nav className="bank-pagination" aria-label="Activity pages">
              <button
                className="bank-button secondary"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </button>
              <span>
                Page {current + 1} of {count}
              </span>
              <button
                className="bank-button secondary"
                disabled={current + 1 >= count}
                onClick={() => setPage(current + 1)}
              >
                Next
              </button>
            </nav>
          )}
          <p className="mt-5 text-[10px] leading-5 text-[#72816a]">
            Shows up to the latest 100 records per linked account. For older
            activity, check your statements.
          </p>
        </section>
      )}
    </BankingPage>
  );
}
