import React,{useEffect,useState} from 'react';
import { FileText, Loader2, ShieldCheck } from 'lucide-react';

export default function MemberDocuments(){
 const [documents,setDocuments]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  fetch('/api/member-auth?action=documents',{credentials:'same-origin',cache:'no-store'})
   .then(async response=>{const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error==='authentication_required'?'Your member session has expired.':'Vantoris document records are unavailable.');if(active)setDocuments(result.documents||[]);})
   .catch(err=>{if(active)setError(err.message||'Unable to load Vantoris documents.');})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Member records</p><h1 className="mt-2 text-3xl font-semibold text-navy">Identity documents</h1>
  <p className="mt-2 text-sm leading-6 text-slate-600">Document metadata is retrieved from Vantoris PostgreSQL. Encrypted document contents are never exposed through this listing.</p>
  {loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy"/></div>:error?<p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>:!documents.length?<div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center"><ShieldCheck size={26} className="mx-auto text-slate-400"/><h2 className="mt-3 font-semibold text-navy">No documents on record</h2><p className="mt-2 text-sm leading-6 text-slate-500">No Vantoris-held identity document is currently linked to this member. Secure document upload and review actions are not yet enabled.</p></div>:<div className="mt-6 space-y-3">{documents.map(doc=><article key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><FileText size={20} className="text-navy"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold capitalize text-navy">{doc.documentType.replace(/_/g,' ')}</p><p className="mt-1 text-xs text-slate-500">{doc.mediaType} · {new Date(doc.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">{doc.reviewStatus.replace(/_/g,' ')}</span></article>)}</div>}
 </main>;
}
