import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { ArrowDownToLine, ArrowUpRight, Check, ChevronRight, CreditCard, QrCode, Search, Send, ShieldCheck, Wallet, X, Landmark } from 'lucide-react';

// Payment creation stays disabled until a trusted server ledger workflow is integrated.
const SERVER_MONEY_OPERATIONS_ENABLED = false;

const maskAccount = (value = '') => { const d = String(value).replace(/\D/g, ''); return d.length >= 4 ? `•••• ${d.slice(-4)}` : '••••'; };

export default function MoveMoney() {
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);
  const [dataIssues, setDataIssues] = useState({ accounts: false, cards: false, investments: false });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    const to = searchParams.get('to');
    if (action === 'send' || action === 'request' || action === 'add' || action === 'deposit' || action === 'qr') {
      // Deep links must obey the same server-side payment gate as the visible controls.
      setPanel(SERVER_MONEY_OPERATIONS_ENABLED ? (action === 'deposit' ? 'add' : action) : null);
    } else if (to) {
      setPanel(SERVER_MONEY_OPERATIONS_ENABLED ? 'send' : null);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const safeList = async (request) => {
      try {
        const result = await request;
        return { items: Array.isArray(result) ? result : [], failed: !Array.isArray(result) };
      } catch {
        return { items: [], failed: true };
      }
    };

    (async () => {
      try {
        const me = await base44.auth.me();
        const [accountResult, cardResult, investmentResult] = await Promise.all([
          safeList(base44.entities.Account.filter({ user_id: me.id }, '-created_date')),
          safeList(base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date')),
          safeList(base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date')),
        ]);
        if (!cancelled) {
          setAccounts(accountResult.items);
          setCards(cardResult.items);
          setPortfolios(investmentResult.items);
          setDataIssues({
            accounts: accountResult.failed,
            cards: cardResult.failed,
            investments: investmentResult.failed,
          });
        }
      } catch {
        if (!cancelled) {
          setDataIssues({ accounts: true, cards: true, investments: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;
  }

  const actionItems = [['send', 'Send', Send], ['request', 'Request', ArrowDownToLine], ['add', 'Add money', ArrowUpRight], ['qr', 'QR', QrCode]];

  return (
    <div className="px-5 pt-6 pb-28 max-w-[1440px] mx-auto">
      <header className="mb-6">
        <p className="text-gray text-sm">Vantoris Private Institution</p>
        <h1 className="text-3xl font-bold mt-1">Payments</h1>
        <p className="text-gray text-sm mt-1">Review account records and prepare authorized transfer requests.</p>
      </header>

      <section role="status" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <p className="font-semibold text-sm">Payment execution is not confirmed</p>
        <p className="mt-1 text-xs leading-5">
          ACH and domestic Fedwire requests can be recorded for operations review. A successfully recorded request may reserve funds from available balance while it is reviewed; no bank submission, settlement, or payment completion is confirmed here. Other send and deposit actions remain disabled until their authorized processing workflows are verified.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="relative overflow-hidden rounded-[28px] bg-[#0B2342] p-6 text-white shadow-xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brass/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Account overview</p>
            {dataIssues.accounts ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold">Account information unavailable</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">We could not retrieve account records. This is a data-access error, not confirmation that no account exists.</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-4xl font-semibold">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Individual recorded balances are shown below. A consolidated figure is withheld until currency and valuation sources are verified.</p>
              </>
            )}
            {dataIssues.investments ? (
              <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/65">Investment information is currently unavailable.</p>
            ) : (
              <button type="button" onClick={() => window.location.assign('/investment')} className="mt-5 inline-flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-brass">
                Open investment workspace
                {portfolios.length > 0 ? ' · ' + portfolios.length + (portfolios.length === 1 ? ' portfolio' : ' portfolios') : ''}
                <ChevronRight size={16} />
              </button>
            )}
          </section>

          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-navy">Accounts</h2>
              <span className="text-xs text-gray">{dataIssues.accounts ? 'Unavailable' : accounts.length}</span>
            </div>
            {dataIssues.accounts ? (
              <div role="status" className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
                Account records could not be loaded. Please try again later or contact support.
              </div>
            ) : accounts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white p-6 text-center text-sm text-gray">
                No account records were returned by the current account source.
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <button key={account.id} type="button" onClick={() => setPanel({ type: 'account', account })} className="flex w-full items-center gap-3 rounded-[24px] border border-border bg-white p-4 text-left shadow-sm transition-colors hover:border-brass/40">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy/5 text-navy"><Wallet size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{account.account_name || account.account_type}</span>
                      <span className="mt-0.5 block text-xs text-gray">{account.account_type || 'Account'} · {maskAccount(account.account_number)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">{formatCurrency(account.balance, account.currency || account.currency_code || null)}</span>
                      <span className="text-[11px] text-slate-500">{account.status ? String(account.status).replace(/_/g, ' ') : 'Status not supplied'}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-gray/50" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy"><Landmark size={20} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">U.S. bank transfer request</h2>
                <p className="mt-1 text-xs text-gray">Prepare an ACH or domestic wire request for operations review.</p>
              </div>
            </div>
            <button onClick={() => setPanel('bank-transfer')} disabled={dataIssues.accounts || accounts.length === 0} className="mt-4 w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              Start transfer request
            </button>
            <p className="mt-2 text-[11px] leading-5 text-gray">An accepted request may reserve funds while it is reviewed. It is not sent to a bank by this screen.</p>
          </section>

          <section className="grid grid-cols-4 gap-2">
            {actionItems.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setPanel(id)} disabled={!SERVER_MONEY_OPERATIONS_ENABLED} title={!SERVER_MONEY_OPERATIONS_ENABLED ? 'Unavailable until secure payment processing is enabled' : undefined} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white py-3 shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brass/10 text-brass"><Icon size={19} /></span>
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            ))}
          </section>

          {dataIssues.cards ? (
            <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <h2 className="font-semibold">Card information unavailable</h2>
              <p className="mt-1 text-xs leading-5">We could not verify current card records. This does not mean a card has not been issued.</p>
            </section>
          ) : cards.length > 0 ? (
            <section className="mb-7">
              <div className="mb-3 flex justify-between"><h2 className="font-semibold">Cards</h2><span className="text-xs text-gray">{cards.length}</span></div>
              <div className="space-y-3">{cards.map((card) => <PaymentCard key={card.id} card={card} />)}</div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-navy">Card services</h2>
              <p className="mt-1 text-xs leading-5 text-gray">No card record was returned by the current source. Issuance and request availability have not been verified.</p>
            </section>
          )}

          {dataIssues.investments ? (
            <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <h2 className="font-semibold">Investment information unavailable</h2>
              <p className="mt-1 text-xs leading-5">The investment record source could not be reached. This is not confirmation that no portfolio exists.</p>
            </section>
          ) : (
            <section className="rounded-[28px] border border-border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray">Invest</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Investment workspace</h2>
                <button onClick={() => window.location.assign('/investment')} className="text-sm font-semibold text-brass">Open</button>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray">{portfolios.length} {portfolios.length === 1 ? 'portfolio record' : 'portfolio records'} returned. Investment values are not consolidated into cash-account balances.</p>
            </section>
          )}
        </div>
      </div>

      {panel === 'bank-transfer' ? <BankTransferPanel accounts={accounts} onClose={() => setPanel(null)} /> : panel && <MoneyPanel panel={panel} accounts={accounts} onClose={() => setPanel(null)} />}
    </div>
  );
}

function BankTransferPanel({accounts,onClose}) {
  const [rail,setRail]=useState('ACH');
  const [accountId,setAccountId]=useState(accounts[0]?.id||'');
  const [amount,setAmount]=useState('');
  const [beneficiary,setBeneficiary]=useState('');
  const [bank,setBank]=useState('');
  const [routing,setRouting]=useState('');
  const [last4,setLast4]=useState('');
  const [memo,setMemo]=useState('');
  const [busy,setBusy]=useState(false);
  const {toast}=useToast();
  async function submit(e) {
    e.preventDefault();
    const dollars=Number(amount);
    if(!Number.isFinite(dollars)||dollars<=0||Math.round(dollars*100)!==dollars*100) {
      toast({title:'Enter a valid amount',description:'Use dollars and cents, for example 125.00.',variant:'destructive'}); return;
    }
    if(!accountId||!beneficiary.trim()||!bank.trim()||!/^\d{9}$/.test(routing)||!/^\d{4}$/.test(last4)) {
      toast({title:'Complete the transfer details',description:'Check the beneficiary, bank, 9-digit routing number and account last four.',variant:'destructive'}); return;
    }
    setBusy(true);
    try {
      const result=await base44.functions.invoke('createTransferRequest',{
        rail,source_account_id:accountId,amount_cents:Math.round(dollars*100),
        beneficiary_name:beneficiary,beneficiary_bank_name:bank,
        beneficiary_routing_number:routing,beneficiary_account_last4:last4,
        memo,idempotency_key:crypto.randomUUID()
      });
      toast({title:'Transfer request recorded',description:result?.data?.message||'Your request is recorded for review. A hold may reserve the amount while it is reviewed; no bank transfer has been sent.'});
      onClose();
    } catch(error) {
      toast({title:'Request not submitted',description:error?.message||'The server could not record this request.',variant:'destructive'});
    } finally { setBusy(false); }
  }
  return <Sheet title="U.S. bank transfer" subtitle="Secure transfer request intake" onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <div><label className="block text-xs text-gray mb-2">Transfer rail</label><select value={rail} onChange={e=>setRail(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm"><option value="ACH">ACH transfer</option><option value="FEDWIRE">Domestic Fedwire</option></select></div>
      <div><label className="block text-xs text-gray mb-2">From Vantoris account</label><select value={accountId} onChange={e=>setAccountId(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm">{accounts.map(a=><option key={a.id} value={a.id}>{a.account_name||a.account_type} · •••• {String(a.account_number||'').slice(-4)}</option>)}</select></div>
      <div><label className="block text-xs text-gray mb-2">Amount (USD)</label><input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div><label className="block text-xs text-gray mb-2">Beneficiary full name</label><input required maxLength={120} value={beneficiary} onChange={e=>setBeneficiary(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div><label className="block text-xs text-gray mb-2">Beneficiary bank</label><input required maxLength={120} value={bank} onChange={e=>setBank(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div><label className="block text-xs text-gray mb-2">9-digit ABA routing number</label><input required inputMode="numeric" maxLength={9} value={routing} onChange={e=>setRouting(e.target.value.replace(/\D/g,'').slice(0,9))} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div><label className="block text-xs text-gray mb-2">Beneficiary account last four digits</label><input required inputMode="numeric" maxLength={4} value={last4} onChange={e=>setLast4(e.target.value.replace(/\D/g,'').slice(0,4))} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div><label className="block text-xs text-gray mb-2">Memo (optional)</label><input maxLength={140} value={memo} onChange={e=>setMemo(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950">This records a request for review only. An accepted request may reserve funds from available balance; no bank submission, settlement, or transfer confirmation occurs here.</div>
      <button disabled={busy||!accounts.length} className="w-full h-12 rounded-xl bg-navy text-white font-semibold disabled:opacity-50">{busy?'Submitting request…':'Submit transfer request'}</button>
    </form>
  </Sheet>;
}

function PaymentCard({card}) { return <div className="relative overflow-hidden rounded-[26px] p-5 min-h-[190px] text-white shadow-2xl bg-gradient-to-br from-[#0A2140] via-[#122F53] to-[#07162A]"><div className="absolute -right-10 -top-10 w-32 h-32 rounded-full border border-brass/25"/><div className="flex justify-between"><span className="text-sm font-semibold tracking-[0.18em]">VANTORIS</span><CreditCard size={22} className="text-white/70"/></div><div className="mt-10 text-lg tracking-[0.22em]">•••• •••• •••• {card.last4 || '••••'}</div><div className="mt-5 flex justify-between"><div><p className="text-[9px] uppercase text-white/45">Cardholder</p><p className="text-xs mt-1 uppercase">{card.cardholder_name || 'Name not supplied'}</p></div><div><p className="text-[9px] uppercase text-white/45">Type</p><p className="text-xs mt-1 capitalize">{card.card_type || 'Type not supplied'}</p></div></div></div>; }

function AddMoneyPanel({accounts,onClose}){const [accountId,setAccountId]=useState(accounts[0]?.id||'');const [amount,setAmount]=useState('');const [note,setNote]=useState('Member deposit');const {toast}=useToast();
  async function post() {
    toast({
      title: 'Deposit unavailable',
      description: 'No server-side deposit workflow is enabled. No transaction or account balance was changed.',
      variant: 'destructive',
    });
  }
  return <Sheet title="Add money" subtitle="Deposit requests are unavailable until an authorized payments workflow is connected" onClose={onClose}><div className="space-y-4"><div><label className="text-xs uppercase tracking-[0.15em] text-gray block mb-2">To account</label><select value={accountId} onChange={e=>setAccountId(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm">{accounts.map(a=><option key={a.id} value={a.id}>{a.account_name||a.account_type} · {formatCurrency(a.balance, a.currency || a.currency_code || null)}</option>)}</select></div><div><label className="text-xs uppercase tracking-[0.15em] text-gray block mb-2">Amount</label><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div><div><label className="text-xs uppercase tracking-[0.15em] text-gray block mb-2">Note</label><input value={note} onChange={e=>setNote(e.target.value)} className="w-full h-12 rounded-xl border border-border px-3 text-sm"/></div><button type="button" disabled={!SERVER_MONEY_OPERATIONS_ENABLED} onClick={post} className="w-full h-12 rounded-xl bg-navy text-white font-semibold">Add money unavailable</button></div></Sheet>;
}
function MoneyPanel({panel,accounts,onClose}) { if(panel==='qr') return <QrPanel onClose={onClose}/>; if(panel==='send'||panel==='request') return <ZellePanel accounts={accounts} mode={panel} onClose={onClose}/>; if(panel==='add') return <AddMoneyPanel accounts={accounts} onClose={onClose}/>; if(panel?.type==='account') return <Sheet title={panel.account.account_name || panel.account.account_type} subtitle="Account details" onClose={onClose}><div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm"><Detail label="Recorded balance (not live)" value={formatCurrency(panel.account.balance, panel.account.currency || panel.account.currency_code || null)}/><Detail label="Account type" value={panel.account.account_type}/><Detail label="Account number" value={maskAccount(panel.account.account_number)}/><Detail label="Routing number" value={panel.account.routing_number || '—'}/><Detail label="Status" value={panel.account.status || 'Status not supplied'}/></div></Sheet>; return null; }

function ZellePanel({ mode, onClose }) {
  const title = mode === 'request' ? 'Request from a member' : 'Send to a member';
  return (
    <Sheet
      title={title}
      subtitle="Private member-to-member transfers are not enabled yet. No external payment network is used."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Member transfers are not available</p>
          <p className="mt-1 text-xs leading-5">
            A first-party member directory, recipient consent, server-side authorization,
            available-funds reservation, dual-control rules where required, and an audited
            ledger workflow must be verified before transfers can be enabled.
          </p>
        </div>
        <p className="text-xs leading-5 text-gray">
          No recipient search, payment instruction, transfer request, or account change has
          been created from this screen.
        </p>
      </div>
    </Sheet>
  );
}

function QrPanel({onClose}) { return <Sheet title="Member QR" subtitle="QR payments are unavailable until a privacy-safe, first-party implementation is connected." onClose={onClose}><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">QR temporarily unavailable</p><p className="mt-1 text-xs leading-5">Member identifiers will not be sent to an external QR image service. QR receive and scanning will return after a first-party renderer and trusted recipient lookup are implemented. No payment can be made from this screen.</p></div></Sheet>; }

function Sheet({title,subtitle,onClose,children}) { return <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex items-end justify-center"><div className="w-full max-w-[430px] max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-white p-5 pb-8 safe-bottom shadow-2xl"><div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="text-xl font-bold">{title}</h2>{subtitle&&<p className="text-sm text-gray mt-1">{subtitle}</p>}</div><button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><X size={18}/></button></div>{children}</div></div>; }
function Detail({label,value}) { return <div className="flex items-center justify-between gap-4"><span className="text-gray">{label}</span><span className="font-medium text-right">{value}</span></div>; }
