import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Gift } from "lucide-react";
import Money from "./product/Money";
import { BankingPage } from "@/components/banking/BankingUI";

export default function Home() {
  const [params] = useSearchParams();
  if (params.get("tab") === "activity")
    return <Navigate to="/transactions" replace />;
  if (params.get("tab") === "rewards")
    return (
      <BankingPage
        title="Member benefits"
        description="Good things start with knowing what’s available."
      >
        <section className="bank-help-card">
          <Gift size={28} />
          <h2>Benefits depend on your account.</h2>
          <p>
            No cashback, interest rate, or offer is confirmed here. Review your
            account terms or ask support to check your eligibility.
          </p>
          <Link className="bank-button" to="/support">
            Check benefit availability <ArrowRight size={17} />
          </Link>
        </section>
      </BankingPage>
    );
  return <Money overview />;
}
