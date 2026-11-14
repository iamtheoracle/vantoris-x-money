import React,{useCallback,useEffect,useState} from 'react';
import {FileText,Loader2,ShieldCheck,UploadCloud,ExternalLink} from 'lucide-react';

const TYPES=[['government_id','Government-issued identity'],['proof_of_address','Proof of address'],['selfie','Identity selfie'],['business_document','Business document'],['other','Other']];
export default function MemberDocuments(){
 const [documents,setDocuments]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [file,setFile]=useState(null),[documentType,setDocumentType]=useState('government_id'),[uploading,setUploading]=useState(false);
 const load=useCallback(async()=>{
  const response=await fetch('/api/member-documents?action=list',{credentials:'same-origin',cache:'no-store'});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error==='authentication_required'?'Your member session has expired.':'Vantoris document records are unavailable.');
  return result.documents||[];
 },[]);
 useEffect(()=>{let active=true;load().then(items=>{if(active)setDocuments(items);}).catch(e=>{if(active)setError(e.message||'Unable to load Vantoris documents.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[load]);
 async function upload(event){
  event.preventDefault();if(!file)return;const formElement=event.currentTarget;setUploading(true);setError('');setNotice('');
  try{
   const form=new FormData();form.append('file',file);form.append('documentType',documentType);
   const response=await fetch('/api/member-documents',{method:'POST',credentials:'same-origin',body:form});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result.error||'Vantoris could not store this document.');
   setFile(null);formElement.reset();setNotice('Document encrypted and received by Vantoris. It is awaiting Vantoris staff review.');
   setDocuments(await load());
  }catch(e){setError(e.message||'Document upload failed.');}finally{setUploading(false);}
 }
 return <main className="mx-auto max-w-4xl px-5 py-8">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Member records</p><h1 className="mt-2 text-3xl font-semibold text-navy">Identity documents</h1>
  <p className="mt-2 text-sm leading-6 text-slate-600">Documents are encrypted by Vantoris before storage in its PostgreSQL-controlled document records. Identity decisions are made by Vantoris staff.</p>
  {error&&<p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
  {notice&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
  <form onSubmit={upload} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
   <div className="flex items-center gap-2"><UploadCloud size={19} className="text-navy"/><h2 className="font-semibold text-navy">Submit a document to Vantoris</h2></div>
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold text-slate-600">Document type<select value={documentType} onChange={e=>setDocumentType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm">{TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label className="text-xs font-semibold text-slate-600">PDF, JPEG or PNG · up to 4 MB<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)} required className="mt-2 block w-full rounded-xl border border-slate-200 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"/></label>
   </div>
   <p className="mt-3 text-xs leading-5 text-slate-500">Vantoris validates file signatures, encrypts the contents and stores an integrity hash. A successful upload means received, not approved.</p>
   <button type="submit" disabled={uploading||!file} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{uploading?<Loader2 size={16} className="animate-spin"/>:<UploadCloud size={16}/>} Submit encrypted document</button>
  </form>
  <section className="mt-6">
   <div className="mb-3 flex items-center gap-2"><ShieldCheck size={19} className="text-navy"/><h2 className="font-semibold text-navy">Documents held by Vantoris</h2></div>
   {loading?<div className="flex justify-center py-12"><Loader2 className="animate-spin text-navy"/></div>:!documents.length?<div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center"><FileText size={26} className="mx-auto text-slate-400"/><h3 className="mt-3 font-semibold text-navy">No documents on record</h3><p className="mt-2 text-sm text-slate-500">Submit a document above when Vantoris requests it.</p></div>:<div className="space-y-3">{documents.map(doc=><article key={doc.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><FileText size={20} className="text-navy"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold capitalize text-navy">{doc.documentType.replace(/_/g,' ')}</p><p className="mt-1 break-all text-xs text-slate-500">{doc.filename} · {new Date(doc.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">{doc.reviewStatus.replace(/_/g,' ')}</span><a href={`/api/member-documents?id=${doc.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><ExternalLink size={14}/> View</a></article>)}</div>}
  </section>
 </main>;
}
