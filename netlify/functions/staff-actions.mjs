import postgres from 'postgres';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

let sql;
function database() {
  if (sql) return sql;
  const url=process.env.VANTORIS_LEDGER_DATABASE_URL;
  if(!url) throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured');
  const parsed=new URL(url);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)) throw new Error('Vantoris ledger URL must use PostgreSQL');
  sql=postgres(url,{ssl:process.env.VANTORIS_DATABASE_SSL==='disable'?false:'require',max:6,idle_timeout:20,connect_timeout:10,prepare:false,onnotice:()=>{}});
  return sql;
}
const sha256=value=>createHash('sha256').update(value).digest();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
function readCookies(request) {
  const out={};
  for(const part of (request.headers.get('cookie')||'').split(';')) {
    const index=part.indexOf('='); if(index<0) continue;
    try{out[part.slice(0,index).trim()]=decodeURIComponent(part.slice(index+1).trim());}catch{}
  }
  return out;
}
function sameOrigin(request) {
  const origin=request.headers.get('origin');
  if(!origin) return false;
  try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}
async function readBody(request) {
  const raw=await request.text();
  if(Buffer.byteLength(raw)>24000) throw new Error('REQUEST_TOO_LARGE');
  return JSON.parse(raw||'{}');
}
async function authenticateStaff(request,tx) {
  const token=readCookies(request).__Host-vantoris_staff_session||'';
  if(!token||token.length>200) return null;
  const tokenHash=sha256(token);
  const rows=await tx`SELECT vantoris_ledger.get_staff_profile(${tokenHash}) AS profile`;
  return rows[0]?.profile?{tokenHash,profile:rows[0].profile}:null;
}
async function verifyCsrf(request,tx,auth) {
  const csrf=readCookies(request).__Host-vantoris_staff_csrf||'';
  const header=request.headers.get('x-csrf-token')||'';
  if(!csrf||!header||csrf.length!==header.length||!timingSafeEqual(Buffer.from(csrf),Buffer.from(header))) return false;
  const rows=await tx`SELECT vantoris_ledger.verify_auth_csrf(${auth.tokenHash},${sha256(csrf)}) AS valid`;
  return rows[0]?.valid===true;
}
function requireUuid(value,label) {
  if(typeof value!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error('INVALID_'+label.toUpperCase());
  return value;
}
function normalizeProposal(body) {
  if(body.proposalType==='reverse_journal') {
    const journalId=requireUuid(body.journalId,'journal_id');
    return {type:'reverse_journal',objectReference:journalId,payload:{reason:String(body.reason||'').trim().slice(0,500)}};
  }
  if(body.proposalType==='change_limit') {
    const memberId=requireUuid(body.memberId,'member_id');
    const single=String(body.singleLimitCents||'');
    const daily=String(body.dailyLimitCents||'');
    if(!/^[1-9][0-9]{0,18}$/.test(single)||!/^[1-9][0-9]{0,18}$/.test(daily)) throw new Error('INVALID_LIMIT_VALUES');
    return {type:'change_limit',objectReference:memberId,payload:{member_id:memberId,single_limit_cents:single,daily_limit_cents:daily}};
  }
  if(body.proposalType==='capital_floor') {
    const floor=String(body.minimumUnimpairedCents||'');
    if(!/^[1-9][0-9]{0,18}$/.test(floor)) throw new Error('INVALID_CAPITAL_FLOOR');
    return {type:'capital_floor',objectReference:'institutional-capital',payload:{minimum_unimpaired_cents:floor}};
  }
  if(body.proposalType==='manual_journal') {
    const description=String(body.description||'').trim().slice(0,300);
    if(!description||!Array.isArray(body.entries)||body.entries.length<2||body.entries.length>50) throw new Error('INVALID_MANUAL_JOURNAL');
    const entries=body.entries.map(entry=>{
      const accountReference=String(entry.accountReference||'').trim();
      const amountCents=String(entry.amountCents||'');
      if(!accountReference||accountReference.length>160||! /^-?[1-9][0-9]{0,18}$/.test(amountCents)) throw new Error('INVALID_MANUAL_JOURNAL_LINE');
      return {account_reference:accountReference,amount_cents:amountCents};
    });
    return {type:'manual_journal',objectReference:'manual-journal',payload:{description,entries}};
  }
  throw new Error('UNSUPPORTED_PROPOSAL_TYPE');
}

export default async function handler(request) {
  const url=new URL(request.url),action=url.searchParams.get('action')||'overview';
  if(request.method==='GET'&&action==='overview') {
    try {
      const result=await database().begin(async tx=>{
        const auth=await authenticateStaff(request,tx);
        if(!auth) return null;
        const caps=new Set(auth.profile.capabilities||[]);
        let proposals=[];
        let members=[];
        let accounts=[];
        if(caps.has('staff.action.read')) {
          proposals=await tx`
            SELECT p.id,p.action_type,p.object_reference,p.proposed_by,p.payload,p.status,p.created_at,
              COALESCE((SELECT jsonb_agg(jsonb_build_object('staffReference',a.staff_id,'decision',a.decision,'createdAt',a.created_at) ORDER BY a.created_at)
                FROM vantoris_ledger.staff_action_approvals a WHERE a.proposal_id=p.id),'[]'::jsonb) AS approvals
            FROM vantoris_ledger.staff_action_proposals p ORDER BY p.created_at DESC LIMIT 100
          `;
        }
        if(caps.has('members.view')) {
          members=await tx`SELECT id,member_reference,status,created_at FROM vantoris_ledger.members ORDER BY created_at DESC LIMIT 250`;
        }
        if(caps.has('ledger.read')) {
          accounts=await tx`SELECT id,account_reference,account_type,currency,member_id FROM vantoris_ledger.ledger_accounts ORDER BY created_at DESC LIMIT 500`;
        }
        return {staff:auth.profile,proposals,members,accounts};
      });
      return result?json(result):json({error:'authentication_required'},401);
    } catch(error) {
      const message=String(error?.message||'');
      if(message.includes('STAFF_SESSION_INVALID')) return json({error:'authentication_required'},401);
      return json({error:'staff_service_unavailable'},503);
    }
  }

  if(request.method!=='POST') return json({error:'method_not_allowed'},405);
  if(!sameOrigin(request)) return json({error:'origin_not_allowed'},403);
  let body;
  try{body=await readBody(request);}catch(error){return json({error:error.message==='REQUEST_TOO_LARGE'?'request_too_large':'invalid_json'},error.message==='REQUEST_TOO_LARGE'?413:400);}

  try {
    const result=await database().begin(async tx=>{
      const auth=await authenticateStaff(request,tx);
      if(!auth) return {error:'unauthorized'};
      if(!await verifyCsrf(request,tx,auth)) return {error:'csrf_invalid'};
      if(body.action==='issue_activation_token'||body.action==='issue_password_reset_token') {
        const memberId=requireUuid(body.memberId,'member_id');
        const rawToken=randomBytes(32).toString('base64url');
        const tokenHash=sha256(rawToken);
        const expiresAt=new Date(Date.now()+(body.action==='issue_activation_token'?48:0.5)*60*60*1000);
        const rows=body.action==='issue_activation_token'
          ? await tx`SELECT vantoris_ledger.issue_member_activation_token(${auth.tokenHash},${memberId},${tokenHash},${expiresAt}) AS token_id`
          : await tx`SELECT vantoris_ledger.issue_member_password_reset_token(${auth.tokenHash},${memberId},${tokenHash},${expiresAt}) AS token_id`;
        return {tokenId:rows[0].token_id,oneTimeToken:rawToken,expiresAt:expiresAt.toISOString(),tokenType:body.action==='issue_activation_token'?'member_activation':'password_reset'};
      }
      if(body.action==='propose') {
        const proposal=normalizeProposal(body);
        const rows=await tx`SELECT vantoris_ledger.create_staff_action_proposal(
          ${auth.tokenHash},${proposal.type},${proposal.objectReference},${JSON.stringify(proposal.payload)}::jsonb
        ) AS proposal_id`;
        return {proposalId:rows[0].proposal_id,status:'pending'};
      }
      if(body.action==='approve') {
        const proposalId=requireUuid(body.proposalId,'proposal_id');
        if(!['approve','reject'].includes(body.decision)) return {error:'invalid_decision'};
        const decision=body.decision;
        const rows=await tx`SELECT vantoris_ledger.approve_staff_action_proposal(${auth.tokenHash},${proposalId},${decision}) AS status`;
        return {proposalId,status:rows[0].status};
      }
      if(body.action==='execute') {
        const proposalId=requireUuid(body.proposalId,'proposal_id');
        const rows=await tx`SELECT vantoris_ledger.execute_approved_staff_action(${auth.tokenHash},${proposalId}) AS result`;
        return rows[0].result;
      }
      return {error:'unknown_action'};
    });
    if(result.error==='unauthorized') return json({error:'authentication_required'},401);
    if(result.error==='csrf_invalid') return json({error:'csrf_invalid'},403);
    if(result.error==='invalid_decision') return json({error:'invalid_decision'},400);
    return json(result);
  } catch(error) {
    const message=String(error?.message||'');
    if(message.includes('STAFF_SESSION_INVALID')) return json({error:'authentication_required'},401);
    if(message.includes('STAFF_CAPABILITY_REQUIRED')||message.includes('STAFF_SEPARATION_OF_DUTIES_REQUIRED')||message.includes('SEPARATION_OF_DUTIES_REQUIRED')) return json({error:'staff_capability_or_separation_required'},403);
    if(message.includes('NOT_APPROVED')||message.includes('NOT_PENDING')||message.includes('ALREADY_REVERSED')) return json({error:'proposal_state_conflict'},409);
    if(message.includes('MEMBER_NOT_ELIGIBLE')||message.includes('LIMIT_MEMBER_NOT_ACTIVE')) return json({error:'member_not_eligible'},409);
    if(message.includes('INVALID_ACTIVATION_TOKEN')||message.includes('INVALID_PASSWORD_RESET_TOKEN')||message.includes('STAFF_ACTION_TYPE_NOT_SUPPORTED')) return json({error:'invalid_staff_action'},400);
    if(message.includes('ACCOUNT_NOT_FOUND')||message.includes('JOURNAL_NOT_REVERSIBLE')) return json({error:'referenced_record_not_found_or_reversible'},404);
    if(message.includes('INVALID_')||message.includes('MUST_BALANCE')||message.includes('REQUIRES_TWO')||message.includes('DESCRIPTION_REQUIRED')) return json({error:'invalid_staff_action'},400);
    if(message.includes('CAPITAL_IMPAIRMENT')) return json({error:'permanent_capital_protection_blocked'},409);
    console.error('Vantoris staff action failed:',message.slice(0,180));
    return json({error:'staff_action_unavailable'},503);
  }
}
