import React,{useEffect,useState} from 'react';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';

export default function News(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch('/.netlify/functions/market',{credentials:'omit',cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Feed unavailable');return r.json();}).then(result=>{if(active)setData(result);}).catch(e=>{if(active)setError(e.message||'Feed unavailable');});return()=>{active=false;};},[]);
 const quotes=data?.rates?.quotes||{},pairs=['GBP','EUR','NGN','CAD'].filter(k=>quotes[k]);
 return <ProductShell kicker="External information" title="News and rates" subtitle="Optional information only. External headlines or indicative rates are not Vantoris ledger values and are not used for payments.">
  {error?<UnavailableState title="External information unavailable" detail={error}/>:!data?<UnavailableState title="Loading external information" detail="No external information is required for member sign-in, balances or internal transfers."/>:<div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-navy">Indicative exchange rates</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{pairs.map(pair=><div key={pair} className="rounded-lg bg-slate-50 p-3 text-sm"><span className="font-semibold text-navy">{pair}</span><span className="float-right text-slate-600">{String(quotes[pair])}</span></div>)}</div><p className="mt-3 text-xs text-slate-500">Informational only; not a Vantoris quote or payment instruction.</p></div>}
 </ProductShell>;
}
