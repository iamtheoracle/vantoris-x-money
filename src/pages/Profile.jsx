import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user, accounts } = useAuth();
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Member profile</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Your Vantoris identity</h1>
      <p className="mt-2 text-sm text-slate-600">Member identity and account ownership are maintained by Vantoris.</p>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy"><UserRound size={20}/></span><div><h2 className="font-semibold text-navy">{user?.memberReference || 'Member record'}</h2><p className="text-xs text-slate-500">Vantoris member reference</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Mail size={15}/> Verified sign-in email</div><p className="mt-2 break-all text-sm font-semibold text-navy">{user?.email || '—'}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ShieldCheck size={15}/> Membership status</div><p className="mt-2 text-sm font-semibold capitalize text-navy">{user?.status || '—'}</p></div>
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2"><Wallet size={18} className="text-navy"/><h2 className="font-semibold text-navy">Your Vantoris accounts</h2></div>
        {!accounts?.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No ledger account is currently linked to this member record. Vantoris must verify and establish the account before a balance is displayed.</p> :
          <div className="mt-4 divide-y divide-slate-100">{accounts.map(account=><Link key={account.id} to={`/accounts/${account.id}`} className="flex items-center justify-between gap-3 py-4"><div><p className="text-sm font-semibold text-navy">{account.accountReference}</p><p className="mt-1 text-xs capitalize text-slate-500">{account.accountType.replace(/_/g,' ')} · {account.currency}</p></div><ArrowUpRight size={17} className="text-slate-400"/></Link>)}</div>}
      </section>
      <div className="mt-6 flex flex-wrap gap-3"><Link to="/documents" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy">Identity documents</Link><Link to="/support" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy">Member support</Link></div>
    </main>
  );
}
