import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {LockKeyhole,Loader2,ShieldCheck} from 'lucide-react';

export default function StaffLogin(){
 const navigate=useNavigate();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [otp,setOtp]=useState('');
 const [mfaRequired,setMfaRequired]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 async function submit(event){
  event.preventDefault();setError('');setLoading(true);
  try{
   const response=await fetch('/api/staff-auth',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({action:'login',email,password,otp})});
   const result=await response.json().catch(()=>({}));
   if(result.error==='mfa_required'){setMfaRequired(true);setError('Enter the current six-digit code from your Vantoris staff authenticator.');return;}
   if(!response.ok||!result.staff?.id){
    const messages={staff_mfa_not_provisioned:'Staff MFA must be provisioned by Vantoris security administration.',staff_not_authorized:'This staff account has no active Vantoris capability assignment.',login_temporarily_locked:'Staff sign-in is temporarily locked. Try again later.'};
    throw new Error(messages[result.error]||'Staff email or password is incorrect.');
   }
   navigate('/staff/portal',{replace:true});
  }catch(err){setError(err.message||'Vantoris staff sign-in is unavailable.');}
  finally{setLoading(false);}
 }
 return <main className="flex min-h-screen items-center justify-center bg-[#081A30] px-5 py-12">
  <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
   <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><ShieldCheck size={23}/></span>
   <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris · Restricted staff access</p>
   <h1 className="mt-2 text-2xl font-semibold text-navy">Staff sign in</h1>
   <p className="mt-2 text-sm leading-6 text-slate-600">This workspace is separate from member access. Staff identity, MFA and capabilities are verified by Vantoris.</p>
   {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
   <form onSubmit={submit} className="mt-6 space-y-4">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Staff email
     <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case text-navy"/>
    </label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Password
     <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case text-navy"/>
    </label>
    {mfaRequired&&<label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Authenticator code
     <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-lg tracking-[0.35em] text-navy"/>
    </label>}
    <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">
     {loading?<Loader2 size={16} className="animate-spin"/>:<LockKeyhole size={16}/>}
     {loading?'Verifying…':'Sign in to staff workspace'}
    </button>
   </form>
   <Link to="/login" className="mt-6 block text-center text-sm font-medium text-slate-500 hover:text-navy">Return to member sign in</Link>
  </section>
 </main>;
}
