import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  Briefcase,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import "./banking.css";
import { formatCurrency } from "@/lib/formatCurrency";
const guides = {
  saving: {
    title: "Give your next goal a plan.",
    intro:
      "A buffer for the unexpected. A trip you’ve been thinking about. Start with a target and a little consistency.",
    steps: [
      [
        "Name your goal",
        "Decide what you’re saving for and when you’d like to get there. Keep short-term needs separate from longer-term goals.",
      ],
      [
        "Start with what you can sustain",
        "Leave room for essentials, debt payments, and unexpected costs before setting a monthly contribution.",
      ],
      [
        "Check in and adjust",
        "Review your progress regularly. A plan can change as your life does.",
      ],
    ],
  },
  borrowing: {
    title: "Look beyond the monthly payment.",
    intro:
      "A smaller payment can still cost more over time. Get a clear picture before you borrow.",
    steps: [
      [
        "Compare the APR",
        "Review the annual percentage rate, fees, repayment term, and total repayment amount together.",
      ],
      [
        "Know the terms",
        "Check for variable rates, late fees, prepayment penalties, and what happens if you miss a payment.",
      ],
      [
        "Keep some breathing room",
        "Consider your essential spending and emergency buffer before taking on another commitment.",
      ],
    ],
  },
  home: {
    title: "Make room for the whole picture.",
    intro:
      "A home budget is bigger than a purchase price. Bring the ongoing and upfront costs into view.",
    steps: [
      [
        "Upfront costs",
        "Plan for a down payment, closing costs, moving costs, and immediate repairs.",
      ],
      [
        "Your monthly costs",
        "Consider principal, interest, property taxes, homeowners insurance, utilities, maintenance, and any association fees.",
      ],
      [
        "Compare and prepare",
        "Review offers from licensed lenders, check loan estimates, and understand rate locks and closing disclosures.",
      ],
    ],
  },
  investing: {
    title: "Start with understanding.",
    intro:
      "Your goals, timeline, and comfort with risk matter more than the latest headline.",
    steps: [
      [
        "Match the timeline",
        "Money needed soon may not belong in volatile investments. Keep emergency needs in mind.",
      ],
      [
        "Spread the risk",
        "Diversification can reduce concentration risk, but it does not guarantee a profit or prevent losses.",
      ],
      [
        "Understand the costs",
        "Review management fees, transaction costs, tax implications, and the provider’s disclosures. Investments can lose value.",
      ],
    ],
  },
  workplace: {
    title: "More clarity. At work, too.",
    intro:
      "Financial benefits can mean more than a retirement account. Know what to ask your employer about.",
    steps: [
      [
        "Explore the benefits you have",
        "Ask HR about emergency savings, education resources, tuition reimbursement, and student-loan assistance. Availability depends on your employer’s plan.",
      ],
      [
        "Understand the conditions",
        "Check eligibility, contribution limits, waiting periods, document requirements, and what happens when you leave your employer.",
      ],
      [
        "Keep personal and work details distinct",
        "Use your employer’s official benefits portal. Check how personal information is shared, and ask a qualified adviser about current tax treatment.",
      ],
    ],
  },
  security: {
    title: "A few habits that protect a lot.",
    intro:
      "When a message creates urgency, slow down. Give yourself time to check the details.",
    steps: [
      [
        "Verify the request",
        "Use an official app or a contact method you already trust. Don’t rely on the phone number or link in an unexpected message.",
      ],
      [
        "Keep codes private",
        "Never share passwords, PINs, or one-time codes. No one needs your code to help keep your money safe.",
      ],
      [
        "Watch for pressure",
        "Be cautious of demands to move money to a “safe” account, pay in gift cards, or keep a transaction secret. Report concerns promptly.",
      ],
    ],
  },
};
export default function Learn() {
  const [params, setParams] = useSearchParams();
  const topic = guides[params.get("topic")] ? params.get("topic") : "saving";
  const guide = guides[topic];
  const [target, setTarget] = useState(""),
    [saved, setSaved] = useState(""),
    [months, setMonths] = useState("");
  const [calculated, setCalculated] = useState(false);
  const goal = Number(target),
    current = Number(saved || 0),
    duration = Number(months);
  const valid =
    target.trim() !== "" &&
    goal > 0 &&
    current >= 0 &&
    duration >= 1 &&
    Number.isInteger(duration) &&
    [goal, current, duration].every(Number.isFinite);
  const monthly = valid ? Math.max(0, goal - current) / duration : null;
  const update = (setter) => (event) => {
    setter(event.target.value);
    setCalculated(false);
  };
  return (
    <div className="banking-site learn-site">
      <header className="banking-header">
        <Link className="wordmark" to="/welcome">
          vantoris.
        </Link>
        <Link className="quiet-link" to="/welcome">
          <ArrowLeft size={16} /> Back to explore
        </Link>
      </header>
      <main className="learn-main">
        <div className="learn-intro">
          <span className="eyebrow">MONEY, MADE A LITTLE CLEARER.</span>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
        </div>
        <nav className="catalogue-tabs" aria-label="Learning topics">
          {[
            ["saving", "Saving"],
            ["borrowing", "Borrowing"],
            ["home", "Home planning"],
            ["investing", "Investing"],
            ["workplace", "At work"],
            ["security", "Security"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={topic === id}
              onClick={() => setParams({ topic: id })}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="learn-grid">
          <section className="learn-steps" aria-label="Getting started">
            {guide.steps.map(([title, copy], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </section>
          <aside>
            {topic === "saving" ? (
              <form
                className="learn-calculator"
                onSubmit={(event) => {
                  event.preventDefault();
                  setCalculated(true);
                }}
                noValidate
              >
                <Calculator size={28} />
                <h2>
                  A goal. A timeframe.
                  <br />
                  Your starting point.
                </h2>
                <label htmlFor="saving-target">Your savings goal ($)</label>
                <input
                  id="saving-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={target}
                  onChange={update(setTarget)}
                  placeholder="What are you aiming for?"
                />
                <label htmlFor="saving-current">Already saved ($)</label>
                <input
                  id="saving-current"
                  type="number"
                  min="0"
                  step="0.01"
                  value={saved}
                  onChange={update(setSaved)}
                  placeholder="0.00"
                />
                <label htmlFor="saving-months">Months to save</label>
                <input
                  id="saving-months"
                  type="number"
                  min="1"
                  step="1"
                  value={months}
                  onChange={update(setMonths)}
                  placeholder="Your timeframe"
                />
                <button type="submit" className="pill pill-dark">
                  Calculate my plan <ArrowRight size={17} />
                </button>
                {calculated &&
                  (valid ? (
                    <div className="calculator-result" role="status">
                      <span>Monthly savings target</span>
                      <strong>{formatCurrency(monthly)}</strong>
                      <p>
                        {monthly === 0
                          ? "Your current savings already cover this goal."
                          : `Set aside this amount each month for ${duration} month${duration === 1 ? "" : "s"}.`}
                      </p>
                    </div>
                  ) : (
                    <p className="calculator-error" role="alert">
                      Enter a positive savings goal, a non-negative current
                      amount, and a whole number of months.
                    </p>
                  ))}
                <small>
                  Illustration only. Assumes equal monthly contributions, no
                  interest, fees, taxes, or withdrawals. Nothing is saved or
                  moved.
                </small>
              </form>
            ) : (
              <div className="learn-callout">
                {topic === "workplace" ? (
                  <Briefcase size={30} />
                ) : topic === "security" ? (
                  <ShieldCheck size={30} />
                ) : (
                  <BookOpen size={30} />
                )}
                <h2>
                  {topic === "workplace"
                    ? "Start with a conversation."
                    : "Take your next step with context."}
                </h2>
                <p>
                  {topic === "workplace"
                    ? "Ask your HR or benefits team which programmes are available and how to enrol. Vantoris does not currently provide employer-code verification or administer these benefits."
                    : "These guides are a starting point. Product availability and suitability depend on your circumstances and the provider’s terms."}
                </p>
                <Link className="pill pill-dark" to="/welcome#explore">
                  Explore more <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </aside>
        </div>
        <div className="learn-disclosure">
          <Check size={19} />
          <p>
            General education, not personalised financial, tax, legal, or
            investment advice. No lending, investing, or employer-benefit
            application is submitted through this page.
          </p>
        </div>
      </main>
      <footer className="banking-footer">
        <Link className="wordmark" to="/welcome">
          vantoris.
        </Link>
        <Link to="/login">
          Member login <ArrowRight size={16} />
        </Link>
      </footer>
    </div>
  );
}
