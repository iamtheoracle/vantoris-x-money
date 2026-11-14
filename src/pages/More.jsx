import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Headphones, LogOut, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const links=[
  {to:'/profile',label:'Member profile',detail:'Your Vantoris identity',icon:UserRound},
  {to:'/accounts',label:'Accounts',detail:'Your Vantoris ledger accounts',icon:Wallet},
  {to:'/documents',label:'Identity documents',detail:'Documents held by Vantoris',icon:FileText},
  {to:'/support',label:'Member support',detail:'Support and service information',icon:Headphones},
];

export default function More(){
 const {user,logout}=useAuth();
 return <main className="mx-auto max-w-3xl px-5 py-8">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris</p>
  <h1 className="mt-2 text-3xl font-semibold text-navy">More</h1>
  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
   <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy"><ShieldCheck size={20}/></span><div><p className="font-semibold text-navy">{user?.memberReference||'Member'}</p><p className="text-xs text-slate-500">{user?.email||''}</p></div></div>
  </section>
  <nav className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">{links.map(item=>{const Icon=item.icon;return <Link key={item.to} to={item.to} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-0"><Icon size={18} className="text-slate-500"/><span className="flex-1"><span className="block text-sm font-semibold text-navy">{item.label}</span><span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span></span></Link>;})}</nav>
  <button onClick={()=>logout(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700"><LogOut size={16}/> Sign out</button>
 </main>;
}
