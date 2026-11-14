import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/formatCurrency';
import { transactionPresentation } from '@/lib/transactionPresentation';
import FinancialHeritage from '@/components/vantoris/FinancialHeritage';
import FounderStories from '@/components/vantoris/FounderStories';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  Landmark,
  LogOut,
  Percent,
  Plus,
  Sparkles,
  QrCode,
} from 'lucide-react';

const HOME_PAYMENT_ACTIONS_ENABLED = false;

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'activity', label: 'Activity' },
];

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}




function accountLabel(a) {
  const type = (a.account_type || a.type || 'Account').replace(/_/g, ' ');
  const last4 = String(a.account_number || a.mask || '').slice(-4);
  return last4 ? `${type} ···${last4}` : type;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataIssues, setDataIssues] = useState({ accounts: false, cards: false, investments: false, activity: false });
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = ['account', 'rewards', 'activity'].includes(tabParam) ? tabParam : 'account';
  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'account') next.delete('tab');
    else next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  const { logout } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/member-auth?action=me', {
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Member data unavailable');
        const data = await response.json();
        if (!data?.member?.id || !Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
          throw new Error('Invalid Vantoris ledger response');
        }
        if (!cancelled) {
          setUser(data.member);
          setAccounts(data.accounts);
          setCards([]);
          setPortfolios([]);
          setTransactions(data.transactions);
          setDataIssues({ accounts: false, cards: true, investments: true, activity: false });
        }
      } catch {
        if (!cancelled) {
          setDataIssues({ accounts: true, cards: true, investments: true, activity: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const firstName = (() => {
    const raw =
      user?.first_name ||
      user?.given_name ||
      (user?.full_name && String(user.full_name).trim().split(/\s+/).filter(Boolean)[0]) ||
      '';
    let given = String(raw || '').trim();
    if (!given || given.includes('@')) return 'Member';
    if (!/\s/.test(given) && given === String(user?.email || '').split('@')[0]) return 'Member';
    given = given.split(/\s+/)[0];
    if (given.length < 2) return 'Member';
    return given.charAt(0).toUpperCase() + given.slice(1);
  })();
  const primaryAccount = accounts[0];

  function openQuick(mode) {
    navigate(`/move-money?action=${mode}`);
  }

  function handleSignOut() {
    logout(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F4]">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto bg-[#F4F6F9] text-navy relative">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 pt-3 pb-2 bg-[#F4F6F9]/95 backdrop-blur-md">
        <div className="w-9 lg:hidden" />
        <div className="text-center flex-1 lg:text-left">
          <h1 className="text-[17px] font-bold leading-tight text-navy">Home</h1>
          <p className="text-[13px] text-slate-500 flex items-center justify-center lg:justify-start gap-1.5">
            {firstName}
            <span className="inline-block w-1 h-1 rounded-full bg-brass" />
            Private client
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'Show balances' : 'Hide balances'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80"
          >
            {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/messages')}
            aria-label="Notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-[18px] py-2.5 rounded-full text-[15px] font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[#111111] text-white shadow-sm'
                : 'bg-white text-navy/70 border border-slate-200/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="px-4 lg:px-8 pb-28 w-full max-w-6xl mx-auto">
        {tab === 'account' && (
          <section>
            <div className="rounded-[24px] bg-white text-navy p-7 mb-5 border border-slate-200/80 shadow-[0_10px_34px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] text-slate-500 uppercase tracking-[0.16em] mb-2 font-semibold">Account overview</p>
              {dataIssues.accounts ? (
                <>
                  <p className="text-xl font-semibold">Account information unavailable</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">We could not retrieve your account records. No balance or account status has been changed.</p>
                </>
              ) : (
                <>
                  <p className="text-[30px] font-semibold tracking-tight tabular-nums leading-tight">
                    {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Individual recorded balances are shown by account below. A consolidated figure is withheld until currency and valuation sources are verified.</p>
                </>
              )}
              {dataIssues.investments ? (
                <p className="mt-4 pt-3 border-t border-slate-200 text-sm text-slate-600">Investment information is currently unavailable.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/investment')}
                  className="mt-4 pt-3 border-t border-slate-200 w-full text-left text-[13px] text-navy inline-flex items-center gap-1 font-medium"
                >
                  Open investment workspace
                  {portfolios.length > 0 ? ' · ' + portfolios.length + (portfolios.length === 1 ? ' portfolio' : ' portfolios') : ''}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="flex justify-center gap-5 sm:gap-8 mb-6 flex-wrap">
              {[
                { mode: 'deposit', label: 'Deposit', Icon: Plus },
                { mode: 'send', label: 'Send', Icon: ArrowUpRight },
                { mode: 'request', label: 'Request', Icon: ArrowDownLeft },
              ].map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => openQuick(mode)}
                  disabled={!HOME_PAYMENT_ACTIONS_ENABLED && mode !== 'send'}
                  title={!HOME_PAYMENT_ACTIONS_ENABLED && mode !== 'send' ? "Unavailable until a Vantoris internal workflow is available" : undefined}
                  className="flex flex-col items-center gap-2 text-[13px] font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-md active:scale-95 transition-transform ring-2 ring-brass/30">
                    <Icon size={22} strokeWidth={2.5} />
                  </span>
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('/qr')}
                disabled={!HOME_PAYMENT_ACTIONS_ENABLED}
                title={!HOME_PAYMENT_ACTIONS_ENABLED ? "QR payments are unavailable" : undefined}
                className="flex flex-col items-center gap-2 text-[13px] font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-md active:scale-95 transition-transform ring-2 ring-brass/30">
                  <QrCode size={22} strokeWidth={2.5} />
                </span>
                QR Pay
              </button>
            </div>
            <p className="mb-6 text-center text-[11px] leading-5 text-slate-500">Only internal member-to-member transfers are available. Deposits, requests, QR payments and external payment networks are disabled.</p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h2 className="text-[15px] font-bold text-navy">Your accounts</h2>
                <button
                  type="button"
                  onClick={() => navigate('/accounts')}
                  className="text-[13px] font-semibold text-navy/60 hover:text-navy"
                >
                  See all
                </button>
              </div>

              {dataIssues.accounts ? (
                <div role="status" className="rounded-[20px] bg-amber-50 border border-amber-200 p-5">
                  <p className="text-[15px] font-semibold text-amber-950">Account information could not be loaded</p>
                  <p className="text-[13px] text-amber-900/80 mt-1">This is a data-access error, not confirmation that you have no accounts. Please try again later or contact support.</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="rounded-[20px] bg-white border border-slate-200/80 p-5 text-center">
                  <p className="text-[15px] font-semibold text-navy">No accounts linked</p>
                  <p className="text-[13px] text-slate-500 mt-1">
                    Account records will appear here once they are linked to your membership.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(`/accounts/${a.id}`)}
                      className="w-full flex items-center gap-3 rounded-[18px] bg-white border border-slate-200/70 p-4 text-left shadow-sm hover:border-brass/40 transition-colors"
                    >
                      <span className="w-11 h-11 rounded-xl bg-navy/5 text-navy flex items-center justify-center shrink-0">
                        <Landmark size={20} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <strong className="block text-[15px] text-navy truncate capitalize">
                          {accountLabel(a)}
                        </strong>
                        <span className="text-[13px] text-slate-500">
                          {a.status ? String(a.status).replace(/_/g, ' ') : 'Status not supplied'}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-[16px] font-bold tabular-nums text-navy">
                          {hidden ? '••••••' : formatCurrency(a.balance, a.currency || a.currency_code || null)}
                        </span>
                        <ChevronRight size={16} className="text-slate-400 ml-auto mt-0.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-full flex items-center gap-3 rounded-[18px] bg-white border border-slate-200/70 p-4 mb-3 text-left shadow-sm"
            >
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Landmark size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <strong className="block text-[15px] text-navy">Account services</strong>
                <span className="text-[14px] text-slate-500 leading-snug">Review account records and available payment-request services.</span>
              </span>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setTab('rewards')}
                className="rounded-[18px] bg-white border border-slate-200/70 p-4 min-h-[132px] flex flex-col gap-2 text-left shadow-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Gift size={16} />
                </span>
                <strong className="text-[15px] text-navy">Cash back</strong>
                <p className="text-[13px] text-slate-500 leading-snug flex-1">View eligible offers when rewards are available for your account.</p>
              </button>
              <button
                type="button"
                onClick={() => setTab('rewards')}
                className="rounded-[18px] bg-white border border-slate-200/70 p-4 min-h-[132px] flex flex-col gap-2 text-left shadow-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-brass/15 text-brass flex items-center justify-center">
                  <Percent size={16} />
                </span>
                <strong className="text-[15px] text-navy">Interest</strong>
                <p className="text-[13px] text-slate-500 leading-snug flex-1">See applicable rates and terms when they have been confirmed.</p>
              </button>
            </div>

            {dataIssues.cards ? (
              <div role="status" className="w-full rounded-[18px] bg-amber-50 border border-amber-200 p-5 text-left mb-3">
                <p className="text-[12px] uppercase tracking-wider text-amber-800">Card services</p>
                <h2 className="text-lg font-semibold text-amber-950 mt-1">Card information unavailable</h2>
                <p className="text-[14px] text-amber-900/80 mt-1">We could not verify your current card status. This does not mean a card has not been issued.</p>
              </div>
            ) : cards.length > 0 ? (
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="w-full rounded-[18px] bg-gradient-to-r from-navy to-[#0E2A4A] text-white p-5 text-left mb-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={22} className="text-brass" />
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-white/60">Your card</p>
                    <h2 className="text-lg font-semibold mt-0.5">
                      {cards[0].card_type || 'Type not supplied'} ···
                      {String(cards[0].last_four || cards[0].card_number || '').slice(-4) || '••••'}
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold mt-3 text-brass">
                  View card services <ChevronRight size={16} />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="w-full rounded-[18px] bg-white border border-slate-200/70 p-5 text-left mb-3 shadow-sm"
              >
                <p className="text-[12px] uppercase tracking-wider text-slate-500">Card services</p>
                <h2 className="text-lg font-semibold text-navy mt-1">Card services</h2>
                <p className="text-[14px] text-slate-500 mt-1">
                  No card record was returned by the current source. Issuance and request availability have not been verified.
                </p>
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold mt-3 text-navy">
                  View card services <ChevronRight size={16} />
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3.5 text-[15px] font-semibold text-navy hover:bg-slate-50 active:scale-[0.99] transition"
            >
              <LogOut size={18} />
              Sign out
            </button>

            <p className="mt-4 text-[12px] text-slate-400 leading-relaxed text-center">
              Account information is derived from Vantoris's posted ledger. External payment services are not enabled.
            </p>
          </section>
        )}

        {tab === 'rewards' && (
          <section>
            <div className="rounded-[20px] bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 p-5 mb-3">
              <div className="flex gap-3 items-start mb-4">
                <span className="w-9 h-9 rounded-[10px] bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-navy">Cash back</h3>
                  <p className="text-[14px] text-slate-500 leading-snug mt-1">
                    Eligible cash-back offers and their terms will be displayed here when confirmed for your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="w-full rounded-full bg-navy text-white py-3.5 text-[15px] font-bold"
              >
                Explore rewards
              </button>
            </div>

            <div className="rounded-[20px] bg-white border border-slate-200/70 p-5 mb-3 shadow-sm">
              <div className="flex gap-3 items-start">
                <span className="w-9 h-9 rounded-[10px] bg-brass/15 text-brass flex items-center justify-center shrink-0">
                  <Percent size={18} />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-navy">Interest on cash</h3>
                  <p className="text-[14px] text-slate-500 leading-snug mt-1">
                    Applicable rates, eligibility and terms will be shown here once verified.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] bg-white border border-slate-200/70 p-5 shadow-sm">
              <div className="flex gap-3 items-start">
                <span className="w-9 h-9 rounded-[10px] bg-navy/8 text-navy flex items-center justify-center shrink-0">
                  <Gift size={18} />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-navy">Member perks</h3>
                  <p className="text-[14px] text-slate-500 leading-snug mt-1">
                    Member benefits and preferential services will appear here when available and confirmed.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'activity' && (
          <section>
            <h2 className="text-[15px] font-bold text-navy mb-3">Recent activity</h2>
            {dataIssues.activity ? (
              <div role="status" className="rounded-[20px] bg-amber-50 border border-amber-200 p-8 text-center">
                <p className="text-[15px] font-semibold text-amber-950">Activity unavailable</p>
                <p className="text-[13px] text-amber-900/80 mt-1">We could not retrieve recent activity. No transaction status has been changed.</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-[20px] bg-white border border-slate-200/70 p-8 text-center">
                <p className="text-[15px] font-semibold text-navy">No recent transactions</p>
                <p className="text-[13px] text-slate-500 mt-1">
                  Activity from your accounts will show up here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/accounts')}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy text-white px-5 py-2.5 text-[14px] font-semibold"
                >
                  <Plus size={16} /> View account services
                </button>
              </div>
            ) : (
              <div className="rounded-[18px] bg-white border border-slate-200/70 divide-y divide-slate-100 shadow-sm overflow-hidden">
                {transactions.map((tx) => {
                  const presentation = transactionPresentation(tx.amount, tx.type);
                  const label = tx.description || tx.type || 'Transaction';
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => {
                        const transactionAccount = accounts.find((account) => account.id === tx.account_id);
                        navigate(transactionAccount ? `/accounts/${transactionAccount.id}` : '/accounts');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80"
                    >
                      <span className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center text-[13px] font-bold text-navy shrink-0">
                        {initials(label)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <strong className="block text-[15px] text-navy truncate">{label}</strong>
                        <span className="text-[13px] text-slate-500">
                          {relativeDay(tx.created_date)}
                          {tx.type ? ` · ${tx.type}` : ''}
                        </span>
                      </span>
                      <span
                        className={`text-[15px] font-semibold tabular-nums shrink-0 ${presentation.tone}`}
                      >
                        {presentation.sign}
                        {formatCurrency(presentation.amount, tx.currency || tx.currency_code || null)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 pb-8 space-y-8">
        <FounderStories />
        <FinancialHeritage compact />
      </div>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[70] bg-navy text-white px-4 py-3 rounded-full text-[14px] font-semibold max-w-[90%] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
