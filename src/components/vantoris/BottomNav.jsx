import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Landmark, CreditCard, ArrowLeftRight, Menu } from "lucide-react";
import { useTabHistory } from "@/lib/TabHistoryContext";

const ITEMS = [
  {
    id: "home",
    label: "Home",
    to: "/",
    Icon: Home,
    match: (p) => p === "/" || p === "",
  },
  {
    id: "money",
    label: "Money",
    to: "/money",
    Icon: Landmark,
    match: (p) =>
      p.startsWith("/money") ||
      p.startsWith("/accounts") ||
      p.startsWith("/qr"),
  },
  {
    id: "pay",
    label: "Pay & transfer",
    to: "/move-money",
    Icon: ArrowLeftRight,
    match: (p) => p.startsWith("/move-money"),
  },
  {
    id: "cards",
    label: "Cards",
    to: "/cards",
    Icon: CreditCard,
    match: (p) => p.startsWith("/cards") || p.startsWith("/services"),
  },
  {
    id: "more",
    label: "More",
    to: "/more",
    Icon: Menu,
    match: (p) =>
      [
        "/more",
        "/travel",
        "/homes",
        "/news",
        "/ask",
        "/profile",
        "/support",
        "/discover",
      ].some((x) => p.startsWith(x)),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const tabHistory = useTabHistory();
  const remember = tabHistory?.remember || (() => {});
  const path = location.pathname;

  return (
    <nav
      className="member-bottom-nav fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <div className="mx-auto max-w-[430px] px-3 pb-2">
        <div className="flex items-center justify-around rounded-2xl border border-slate-200/90 bg-white/95 px-1 pt-1.5 pb-1 shadow-[0_-4px_24px_rgba(7,28,56,0.08)] backdrop-blur-xl">
          {ITEMS.map((item) => {
            const isActive = item.match(path);
            const Icon = item.Icon;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                key={item.id}
                to={item.to}
                onClick={() => remember(item.to)}
                className={`relative flex h-[52px] min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-xl ${isActive ? "text-navy" : "text-slate-500"}`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-navy/[0.06]" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.7}
                  className="relative z-[1]"
                />
                <span
                  className={`relative z-[1] text-[10px] ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
