import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ArrowDownToLine, ArrowUpRight, PieChart, Signal, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';


// Investment mutations stay disabled until an authorized provider workflow is integrated.
const SERVER_INVESTMENT_OPERATIONS_ENABLED = false;

function formatPortfolioAmount(value, currency) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return 'Currency not supplied';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Value unavailable';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return 'Value unavailable'; }
}

export default function Investment() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [detailIssues, setDetailIssues] = useState({ transactions: false, deposits: false, withdrawals: false, signals: false });
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const submitting = false;
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const portfolios = await base44.entities.InvestmentPortfolio.filter({ user_id: me.id });
    if (!Array.isArray(portfolios)) throw new Error('Investment portfolio records were not returned in a valid format.');
    const portf = portfolios[0] || null;
    setPortfolio(portf);
    if (!portf) {
      setTransactions([]);
      setDepositRequests([]);
      setWithdrawalRequests([]);
      setSignals([]);
      setDetailIssues({ transactions: false, deposits: false, withdrawals: false, signals: false });
      return;
    }
    const safeList = async (request) => {
      try {
        const result = await request;
        return { items: Array.isArray(result) ? result : [], failed: !Array.isArray(result) };
      } catch {
        return { items: [], failed: true };
      }
    };
    const [txns, deps, wrs, sigs] = await Promise.all([
      safeList(base44.entities.InvestmentTransaction.filter({ portfolio_id: portf.id }, '-created_date', 20)),
      safeList(base44.entities.InvestmentDepositRequest.filter({ user_id: me.id }, '-created_date', 10)),
      safeList(base44.entities.InvestmentWithdrawalRequest.filter({ user_id: me.id }, '-created_date', 10)),
      safeList(base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5)),
    ]);
    setTransactions(txns.items);
    setDepositRequests(deps.items);
    setWithdrawalRequests(wrs.items);
    setSignals(sigs.items);
    setDetailIssues({ transactions: txns.failed, deposits: deps.failed, withdrawals: wrs.failed, signals: sigs.failed });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    loadData()
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData, loadAttempt]);

  function handleCreatePortfolio() {
    toast({
      title: 'Portfolio creation unavailable',
      description: 'No server-side portfolio creation workflow is enabled. No portfolio record was created.',
      variant: 'destructive',
    });
  }

  function handleDeposit() {
    toast({
      title: 'Investment funding unavailable',
      description: 'No server-side investment funding workflow is enabled. No deposit request or account balance was changed.',
      variant: 'destructive',
    });
  }

  function handleWithdraw() {
    toast({
      title: 'Investment withdrawal unavailable',
      description: 'No server-side investment withdrawal workflow is enabled. No withdrawal request or account balance was changed.',
      variant: 'destructive',
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center bg-background px-5 py-12">
        <section role="alert" className="w-full rounded-2xl border border-amber-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Investment information unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-gray">The portfolio record source could not be verified. This is not confirmation that no portfolio exists, and no investment action has been submitted.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setLoadAttempt((value) => value + 1)} className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">Try again</button>
            <button type="button" onClick={() => navigate('/')} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground">Return home</button>
          </div>
        </section>
      </div>
    );
  }

  const portfolioCurrency = portfolio?.currency || portfolio?.currency_code || null;
  const amountFor = (value, currency) => formatPortfolioAmount(value, currency || portfolioCurrency);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1440px] px-5 pt-6 pb-8 vantoris-scroll bg-background">
      <button onClick={() => navigate('/more')} className="flex items-center gap-2 text-sm text-gray hover:text-foreground mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-mint/10 border border-mint/15 flex items-center justify-center">
          <TrendingUp size={22} className="text-mint" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Invest</h1>
          <p className="text-xs text-gray">Investment information, separate from cash accounts</p>
        </div>
      </div>

      {!portfolio ? (
        <div className="vantoris-glass-premium mx-auto max-w-3xl p-8 text-center">
          <PieChart size={48} className="text-gray mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">No portfolio record returned</h2>
          <p className="text-gray text-sm mb-6">
            The current source returned no portfolio record for this client. This does not establish whether an investment account exists elsewhere. Portfolio creation, funding, trading, custody, and withdrawals are not enabled in this workspace.
          </p>
          <button type="button" onClick={handleCreatePortfolio} disabled={!SERVER_INVESTMENT_OPERATIONS_ENABLED || submitting} className="w-full py-3 bg-navy text-white font-semibold rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50">
            Portfolio creation unavailable
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-12">
          {/* Portfolio summary */}
          <div className="vantoris-balance-hero rounded-2xl p-6 lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Recorded portfolio value</p>
                <p className="text-white text-2xl font-bold mt-1">{amountFor(portfolio.total_value, portfolioCurrency)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Status</p>
                <p className="text-white text-sm font-semibold mt-1 capitalize">{portfolio.status ? String(portfolio.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Recorded cash component</p>
                <p className="text-white text-lg font-bold mt-0.5">{amountFor(portfolio.cash_balance, portfolioCurrency)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Recorded invested component</p>
                <p className="text-white text-lg font-bold mt-0.5">{amountFor(portfolio.invested_amount, portfolioCurrency)}</p>
              </div>
            </div>
          </div>

          {/* Provider status — honest */}
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4 lg:col-span-4">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-warning" />
            <div>
              <p className="text-foreground text-sm font-semibold">Investment execution unavailable</p>
              <p className="mt-0.5 text-xs leading-5 text-gray">
                Provider connectivity, custody, live market data, trading, funding, and withdrawals are not verified in this workspace. Deposit and withdrawal requests cannot be submitted here. Recorded values are not live prices or proof of available cash.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-12">
            <button
              onClick={() => setShowDeposit(true)}
              disabled={!SERVER_INVESTMENT_OPERATIONS_ENABLED}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ArrowDownToLine size={22} className="text-mint" />
              <span className="text-sm font-semibold text-foreground">Deposit unavailable</span>
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={!SERVER_INVESTMENT_OPERATIONS_ENABLED}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ArrowUpRight size={22} className="text-crimson" />
              <span className="text-sm font-semibold text-foreground">Withdrawal unavailable</span>
            </button>
          </div>

          {/* Pending requests */}
          {(detailIssues.deposits || detailIssues.withdrawals || depositRequests.length > 0 || withdrawalRequests.length > 0) && (
            <div className="mb-5 lg:col-span-6">
              <h3 className="text-sm font-bold text-foreground mb-3">Recorded Requests</h3>
              {detailIssues.deposits && <p role="status" className="mb-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950">Deposit request history is unavailable.</p>}
              {detailIssues.withdrawals && <p role="status" className="mb-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950">Withdrawal request history is unavailable.</p>}
              <div className="space-y-2">
                {depositRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Deposit · {amountFor(r.amount, r.currency || r.currency_code)}</p>
                      <p className="text-xs text-gray capitalize">{r.status ? String(r.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Recorded</span>
                  </div>
                ))}
                {withdrawalRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Withdrawal · {amountFor(r.amount, r.currency || r.currency_code)}</p>
                      <p className="text-xs text-gray capitalize">{r.status ? String(r.status).replace(/_/g, ' ') : 'Status not supplied'}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Recorded</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signals — honest about uncertainty */}
          {detailIssues.signals ? (
            <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Investment signal records are unavailable.</div>
          ) : signals.length > 0 && (
            <div className="mb-5 lg:col-span-6">
              <div className="flex items-center gap-2 mb-3">
                <Signal size={16} className="text-champagne" />
                <h3 className="text-sm font-bold text-foreground">Signals</h3>
              </div>
              <div className="space-y-2">
                {signals.map(s => (
                  <div key={s.id} className="vantoris-glass-flat p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">{s.asset_symbol}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.signal_type === 'buy' ? 'bg-mint/10 text-mint' :
                        s.signal_type === 'sell' ? 'bg-crimson/10 text-crimson' :
                        'bg-gray/10 text-gray'
                      }`}>{s.signal_type}</span>
                    </div>
                    {s.confidence && <p className="text-xs text-gray">Confidence: {s.confidence}</p>}
                    {s.risk_considerations && <p className="text-xs text-gray mt-1">{s.risk_considerations}</p>}
                    {!s.provider_connected && (
                      <p className="text-[10px] text-warning mt-1">Market data not connected — signal may be stale</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          {detailIssues.transactions ? (
            <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Investment activity records are unavailable.</div>
          ) : transactions.length > 0 ? (
            <div className="mb-5 lg:col-span-12">
              <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{t.type ? String(t.type).replace(/_/g, ' ') : 'Activity'}</p>
                      <p className="text-xs text-gray">{t.description || ''}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'withdrawal' || t.type === 'fee' ? 'text-crimson' : 'text-mint'}`}>
                      {t.type === 'withdrawal' || t.type === 'fee' ? '-' : '+'}{amountFor(t.amount, t.currency || t.currency_code)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-gray lg:col-span-12">
              No recent investment activity records were returned.
            </div>
          )}
          </div>
        </>
      )}

      {/* Deposit modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowDeposit(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Request Deposit</h3>
            <p className="text-xs text-gray mb-4">Your deposit request will be reviewed by an investment operator. Funds become available only after approval.</p>
            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm mb-4 focus:border-brass/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowDeposit(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Cancel</button>
              <button onClick={handleDeposit} disabled={!SERVER_INVESTMENT_OPERATIONS_ENABLED || submitting || !depositAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{!SERVER_INVESTMENT_OPERATIONS_ENABLED ? 'Unavailable' : submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Request Withdrawal</h3>
            <p className="text-xs text-gray mb-4">Your withdrawal request will be reviewed by an investment operator. Funds are transferred only after approval.</p>
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm mb-4 focus:border-brass/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowWithdraw(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Cancel</button>
              <button onClick={handleWithdraw} disabled={!SERVER_INVESTMENT_OPERATIONS_ENABLED || submitting || !withdrawAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}