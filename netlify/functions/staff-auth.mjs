import postgres from 'postgres';
import { createDecipheriv, createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
let sql;

function database() {
  if (sql) return sql;
  const url = process.env.VANTORIS_LEDGER_DATABASE_URL;
  if (!url) throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured');
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Vantoris ledger URL must use PostgreSQL');
  sql = postgres(url, { ssl: process.env.VANTORIS_DATABASE_SSL === 'disable' ? false : 'require', max: 6, idle_timeout: 20, connect_timeout: 10, prepare: false, onnotice: () => {} });
  return sql;
}

const sha256 = value => createHash('sha256').update(value).digest();
const json = (body,status=200,cookies=[]) => {
  const headers = new Headers({ 'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer' });
  for (const cookie of cookies) headers.append('set-cookie',cookie);
  return new Response(JSON.stringify(body),{status,headers});
};
function readCookies(request) {
  const out={};
  for (const part of (request.headers.get('cookie')||'').split(';')) {
    const index=part.indexOf('=');
    if(index<0) continue;
    try { out[part.slice(0,index).trim()]=decodeURIComponent(part.slice(index+1).trim()); } catch {}
  }
  return out;
}
function sameOrigin(request) {
  const origin=request.headers.get('origin');
  if(!origin) return false;
  try { return new URL(origin).origin===new URL(request.url).origin; } catch { return false; }
}
const staffSessionCookie = value => `__Host-vantoris_staff_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
const staffCsrfCookie = value => `__Host-vantoris_staff_csrf=${value}; Path=/; Secure; SameSite=Strict; Max-Age=28800`;
const clearCookies = [
  '__Host-vantoris_staff_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  '__Host-vantoris_staff_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0',
];

async function verifyPassword(password,encoded) {
  const parts=String(encoded||'').split('$');
  if(parts.length!==6||parts[0]!=='scrypt') return false;
  const N=Number(parts[1]),r=Number(parts[2]),p=Number(parts[3]),salt=Buffer.from(parts[4],'base64'),expected=Buffer.from(parts[5],'base64');
  if(!Number.isInteger(N)||N<16384||N>131072||!Number.isInteger(r)||r<1||r>16||!Number.isInteger(p)||p<1||p>4||salt.length<16||expected.length!==64) return false;
  const actual=await scryptAsync(password,salt,expected.length,{N,r,p,maxmem:64*1024*1024});
  return timingSafeEqual(Buffer.from(actual),expected);
}
async function dummyPasswordWork(password) {
  await scryptAsync(password,Buffer.from('dmFudG9yaXMtaW52YWxpZC1zdGFmZi1zYWx0'),64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
}
function base32Decode(value) {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', clean=String(value).toUpperCase().replace(/=+|\s+/g,'');
  let bits=0,buffer=0; const output=[];
  for(const character of clean) {
    const digit=alphabet.indexOf(character); if(digit<0) throw new Error('INVALID_MFA_SECRET');
    buffer=(buffer<<5)|digit; bits+=5;
    if(bits>=8){output.push((buffer>>>(bits-8))&255);bits-=8;}
  }
  return Buffer.from(output);
}
function decryptSecret(row) {
  const key=Buffer.from(process.env.VANTORIS_MFA_ENCRYPTION_KEY||'','base64');
  if(key.length!==32) throw new Error('VANTORIS_MFA_ENCRYPTION_KEY must be a 32-byte base64 key');
  const decipher=createDecipheriv('aes-256-gcm',key,row.nonce);
  decipher.setAuthTag(row.auth_tag);
  return base32Decode(Buffer.concat([decipher.update(row.secret_ciphertext),decipher.final()]).toString('utf8'));
}
function verifyTotp(secret,code,now=Date.now()) {
  if(!/^\d{6}$/.test(String(code||''))) return false;
  const supplied=Buffer.from(String(code)), counter=Math.floor(now/30000);
  for(let drift=-1;drift<=1;drift++){
    const moving=Buffer.alloc(8); moving.writeBigUInt64BE(BigInt(counter+drift));
    const digest=createHmac('sha1',secret).update(moving).digest(),offset=digest[digest.length-1]&15;
    const binary=((digest[offset]&127)<<24)|((digest[offset+1]&255)<<16)|((digest[offset+2]&255)<<8)|(digest[offset+3]&255);
    const expected=Buffer.from(String(binary%1000000).padStart(6,'0'));
    if(timingSafeEqual(expected,supplied)) return true;
  }
  return false;
}
async function readBody(request) {
  const length=Number(request.headers.get('content-length')||0);
  if(length>12000) throw new Error('REQUEST_TOO_LARGE');
  const raw=await request.text();
  if(Buffer.byteLength(raw)>12000) throw new Error('REQUEST_TOO_LARGE');
  return JSON.parse(raw||'{}');
}
function ipFingerprint(request) {
  const ip=request.headers.get('x-nf-client-connection-ip')||(request.headers.get('x-forwarded-for')||'').split(',')[0].trim()||'unknown';
  return sha256(ip);
}

async function login(request,body) {
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const password=typeof body.password==='string'?body.password:'';
  const otp=typeof body.otp==='string'?body.otp.trim():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!password||password.length>1024) return json({error:'invalid_credentials'},401);
  const db=database(), emailHash=sha256(email), ipHash=ipFingerprint(request);
  const locked=await db`SELECT vantoris_ledger.is_login_locked(${emailHash},${ipHash}) AS locked`;
  if(locked[0]?.locked) return json({error:'login_temporarily_locked'},429);

  const result=await db.begin(async tx=>{
    const rows=await tx`SELECT id,email,password_hash,status,mfa_required FROM vantoris_ledger.staff_users WHERE lower(email)=${email}`;
    const staff=rows[0];
    if(!staff||staff.status!=='active'||staff.mfa_required!==true) {
      await dummyPasswordWork(password);
      await tx`SELECT vantoris_ledger.record_login_failure(${emailHash},${ipHash})`;
      return {error:'invalid'};
    }
    if(!await verifyPassword(password,staff.password_hash)) {
      await tx`SELECT vantoris_ledger.record_login_failure(${emailHash},${ipHash})`;
      return {error:'invalid'};
    }
    const factors=await tx`SELECT secret_ciphertext,nonce,auth_tag FROM vantoris_ledger.staff_mfa_factors
      WHERE staff_id=${staff.id} AND verified_at IS NOT NULL AND disabled_at IS NULL ORDER BY enrolled_at DESC LIMIT 1`;
    if(!factors.length) return {error:'staff_mfa_not_provisioned'};
    if(!otp) return {error:'mfa_required'};
    let secret;
    try { secret=decryptSecret(factors[0]); } catch { return {error:'mfa_unavailable'}; }
    if(!verifyTotp(secret,otp)) {
      await tx`SELECT vantoris_ledger.record_login_failure(${emailHash},${ipHash})`;
      return {error:'invalid'};
    }
    const sessionToken=randomBytes(32).toString('base64url'),csrfToken=randomBytes(32).toString('base64url');
    const tokenHash=sha256(sessionToken),csrfHash=sha256(csrfToken),expiresAt=new Date(Date.now()+8*60*60*1000);
    await tx`SELECT vantoris_ledger.create_staff_session(${staff.id},${tokenHash},${csrfHash},${expiresAt},${new Date()})`;
    const profiles=await tx`SELECT vantoris_ledger.get_staff_profile(${tokenHash}) AS profile`;
    const profile=profiles[0]?.profile;
    if(!profile||!Array.isArray(profile.capabilities)||profile.capabilities.length===0) return {error:'staff_not_authorized'};
    await tx`SELECT vantoris_ledger.clear_login_failures(${emailHash},${ipHash})`;
    return {profile,sessionToken,csrfToken};
  });
  if(result.error==='mfa_required') return json({error:'mfa_required',message:'Enter your Vantoris staff authenticator code.'},200);
  if(result.error==='staff_mfa_not_provisioned') return json({error:'staff_mfa_not_provisioned',message:'Staff MFA must be provisioned by Vantoris security administration.'},403);
  if(result.error==='mfa_unavailable') return json({error:'mfa_unavailable'},503);
  if(result.error==='staff_not_authorized') return json({error:'staff_not_authorized'},403);
  if(result.error) return json({error:'invalid_credentials'},401);
  return json({staff:result.profile},200,[staffSessionCookie(result.sessionToken),staffCsrfCookie(result.csrfToken)]);
}

export default async function handler(request) {
  const url=new URL(request.url),action=url.searchParams.get('action')||'me';
  if(request.method==='GET'&&action==='me') {
    const token=readCookies(request).__Host-vantoris_staff_session;
    if(!token) return json({error:'authentication_required'},401);
    try {
      const rows=await database()`SELECT vantoris_ledger.get_staff_profile(${sha256(token)}) AS staff`;
      return rows[0]?.staff?json({staff:rows[0].staff}):json({error:'authentication_required'},401);
    } catch { return json({error:'authentication_required'},401); }
  }
  if(request.method!=='POST') return json({error:'method_not_allowed'},405);
  if(!sameOrigin(request)) return json({error:'origin_not_allowed'},403);
  let body;
  try { body=await readBody(request); }
  catch(error){return json({error:error.message==='REQUEST_TOO_LARGE'?'request_too_large':'invalid_json',},error.message==='REQUEST_TOO_LARGE'?413:400);}
  try {
    if(body.action==='login') return await login(request,body);
    if(body.action==='logout') {
      const cookie=readCookies(request),token=cookie.__Host-vantoris_staff_session||'',csrf=cookie.__Host-vantoris_staff_csrf||'',header=request.headers.get('x-csrf-token')||'';
      if(!token||!csrf||!header||csrf.length!==header.length||!timingSafeEqual(Buffer.from(csrf),Buffer.from(header))) return json({error:'csrf_invalid'},403);
      const tokenHash=sha256(token),csrfHash=sha256(csrf);
      const valid=await database()`SELECT vantoris_ledger.verify_auth_csrf(${tokenHash},${csrfHash}) AS valid`;
      if(valid[0]?.valid!==true) return json({error:'csrf_invalid'},403);
      await database()`SELECT vantoris_ledger.revoke_auth_session(${tokenHash})`;
      return json({ok:true},200,clearCookies);
    }
    return json({error:'unknown_action'},400);
  } catch(error) {
    const message=String(error?.message||'');
    if(message.includes('STAFF_SESSION_INVALID')) return json({error:'authentication_required'},401);
    console.error('Vantoris staff authentication failed:',message.slice(0,160));
    return json({error:'staff_service_unavailable'},503);
  }
}
