import React,{useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import {ArrowDownToLine,RefreshCw,ShieldCheck} from 'lucide-react';
import {formatCurrency} from '@/lib/formatCurrency';

export default function IncomingBankReceipts(){
 const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState('');
 async function load(){setLoading(true);try{setRows(await base44.entities.IncomingBankReceipt.list('-created_date',200));}catch(e){window.alert(e?.message||'Could not load incoming receipts.');}finally{setLoading(false);}}
 useEffect(()=>{load();},[]);
 async function record(){
  const member=(window.prompt('Member user ID (verify identity through approved procedures):')||'').trim();if(!member)return;
  const account=(window.prompt('AVCU account record ID:')||'').trim();if(!account)return;
  const rail=(window.prompt('Payment rail: enter ACH or FEDWIRE','ACH')||'').trim().toUpperCase();if(!['ACH','FEDWIRE'].includes(rail)){window.alert('Enter ACH or FEDWIRE.');return;}
  const amountText=(window.prompt('Amount received in USD (e.g. 125.50):')||'').trim();const amount=Number(amountText);if(!Number.isFinite(amount)||amount<=0||Math.round(amount*100)>100000000){window.alert('Enter a valid amount.');return;}
  const reference=(window.prompt('Exact bank-generated reference:')||'').trim();if(!reference)return;
  const evidence=(window.prompt('Secure evidence reference (document ID/location only; never enter passwords):')||'').trim();if(!evidence)return;
  const note=(window.prompt('Optional operator note:')||'').trim();
  setBusy('record');
  try{await base44.functions.invoke('recordIncomingBankReceipt',{action:'record_receipt',member_user_id:member,account_id:account,rail,amount_cents:Math.round(amount*100),bank_reference:reference,evidence_reference:evidence,idempotency_key:`INCOMING-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,note});await load();window.alert('Incoming receipt recorded for independent verification. No member balance was credited.');}
  catch(e){window.alert(e?.message||'Receipt could not be recorded.');}finally{setBusy('');}
 }
 async function verify(row,action){
  const evidence=(window.prompt('Independent bank evidence reference:')||'').trim();if(!evidence)return;
  const note=(window.prompt('Verification note (optional):')||'').trim();setBusy(row.id);
  try{await base44.functions.invoke('recordIncomingBankReceipt',{action,receipt_id:row.id,evidence_reference:evidence,note});await load();window.alert(action==='verify_received'?'Receipt verified. Ledger posting remains separate.':'Receipt exception recorded.');}
  catch(e){window.alert(e?.message||'Receipt verification failed.');}finally{setBusy('');}
 }
 return <OperationsPageLayout title="Incoming bank receipts" description="Manually record and independently verify incoming ACH and domestic wires" icon={ArrowDownToLine}>
  <section className="vantoris-card p-5 mb-5">
   <div className="flex items-center justify-between gap-3"><div><h2 className="text-white font-semibold">Incoming payment register</h2><p className="text-[#AAB4C3] text-xs mt-1">Manual evidence capture · no automatic balance credits</p></div><button onClick={record} disabled={!!busy} className="rounded-lg bg-brass text-[#111827] px-3 py-2 text-xs font-bold disabled:opacity-50">Record incoming payment</button></div>
   <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs">Recording or verifying a receipt does not credit a member account. Ledger posting must be performed through a separate authorized, balanced ledger workflow after bank reconciliation.</div>
  </section>
  <section className="vantoris-card p-5">
   <div className="flex items-center justify-between mb-4"><h2 className="text-white font-semibold">Receipt records</h2><button onClick={load} className="text-[#AAB4C3] text-xs flex items-center gap-1"><RefreshCw size={13}/> Refresh</button></div>
   {loading?<p className="text-[#AAB4C3] text-sm">Loading receipts…</p>:rows.length===0?<p className="text-[#AAB4C3] text-sm">No incoming bank receipts recorded.</p>:<div className="space-y-3">{rows.map(row=><article key={row.id} className="rounded-xl border border-[#2B3543] p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="text-white font-semibold text-sm">{row.rail} · {row.bank_reference}</p><p className="text-[#AAB4C3] text-xs mt-1">Member {row.member_user_id} · Account {row.account_id}</p><p className="text-[#AAB4C3] text-[11px] mt-1">Recorded by {row.recorded_by_user_id||'unknown'} · {row.recorded_at?new Date(row.recorded_at).toLocaleString():'time unavailable'}</p></div><div className="text-right"><p className="text-white font-semibold">{formatCurrency((row.amount_cents||0)/100)}</p><span className="text-[10px] uppercase text-amber-300">{row.status}</span></div></div>
    <p className="text-xs text-[#AAB4C3] mt-2">Ledger: {row.ledger_posting_status||'not_posted'} · {row.ledger_transaction_id||'No ledger transaction'}</p>
    {row.status==='awaiting_verification'&&<div className="flex flex-wrap gap-2 mt-3"><button disabled={!!busy} onClick={()=>verify(row,'verify_received')} className="rounded-lg bg-emerald-500/15 text-emerald-200 px-3 py-2 text-xs font-semibold">Verify receipt</button><button disabled={!!busy} onClick={()=>verify(row,'record_return')} className="rounded-lg bg-orange-500/15 text-orange-200 px-3 py-2 text-xs font-semibold">Record return</button><button disabled={!!busy} onClick={()=>verify(row,'reject_receipt')} className="rounded-lg bg-red-500/15 text-red-200 px-3 py-2 text-xs font-semibold">Reject record</button></div>}
   </article>)}</div>}
  </section>
  <section className="vantoris-card p-4 mt-5 flex gap-3"><ShieldCheck className="text-brass shrink-0" size={18}/><p className="text-[#AAB4C3] text-xs leading-5">The recorder and verifier must be different authorized staff members. Never paste online banking passwords, full account credentials, or unredacted sensitive documents into evidence notes.</p></section>
 </OperationsPageLayout>;
}
