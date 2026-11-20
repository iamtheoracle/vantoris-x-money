import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  GraduationCap,
  Home,
  Briefcase,
  ArrowUpRight,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
const products = [
  {
    title: "Everyday money",
    copy: "Keep accounts, payments, and activity in view.",
    category: "Everyday",
    icon: Wallet,
    to: "/login",
    label: "Explore your workspace",
    tone: "sage",
  },
  {
    title: "Cards",
    copy: "Card details and help, close at hand.",
    category: "Everyday",
    icon: CreditCard,
    to: "/login",
    label: "Explore card availability",
    tone: "sand",
  },
  {
    title: "Saving for something",
    copy: "Turn a future goal into a monthly plan.",
    category: "Planning ahead",
    icon: TrendingUp,
    to: "/learn?topic=saving",
    label: "Try the savings planner",
    tone: "sage",
  },
  {
    title: "Borrow with perspective",
    copy: "Understand costs before taking on debt.",
    category: "Planning ahead",
    icon: GraduationCap,
    to: "/learn?topic=borrowing",
    label: "Explore borrowing basics",
    tone: "sand",
  },
  {
    title: "A place of your own",
    copy: "Get familiar with the costs of buying a home.",
    category: "Planning ahead",
    icon: Home,
    to: "/learn?topic=home",
    label: "Explore home planning",
    tone: "sand",
  },
  {
    title: "Your financial wellbeing",
    copy: "Make the most of workplace benefit conversations.",
    category: "At work",
    icon: Briefcase,
    to: "/learn?topic=workplace",
    label: "Explore workplace benefits",
    tone: "sage",
  },
  {
    title: "Investing, understood",
    copy: "Start with the relationship between risk and return.",
    category: "Planning ahead",
    icon: BookOpen,
    to: "/learn?topic=investing",
    label: "Learn the essentials",
    tone: "sage",
  },
  {
    title: "Safer money habits",
    copy: "Know the signals. Protect what matters.",
    category: "Everyday",
    icon: ShieldCheck,
    to: "/learn?topic=security",
    label: "Build your checklist",
    tone: "sand",
  },
];
export default function ProductCatalogue() {
  const [category, setCategory] = useState("All");
  const visible = products.filter(
    (product) => category === "All" || product.category === category,
  );
  return (
    <section className="product-catalogue" id="explore">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ONE PLACE. MORE POSSIBILITIES.</span>
          <h2>What’s next for you?</h2>
        </div>
        <p>
          Everyday essentials. Bigger plans. Find a useful place to start,
          wherever you are today.
        </p>
      </div>
      <div className="catalogue-tabs" aria-label="Explore categories">
        {["All", "Everyday", "Planning ahead", "At work"].map((tab) => (
          <button
            key={tab}
            onClick={() => setCategory(tab)}
            aria-pressed={category === tab}
          >
            {tab}
          </button>
        ))}
      </div>
      <p className="catalogue-count" role="status">
        {visible.length} ways to explore
      </p>
      <div className="catalogue-grid">
        {visible.map(({ title, copy, icon: Icon, to, label, tone }) => (
          <Link className={`catalogue-item ${tone}`} key={title} to={to}>
            <span className="catalogue-icon">
              <Icon size={25} />
            </span>
            <h3>{title}</h3>
            <p>{copy}</p>
            <span className="catalogue-link">
              {label}
              <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
      <p className="catalogue-footnote">
        Planning tools and guides are educational. They are not applications,
        loan offers, investment recommendations, or confirmation of an employer
        benefit.
      </p>
    </section>
  );
}
