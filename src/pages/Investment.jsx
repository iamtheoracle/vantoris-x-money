import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Wallet, ArrowDownToLine, ArrowUpRight, PieChart, Signal, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/formatCurrency';
import FinancialHeritage from '@/components/vantoris/FinancialHeritage';

// Investment mutations stay disabled until an authorized provider workflow is integrated.
const SERVER_INVESTMENT_OPERATIONS_ENABLED = false;

export default function Investment() {
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [portfolios] = await Promise.all([
      base44.entities.InvestmentPortfolio.filter({ user_id: me.id }).catch(() => []),
    ]);
    const portf = portfolios[0] || null;
    setPortfolio(portf);
    if (portf) {
      const [txns, deps, wrs, sigs] = await Promise.all([
        base44.entities.InvestmentTransaction.filter({ portfolio_id: portf.id }, '-created_date', 20).catch(() => []),
        base44.entities.InvestmentDepositRequest.filter({ user_id: me.id }, '-created_date', 10).catch(() => []),
        base44.entities.InvestmentWithdrawalRequest.filter({ user_id: me.id }, '-created_date', 10).catch(() => []),
        base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5).catch(() => []),
      ]);
      setTransactions(txns);
      setDepositRequests(deps);
      setWithdrawalRequests(wrs);
      setSignals(sigs);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => {}).finally(() => setLoading(false));
  }, [loadData]);

  async function handleCreatePortfolio() {
    if (!SERVER_INVESTMENT_OPERATIONS_ENABLED) { toast({ title: 'Investment action unavailable', description: 'Portfolio creation and investment funding requests are disabled until a trusted investment provider, ledger, and authorization workflow are connected. No investment action was submitted.', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      const created = await base44.entities.InvestmentPortfolio.create({
        user_id: me.id,
        portfolio_name: 'My Portfolio',
        status: 'pending_setup',
        provider_connected: false,
      });
      setPortfolio(created);
      toast({ title: 'Portfolio created', description: 'Your investment portfolio is pending setup.' });
    } catch (err) {
      toast({ title: 'Failed to create portfolio', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeposit() {
    if (!SERVER_INVESTMENT_OPERATIONS_ENABLED) { toast({ title: 'Investment action unavailable', description: 'Portfolio creation and investment funding requests are disabled until a trusted investment provider, ledger, and authorization workflow are connected. No investment action was submitted.', variant: 'destructive' }); return; }

    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.InvestmentDepositRequest.create({
        user_id: me.id,
        portfolio_id: portfolio.id,
        amount: parseFloat(depositAmount),
        status: 'requested',
      });
      toast({ title: 'Deposit requested', description: 'Your deposit request is pending operator review.' });
      setShowDeposit(false);
      setDepositAmount('');
      loadData();
    } catch (err) {
      toast({ title: 'Failed to submit deposit', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!SERVER_INVESTMENT_OPERATIONS_ENABLED) { toast({ title: 'Investment action unavailable', description: 'Portfolio creation and investment funding requests are disabled until a trusted investment provider, ledger, and authorization workflow are connected. No investment action was submitted.', variant: 'destructive' }); return; }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.InvestmentWithdrawalRequest.create({
        user_id: me.id,
        portfolio_id: portfolio.id,
        amount: parseFloat(withdrawAmount),
        status: 'requested',
      });
      toast({ title: 'Withdrawal requested', description: 'Your withdrawal request is pending operator review.' });
      setShowWithdraw(false);
      setWithdrawAmount('');
      loadData();
    } catch (err) {
      toast({ title: 'Failed to submit withdrawal', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll min-h-screen bg-background">
      <button onClick={() => navigate('/more')} className="flex items-center gap-2 text-sm text-gray hover:text-foreground mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-mint/10 border border-mint/15 flex items-center justify-center">
          <TrendingUp size={22} className="text-mint" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Vantoris Private Investment</h1>
          <p className="text-xs text-gray">Private capital, portfolio visibility and controlled investment workflows</p>
        </div>
      </div>

      <FinancialHeritage compact className="mb-6" />

      {!portfolio ? (
        <div className="vantoris-glass-premium p-8 text-center">
          <PieChart size={48} className="text-gray mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">No Investment Portfolio</h2>
          <p className="text-gray text-sm mb-6">
            Create an investment portfolio to get started. This is a separate experience from your ordinary Vantoris banking.
          </p>
          <button
            onClick={handleCreatePortfolio}
            disabled={submitting}
            className="w-full py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Portfolio'}
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          <div className="vantoris-balance-hero p-6 mb-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Portfolio Value</p>
                <p className="text-white text-2xl font-bold mt-1">{formatCurrency(portfolio.total_value || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Status</p>
                <p className="text-white text-sm font-semibold mt-1 capitalize">{(portfolio.status || 'pending_setup').replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Available Cash</p>
                <p className="text-white text-lg font-bold mt-0.5">{formatCurrency(portfolio.cash_balance || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Invested</p>
                <p className="text-white text-lg font-bold mt-0.5">{formatCurrency(portfolio.invested_amount || 0)}</p>
              </div>
            </div>
          </div>

          {/* Provider status — honest */}
          {!portfolio.provider_connected && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground text-sm font-semibold">No Brokerage Provider Connected</p>
                <p className="text-gray text-xs mt-0.5">
                  Investment trading, live market data, and custody are not connected. Deposit and withdrawal requests can be submitted but require operator approval. No live prices or positions are available.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setShowDeposit(true)}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 hover:shadow-md transition"
            >
              <ArrowDownToLine size={22} className="text-mint" />
              <span className="text-sm font-semibold text-foreground">Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 hover:shadow-md transition"
            >
              <ArrowUpRight size={22} className="text-crimson" />
              <span className="text-sm font-semibold text-foreground">Withdraw</span>
            </button>
          </div>

          {/* Pending requests */}
          {(depositRequests.length > 0 || withdrawalRequests.length > 0) && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Pending Requests</h3>
              <div className="space-y-2">
                {depositRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Deposit · {formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray capitalize">{r.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Pending</span>
                  </div>
                ))}
                {withdrawalRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Withdrawal · {formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray capitalize">{r.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signals — honest about uncertainty */}
          {signals.length > 0 && (
            <div className="mb-5">
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
          {transactions.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{t.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray">{t.description || ''}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'withdrawal' || t.type === 'fee' ? 'text-crimson' : 'text-mint'}`}>
                      {t.type === 'withdrawal' || t.type === 'fee' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <button onClick={handleDeposit} disabled={submitting || !depositAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
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
              <button onClick={handleWithdraw} disabled={submitting || !withdrawAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}