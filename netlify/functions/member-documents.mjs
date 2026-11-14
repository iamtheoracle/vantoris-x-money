import postgres from 'postgres';
import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from 'node:crypto';

let client;
function database(){
 if(client)return client;
 const url=process.env.VANTORIS_LEDGER_DATABASE_URL;
 if(!url)throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured.');
 const parsed=new URL(url);
 if(!['postgres:','postgresql:'].includes(parsed.protocol))throw new Error('VANTORIS_LEDGER_DATABASE_URL must be PostgreSQL.');
 client=postgres(url,{ssl:process.env.VANTORIS_DATABASE_SSL==='disable'?false:'require',max:5,idle_timeout:20,connect_timeout:10,prepare:false,onnotice:()=>{}});
 return client;
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const sha256=value=>createHash('sha256').update(value).digest();
function cookie(request,name){
 const header=request.headers.get('cookie')||'';
 for(const item of header.split(';')){
  const [key,...rest]=item.trim().split('=');
  if(key===name)return decodeURIComponent(rest.join('='));
 }
 return null;
}
function sameOrigin(request){
 const origin=request.headers.get('origin');
 if(!origin)return false;
 try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}
function secureEqual(a,b){
 if(!a||!b)return false;
 const left=Buffer.from(a),right=Buffer.from(b);
 return left.length===right.length&&timingSafeEqual(left,right);
}
function encryptionKey(version){
 const value=process.env[`VANTORIS_DOCUMENT_ENCRYPTION_KEY_V${version}`];
 if(!value)throw new Error('DOCUMENT_ENCRYPTION_KEY_UNAVAILABLE');
 const key=Buffer.from(value,'base64');
 if(key.length!==32)throw new Error('DOCUMENT_ENCRYPTION_KEY_INVALID');
 return key;
}
function encryptDocument(plaintext,version){
 const nonce=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',encryptionKey(version),nonce);
 const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final()]);
 return {ciphertext,nonce,authTag:cipher.getAuthTag(),contentHash:sha256(plaintext)};
}
function decryptDocument(row){
 const decipher=createDecipheriv('aes-256-gcm',encryptionKey(row.encryption_key_version),row.nonce);
 decipher.setAuthTag(row.auth_tag);
 const plaintext=Buffer.concat([decipher.update(row.ciphertext),decipher.final()]);
 const digest=sha256(plaintext);
 if(digest.length!==row.content_sha256?.length||!timingSafeEqual(digest,row.content_sha256))throw new Error('IDENTITY_DOCUMENT_INTEGRITY_FAILURE');
 return plaintext;
}
function mediaTypeFromBytes(bytes){
 if(bytes.length>=5&&bytes.subarray(0,5).toString('ascii')==='%PDF-')return 'application/pdf';
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 return null;
}
function safeFilename(name){
 return String(name||'identity-document').normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g,'_').replace(/^\.+/,'').slice(0,180)||'identity-document';
}
async function memberContext(request,tx){
 const token=cookie(request,'__Host-vantoris_session');
 const csrf=cookie(request,'__Host-vantoris_csrf');
 if(!token||!csrf)return null;
 const tokenHash=sha256(token),csrfHash=sha256(csrf);
 const rows=await tx`SELECT vantoris_ledger.resolve_member_session(${tokenHash}) AS member_id`;
 if(!rows[0]?.member_id)return null;
 const valid=await tx`SELECT vantoris_ledger.verify_auth_csrf(${tokenHash},${csrfHash}) AS valid`;
 if(valid[0]?.valid!==true)return null;
 return {memberId:rows[0].member_id,tokenHash};
}
async function staffContext(request,tx){
 const token=cookie(request,'__Host-vantoris_staff_session');
 const csrf=cookie(request,'__Host-vantoris_staff_csrf');
 if(!token||!csrf)return null;
 const tokenHash=sha256(token),csrfHash=sha256(csrf);
 const rows=await tx`SELECT vantoris_ledger.get_staff_profile(${tokenHash}) AS profile`;
 const profile=rows[0]?.profile;
 if(!profile?.id||!Array.isArray(profile.capabilities)||!profile.capabilities.includes('identity.review'))return null;
 const valid=await tx`SELECT vantoris_ledger.verify_auth_csrf(${tokenHash},${csrfHash}) AS valid`;
 if(valid[0]?.valid!==true)return null;
 return {staffId:profile.id,tokenHash};
}
function fileResponse(row,plaintext){
 const name=safeFilename(row.original_filename);
 return new Response(plaintext,{status:200,headers:{
  'content-type':row.media_type,
  'content-length':String(plaintext.length),
  'content-disposition':`inline; filename="${name}"`,
  'cache-control':'no-store, private',
  'pragma':'no-cache',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'content-security-policy':"sandbox; default-src 'none';"
 }});
}
export default async function handler(request){
 try{
  const url=new URL(request.url);
  if(request.method==='GET'&&url.searchParams.get('action')==='list'){
   const rows=await database().begin(async tx=>{
    const auth=await memberContext(request,tx);if(!auth)return null;
    return await tx`SELECT id,document_type,media_type,review_status,created_at,reviewed_at,original_filename
      FROM vantoris_ledger.member_identity_documents WHERE member_id=${auth.memberId}
      ORDER BY created_at DESC,id DESC`;
   });
   return rows?json({documents:rows.map(d=>({id:d.id,documentType:d.document_type,mediaType:d.media_type,reviewStatus:d.review_status,createdAt:d.created_at,reviewedAt:d.reviewed_at,filename:d.original_filename}))}):json({error:'authentication_required'},401);
  }
  if(request.method==='GET'&&url.searchParams.has('id')){
   const documentId=url.searchParams.get('id');
   if(!/^[0-9a-f-]{36}$/i.test(documentId||''))return json({error:'invalid_document_id'},400);
   const result=await database().begin(async tx=>{
    const member=await memberContext(request,tx);
    if(member){
     const rows=await tx`SELECT * FROM vantoris_ledger.read_member_identity_document(${member.tokenHash},${documentId}::uuid)`;
     return rows[0]||null;
    }
    const staff=await staffContext(request,tx);
    if(!staff)return null;
    const rows=await tx`SELECT * FROM vantoris_ledger.read_staff_identity_document(${staff.tokenHash},${documentId}::uuid)`;
    return rows[0]||null;
   });
   if(!result)return json({error:'document_not_found_or_not_authorized'},404);
   try{return fileResponse(result,decryptDocument(result));}catch(e){if(String(e.message).startsWith('DOCUMENT_ENCRYPTION_KEY'))return json({error:'document_decryption_unavailable'},503);throw e;}
  }
  if(request.method==='POST'){
   if(!sameOrigin(request))return json({error:'origin_invalid'},403);
   const form=await request.formData();
   const file=form.get('file'),documentType=String(form.get('documentType')||'');
   if(!file||typeof file.arrayBuffer!=='function')return json({error:'document_file_required'},400);
   if(file.size<1||file.size>4194304)return json({error:'document_size_invalid'},400);
   if(!['government_id','proof_of_address','selfie','business_document','other'].includes(documentType))return json({error:'document_type_invalid'},400);
   const plaintext=Buffer.from(await file.arrayBuffer());
   const mediaType=mediaTypeFromBytes(plaintext);
   if(!mediaType||mediaType!==file.type)return json({error:'document_media_type_invalid'},400);
   const version=Number(process.env.VANTORIS_DOCUMENT_KEY_VERSION||'1');
   const encrypted=encryptDocument(plaintext,version);
   const filename=safeFilename(file.name);
   const stored=await database().begin(async tx=>{
    const auth=await memberContext(request,tx);if(!auth)return {error:'authentication_required'};
    const rows=await tx`SELECT vantoris_ledger.store_member_identity_document(
      ${auth.tokenHash},${documentType},${encrypted.ciphertext},${encrypted.nonce},${encrypted.authTag},
      ${version},${encrypted.contentHash},${mediaType},${filename}) AS document_id`;
    return {documentId:rows[0].document_id};
   });
   if(stored.error)return json({error:stored.error},401);
   return json({documentId:stored.documentId,status:'received'},201);
  }
  return json({error:'method_not_allowed'},405);
 }catch(error){
  const message=String(error?.message||'');
  if(message.includes('IDENTITY_DOCUMENT_NOT_FOUND'))return json({error:'document_not_found'},404);
  if(message.includes('STAFF_CAPABILITY_REQUIRED'))return json({error:'staff_capability_required'},403);
  if(message.includes('DOCUMENT_ENCRYPTION_KEY'))return json({error:'document_encryption_unavailable'},503);
  if(message.includes('IDENTITY_DOCUMENT_INTEGRITY_FAILURE'))return json({error:'document_integrity_failure'},500);
  return json({error:'document_service_unavailable'},503);
 }
}
