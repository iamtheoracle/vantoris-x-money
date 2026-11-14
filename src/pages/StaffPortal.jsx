import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {AlertTriangle,CheckCircle2,ClipboardList,FileText,Loader2,LogOut,Plus,RefreshCw,ShieldCheck,Users,Wallet} from 'lucide-react';

function readCsrf(){const item=document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-vantoris_staff_csrf='));return item?decodeURIComponent(item.slice('__Host-vantoris_staff_csrf='.length)):'';}
const moneyCents=value=>{const n=BigInt(String(value||'0'));return '$'+(n/100n).toLocaleString('en-US')+'.'+String(n%100n).padStart(2,'0');};

export default function StaffPortal(){
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [proposalType,setProposalType]=useState('manual_journal'),[description,setDescription]=useState(''),[journalId,setJournalId]=useState(''),[reason,setReason]=useState('');
 const [memberId,setMemberId]=useState(''),[singleLimit,setSingleLimit]=useState(''),[dailyLimit,setDailyLimit]=useState('');
 const [entries,setEntries]=useState([{accountReference:'',amountCents:''},{accountReference:'',amountCents:''}]);
 const staff=data?.staff;
 const capabilities=useMemo(()=>new Set(staff?.capabilities||[]),[staff]);
 const can=cap=>capabilities.has(cap);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const r=await fetch('/api/staff-actions?action=overview',{credentials:'same-origin',cache:'no-store'});const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error==='authentication_required'?'Your staff session has expired.':'Vantoris staff data is unavailable.');
   setData(j);
  }catch(e){setError(e.message||'Staff workspace unavailable.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);

 async function post(body){
  const r=await fetch('/api/staff-actions',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-csrf-token':readCsrf()},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const messages={
   staff_capability_or_separation_required:'This action requires a separate authorized staff member or capability.',
   proposal_state_conflict:'The proposal has changed or is no longer actionable.',
   invalid_staff_action:'The proposed journal, reversal or limit values are invalid.',
   permanent_capital_protection_blocked:'This journal would impair Vantoris permanent capital and was blocked.',
   csrf_invalid:'Your staff security token expired. Refresh and try again.',
   referenced_record_not_found_or_reversible:'The referenced account or journal could not be verified.',
  };throw new Error(messages[j.error]||'Vantoris could not complete this staff action.');}
  return j;
 }

 async function submitProposal(event){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   let body;
   if(proposalType==='manual_journal')body={action:'propose',proposalType,description,entries};
   else if(proposalType==='reverse_journal')body={action:'propose',proposalType,journalId,reason};
   else body={action:'propose',proposalType,memberId,singleLimitCents:singleLimit,dailyLimitCents:dailyLimit};
   const result=await post(body);setNotice('Proposal created: '+result.proposalId);setDescription('');setJournalId('');setReason('');setSingleLimit('');setDailyLimit('');await load();
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function decide(proposalId,decision){
  setBusy(true);setError('');setNotice('');
  try{await post({action:'approve',proposalId,decision});setNotice('Proposal '+decision+'d.');await load();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function execute(proposalId){
  setBusy(true);setError('');setNotice('');
  try{const result=await post({action:'execute',proposalId});setNotice('Vantoris action executed: '+(result.resultId||''));await load();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function logout(){
  setBusy(true);
  try{await fetch('/api/staff-auth',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-csrf-token':readCsrf()},body:JSON.stringify({action:'logout'})});}
  finally{window.location.assign('/staff/login');}
 }
 function canApprove(type){return can(type==='manual_journal'?'ledger.manual_journal.approve':type==='reverse_journal'?'ledger.reverse.approve':'limits.change.approve');}
 function canExecute(type){return can(type==='manual_journal'?'ledger.manual_journal.post':type==='reverse_journal'?'ledger.reverse.post':'limits.change.post');}
 function addLine(){setEntries(current=>[...current,{accountReference:'',amountCents:''}]);}
 function updateLine(index,key,value){setEntries(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));}
 function removeLine(index){setEntries(current=>current.filter((_,i)=>i!==index));}

 if(loading)return <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]"><Loader2 className="h-8 w-8 animate-spin text-navy"/></div>;
 if(error&&!data)return <main className="mx-auto max-w-3xl px-5 py-20"><div className="rounded-2xl border border-amber-200 bg-white p-6"><h1 className="font-semibold text-navy">Staff workspace unavailable</h1><p className="mt-2 text-sm text-slate-600">{error}</p><button onClick={load} className="mt-4 rounded-xl bg-navy px-4 py-2 text-sm text-white">Try again</button><button onClick={logout} className="ml-2 text-sm text-navy">Sign out</button></div></main>;

 return <main className="min-h-screen bg-[#F4F6F9] px-5 py-7">
  <div className="mx-auto max-w-7xl">
   <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris · Restricted institutional workspace</p><h1 className="mt-1 text-3xl font-bold text-navy">Staff control room</h1><p className="mt-1 text-sm text-slate-600">{staff?.staffReference} · {staff?.email}</p></div>
    <div className="flex gap-2"><button onClick={load} className="rounded-xl border border-slate-200 bg-white p-3 text-navy" title="Refresh"><RefreshCw size={17}/></button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white"><LogOut size={16}/> Sign out</button></div>
   </header>

   <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
    <div className="flex gap-3"><ShieldCheck className="mt-0.5 text-emerald-800" size={20}/><div><h2 className="text-sm font-semibold text-emerald-950">Vantoris staff identity verified</h2><p className="mt-1 text-xs leading-5 text-emerald-900/80">The server resolved your staff session and capabilities. Financial actions are authorized again inside PostgreSQL; this interface cannot write balances.</p></div></div>
   </section>

   {error&&<p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
   {notice&&<p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

   <div className="grid gap-4 lg:grid-cols-3">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
     <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-navy"/><h2 className="font-semibold text-navy">Assigned capabilities</h2></div>
     <div className="mt-4 flex flex-wrap gap-2">{(staff?.capabilities||[]).map(cap=><span key={cap} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">{cap}</span>)}</div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
     <div className="flex items-center gap-2"><ClipboardList size={18} className="text-navy"/><h2 className="font-semibold text-navy">Institutional records</h2></div>
     <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-slate-50 p-3"><Users size={17} className="text-slate-500"/><p className="mt-2 text-2xl font-semibold text-navy">{data?.members?.length??'—'}</p><p className="text-xs text-slate-500">Member records in view</p></div>
      <div className="rounded-xl bg-slate-50 p-3"><Wallet size={17} className="text-slate-500"/><p className="mt-2 text-2xl font-semibold text-navy">{data?.accounts?.length??'—'}</p><p className="text-xs text-slate-500">Ledger accounts in view</p></div>
      <div className="rounded-xl bg-slate-50 p-3"><FileText size={17} className="text-slate-500"/><p className="mt-2 text-2xl font-semibold text-navy">{data?.proposals?.length??'—'}</p><p className="text-xs text-slate-500">Action proposals in view</p></div>
     </div>
    </section>
   </div>

   <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center gap-2"><Plus size={18} className="text-navy"/><h2 className="font-semibold text-navy">Propose a controlled financial action</h2></div>
    <form onSubmit={submitProposal} className="space-y-4">
     <select value={proposalType} onChange={e=>setProposalType(e.target.value)} className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-3 text-sm text-navy">
      {can('ledger.manual_journal.propose')&&<option value="manual_journal">Manual journal</option>}
      {can('ledger.reverse.propose')&&<option value="reverse_journal">Reverse posted journal</option>}
      {can('limits.change.propose')&&<option value="change_limit">Change member transfer limit</option>}
     </select>
     {proposalType==='manual_journal'&&can('ledger.manual_journal.propose')&&<div className="space-y-3">
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Journal description" maxLength={300} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      {entries.map((line,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
       <select value={line.accountReference} onChange={e=>updateLine(index,'accountReference',e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
        <option value="">Choose Vantoris ledger account</option>{(data?.accounts||[]).map(a=><option key={a.id} value={a.account_reference}>{a.account_reference} · {a.account_type}</option>)}
       </select>
       <input value={line.amountCents} onChange={e=>updateLine(index,'amountCents',e.target.value)} placeholder="Signed amount in cents" inputMode="numeric" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
       <button type="button" onClick={()=>removeLine(index)} disabled={entries.length<=2} className="rounded-xl border border-slate-200 px-3 text-sm text-slate-600 disabled:opacity-40">Remove</button>
      </div>)}
      <button type="button" onClick={addLine} className="text-sm font-semibold text-navy">+ Add journal line</button>
     </div>}
     {proposalType==='reverse_journal'&&can('ledger.reverse.propose')&&<div className="grid gap-3 sm:grid-cols-2"><input value={journalId} onChange={e=>setJournalId(e.target.value)} placeholder="Original posted journal UUID" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for reversal" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>}
     {proposalType==='change_limit'&&can('limits.change.propose')&&<div className="grid gap-3 sm:grid-cols-3">
      <select value={memberId} onChange={e=>setMemberId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">Choose member</option>{(data?.members||[]).map(m=><option key={m.id} value={m.id}>{m.member_reference} · {m.status}</option>)}</select>
      <input value={singleLimit} onChange={e=>setSingleLimit(e.target.value)} placeholder="Single limit (cents)" inputMode="numeric" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      <input value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)} placeholder="Daily limit (cents)" inputMode="numeric" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
     </div>}
     <button type="submit" disabled={busy||!((proposalType==='manual_journal'&&can('ledger.manual_journal.propose'))||(proposalType==='reverse_journal'&&can('ledger.reverse.propose'))||(proposalType==='change_limit'&&can('limits.change.propose')))} className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy?'Processing…':'Submit proposal for independent review'}</button>
    </form>
   </section>

   <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-navy">Staff action proposals</h2><span className="text-xs text-slate-500">Two-person separation enforced in PostgreSQL</span></div>
    {!data?.proposals?.length?<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No proposals are visible to this staff capability set.</p>:<div className="space-y-3">
     {data.proposals.map(p=><article key={p.id} className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold capitalize text-navy">{p.action_type.replace(/_/g,' ')}</p><p className="mt-1 break-all text-xs text-slate-500">{p.id}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">{p.status}</span></div>
      <p className="mt-2 text-xs text-slate-600">Proposed by {p.proposed_by} · {new Date(p.created_at).toLocaleString()}</p>
      <p className="mt-2 break-all text-xs text-slate-500">Reference: {p.object_reference}</p>
      <p className="mt-2 text-xs text-slate-600">Approvals: {(p.approvals||[]).map(a=>a.staffReference+': '+a.decision).join(' · ')||'None'}</p>
      {p.status==='pending'&&canApprove(p.action_type)&&<div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>decide(p.id,'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Approve</button><button disabled={busy} onClick={()=>decide(p.id,'reject')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Reject</button></div>}
      {p.status==='approved'&&canExecute(p.action_type)&&<button disabled={busy} onClick={()=>execute(p.id)} className="mt-3 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white">Post approved action</button>}
     </article>)}
    </div>}
   </section>
   <p className="mt-6 text-center text-xs leading-5 text-slate-500">All financial changes are recorded as immutable Vantoris journals. No staff screen or API accepts a replacement balance.</p>
  </div>
 </main>;
}
