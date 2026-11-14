import React,{useEffect,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {Loader2} from 'lucide-react';
import StaffPortal from '@/pages/StaffPortal';

export default function OperationsRoute(){
 const [state,setState]=useState('loading');
 useEffect(()=>{
  let active=true;
  fetch('/api/staff-auth?action=me',{credentials:'same-origin',cache:'no-store'})
   .then(async response=>{
    if(!active)return;
    if(response.status===401){setState('unauthenticated');return;}
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.staff?.id||!Array.isArray(result.staff.capabilities)||result.staff.capabilities.length===0){setState('unauthorized');return;}
    setState('authorized');
   })
   .catch(()=>{if(active)setState('unavailable');});
  return()=>{active=false;};
 },[]);
 if(state==='loading')return <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]"><Loader2 className="h-8 w-8 animate-spin text-navy"/></div>;
 if(state==='unauthenticated')return <Navigate to="/staff/login" replace/>;
 if(state==='unauthorized')return <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6"><h1 className="font-semibold text-navy">Staff access not assigned</h1><p className="mt-2 text-sm text-slate-600">This account does not have an active Vantoris staff capability assignment.</p></div></main>;
 if(state==='unavailable')return <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6"><h1 className="font-semibold text-navy">Staff authentication unavailable</h1><p className="mt-2 text-sm text-slate-600">Vantoris could not verify the staff session. No operational action is available.</p></div></main>;
 return <StaffPortal/>;
}
