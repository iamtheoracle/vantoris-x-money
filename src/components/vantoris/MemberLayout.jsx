import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Home,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Menu,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import "@/components/banking/member-banking.css";
import { TabHistoryProvider } from "@/lib/TabHistoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import PageTransition from "./PageTransition";
import BottomNav from "./BottomNav";

import SessionTimeoutModal from "./SessionTimeoutModal";

export default function MemberLayout() {
  const { logout } = useAuth();

  const handleTimeout = () => {
    logout(true);
  };

  const { showWarning, extendSession, logoutNow } =
    useSessionTimeout(handleTimeout);

  return (
    <TabHistoryProvider>
      <div
        className="member-shell vantoris-scroll"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
        }}
      >
        <aside className="member-side-nav">
          <Link className="member-brand" to="/">
            vantoris.
          </Link>
          <nav aria-label="Desktop navigation">
            {[
              [Home, "Overview", "/"],
              [Wallet, "Accounts", "/money"],
              [ArrowLeftRight, "Pay & transfer", "/move-money"],
              [CreditCard, "Cards", "/cards"],
              [Menu, "More", "/more"],
            ].map(([Icon, label, to]) => (
              <NavLink end={to === "/"} to={to} key={to}>
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
          <p>
            YOUR MONEY. MORE YOU.
            <br />A little clarity for your everyday.
          </p>
        </aside>
        <header className="member-topbar">
          <span>Your everyday, in view.</span>
          <div>
            <Link to="/profile">
              <ShieldCheck size={16} /> Profile
            </Link>
            <Link to="/support">
              <MessageCircle size={16} /> Help & support
            </Link>
          </div>
        </header>
        <div className="member-content">
          <div className="safe-top w-full mx-auto">
            <PageTransition />
          </div>
        </div>
        <BottomNav />

        <SessionTimeoutModal
          show={showWarning}
          onExtend={extendSession}
          onLogout={logoutNow}
        />
      </div>
    </TabHistoryProvider>
  );
}
