import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRightLeft,Loader2,ReceiptText,Wallet} from 'lucide-react';
import {formatCurrency} from '@/lib/formatCurrency';
import ProductShell from './ProductShell';

export default function Money(){
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch('/api/member-auth?action=me',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error('Vantoris could not retrieve your ledger records.');if(active)setData(j);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 return <ProductShell kicker="Vantoris ledger" title="Money" subtitle="Your accounts, posted balances and internal transfers are Vantoris ledger records.">
  {loading?<div className="flex justify-center py-12"><Loader2 className="animate-spin text-navy"/></div>:error?<p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>:<>
   <div className="grid gap-3 md:grid-cols-2">{(data?.accounts||[]).map(a=><Link key={a.id} to={`/accounts/${a.id}`} className="rounded-2xl border border-slate-200 bg-white p-5"><Wallet size={19} className="text-navy"/><p className="mt-3 text-sm font-semibold text-navy">{a.accountReference}</p><p className="mt-1 text-xs capitalize text-slate-500">{a.accountType.replace(/_/g,' ')}</p><p className="mt-4 text-2xl font-semibold tabular-nums text-navy">{a.balance===null?'—':formatCurrency(a.balance,a.currency)}</p><p className="mt-1 text-xs text-slate-500">Posted balance</p></Link>)}</div>
   {!(data?.accounts||[]).length&&<div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">No ledger account is linked to this member record.</div>}
   <div className="mt-5 flex flex-wrap gap-3"><Link to="/move-money" className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white"><ArrowRightLeft size={16}/> Transfer to another member</Link><Link to="/transactions" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy"><ReceiptText size={16}/> Ledger activity</Link></div>
  </>}
 </ProductShell>;
}
