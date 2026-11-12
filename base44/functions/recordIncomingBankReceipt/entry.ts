import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  recordIncomingReceipt, linkIncomingReceipt, verifyAndPostIncomingReceipt,
  acquireLease, releaseLease,
} from '../_shared/paymentStore.ts';

const RECORD_ROLES = new Set(['admin','administrator','super_administrator','executive','operations_officer','operations_manager','finance_officer','treasury_officer','compliance_officer']);
const VERIFY_ROLES = new Set(['admin','administrator','super_administrator','finance_officer','treasury_officer','compliance_officer']);
const clean = (v: unknown, max = 500) => typeof v === 'string' ? v.trim().slice(0,max) : '';

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({error:'Method not allowed'},{status:405});
  try {
    const base44=createClientFromRequest(req);
    const staff=await base44.auth.me();
    if(!staff?.id || !RECORD_ROLES.has(staff.role)) return Response.json({error:'Authorized staff only.'},{status:403});
    const body=await req.json().catch(()=>null);
    const action=clean(body?.action,32);
    const now=new Date().toISOString();

    if(action==='record_receipt'){
      const accountId=clean(body?.account_id,128);
      const memberUserId=clean(body?.member_user_id,128);
      const rail=clean(body?.rail,16);
      const bankReference=clean(body?.bank_reference,120);
      const evidence=clean(body?.evidence_reference,500);
      const idempotencyKey=clean(body?.idempotency_key,100);
      const amount=body?.amount_cents;
      const note=clean(body?.note,500);
      if(!accountId||!memberUserId||!['ACH','FEDWIRE'].includes(rail)||!bankReference||!evidence||
         !/^[A-Za-z0-9._:-]{16,100}$/.test(idempotencyKey)||!Number.isSafeInteger(amount)||amount<1||amount>100000000){
        return Response.json({error:'Account, member, ACH/Fedwire rail, amount, bank reference, evidence locator and idempotency key are required.'},{status:400});
      }
      const account=await base44.asServiceRole.entities.Account.get(accountId);
      if(!account||account.user_id!==memberUserId||account.status!=='active') return Response.json({error:'Target member account is unavailable or does not belong to that member.'},{status:404});
      if(account.currency!=='USD') return Response.json({error:'Target member account does not have a verified USD currency record. No receipt was recorded.'},{status:409});

      const transactional = await recordIncomingReceipt({
        rail:rail as 'ACH'|'FEDWIRE', bankReference,
        idempotencyKey:`${memberUserId}:${idempotencyKey}`,
        memberAccountRef:accountId, amountCents:amount,
        evidenceReference:evidence, recordedBy:staff.id,
      });
      const lease=await acquireLease(`incoming-receipt-projection:${transactional.id}`,crypto.randomUUID(),120);
      if(!lease) return Response.json({error:'Receipt projection is being recorded by another worker. Retry with the same idempotency key.'},{status:409});
      try {
        const duplicate=await base44.asServiceRole.entities.IncomingBankReceipt.filter({member_user_id:memberUserId,idempotency_key:idempotencyKey});
        if(duplicate?.length){
          await linkIncomingReceipt(transactional.id,duplicate[0].id);
          return Response.json({receipt:{id:duplicate[0].id,status:duplicate[0].status},duplicate:true,ledger_posted:duplicate[0].ledger_posting_status==='posted'},{status:200});
        }
        const receipt=await base44.asServiceRole.entities.IncomingBankReceipt.create({
          member_user_id:memberUserId,account_id:accountId,rail,amount_cents:amount,currency:'USD',
          bank_reference:bankReference,idempotency_key:idempotencyKey,evidence_reference:evidence,
          transactional_receipt_id:transactional.id,status:'awaiting_verification',
          recorded_by_user_id:staff.id,recorded_at:now,record_note:note,ledger_posting_status:'not_posted'
        });
        await linkIncomingReceipt(transactional.id,receipt.id);
        await Promise.allSettled([
          base44.asServiceRole.entities.AuditLog.create({
            action_type:'incoming_bank_receipt_recorded',
            description:`Manual incoming ${rail} receipt recorded pending independent verification`,
            details:JSON.stringify({receiptId:receipt.id,transactionalReceiptId:transactional.id,memberUserId,accountId,amountCents:amount,bankReference,evidenceReference:evidence,staffUserId:staff.id}),
            target_user_id:memberUserId,user_id:staff.id
          }),
          base44.asServiceRole.entities.Notification.create({
            user_id:memberUserId,title:'Incoming payment under verification',
            message:'The institution recorded an incoming bank payment for independent verification. Your available balance has not been credited.',
            type:'info',read:false
          })
        ]);
        return Response.json({receipt:{id:receipt.id,status:receipt.status,bank_reference:receipt.bank_reference},ledger_posted:false,message:'Receipt recorded in the transactional payment store. Funds have not been credited pending independent verification.'},{status:201});
      } finally {
        await releaseLease(lease).catch(()=>false);
      }
    }

    if(!['verify_received','record_return','reject_receipt'].includes(action)) return Response.json({error:'Valid action is required.'},{status:400});
    if(!VERIFY_ROLES.has(staff.role)) return Response.json({error:'A finance, treasury, compliance or administrator verifier is required.'},{status:403});
    const receiptId=clean(body?.receipt_id,128);
    const evidence=clean(body?.evidence_reference,500);
    const note=clean(body?.note,500);
    if(!receiptId||!evidence) return Response.json({error:'Receipt ID and independent bank evidence reference are required.'},{status:400});
    const receipt=await base44.asServiceRole.entities.IncomingBankReceipt.get(receiptId);
    if(!receipt) return Response.json({error:'Incoming receipt not found.'},{status:404});
    if(!receipt.transactional_receipt_id) return Response.json({error:'This legacy receipt has no transactional-store link. Escalate for controlled migration; it cannot be auto-credited.'},{status:409});
    if(receipt.recorded_by_user_id===staff.id) return Response.json({error:'The verifier must be a different staff member from the person who recorded the receipt.'},{status:403});

    const clearingLedgerAccountId = receipt.rail==='ACH'
      ? Deno.env.get('VANTORIS_ACH_CLEARING_LEDGER_ACCOUNT_ID') || ''
      : Deno.env.get('VANTORIS_FEDWIRE_CLEARING_LEDGER_ACCOUNT_ID') || '';
    if(action==='verify_received' && !clearingLedgerAccountId) {
      return Response.json({error:'The approved bank-clearing ledger account is not configured. No ledger posting was made.'},{status:503});
    }
    const result=await verifyAndPostIncomingReceipt({
      receiptId:receipt.transactional_receipt_id,actorId:staff.id,
      action:action as 'verify_received'|'record_return'|'reject_receipt',
      evidenceReference:evidence,clearingLedgerAccountId,
    });
    const next=result.status;
    if(receipt.status!==next || (result.journalId && receipt.ledger_transaction_id!==result.journalId)){
      const claim=await base44.asServiceRole.entities.IncomingBankReceipt.updateMany(
        {id:receiptId,status:receipt.status},
        {$set:{
          status:next,verified_by_user_id:staff.id,verified_at:now,
          verification_evidence_reference:evidence,verification_note:note,
          ...(result.journalId?{ledger_transaction_id:result.journalId}:{}),
          ledger_posting_status:next==='verified_received'?'posted':next==='returned'&&result.journalId?'reversed':'not_posted'
        }}
      );
      if(!claim?.success||claim.updated!==1) {
        return Response.json({error:'Transactional receipt action committed, but the Base44 display projection needs retry. Do not repeat the bank receipt; retry this same action or escalate.'},{status:503});
      }
    }
    await Promise.allSettled([
      base44.asServiceRole.entities.AuditLog.create({
        action_type:`incoming_bank_receipt_${action}`,
        description:`Incoming ${receipt.rail} receipt independently ${next}`,
        details:JSON.stringify({receiptId,transactionalReceiptId:receipt.transactional_receipt_id,memberUserId:receipt.member_user_id,amountCents:receipt.amount_cents,bankReference:receipt.bank_reference,recorderUserId:receipt.recorded_by_user_id,verifierUserId:staff.id,evidenceReference:evidence,journalId:result.journalId||null,duplicate:result.duplicate}),
        target_user_id:receipt.member_user_id,user_id:staff.id
      }),
      base44.asServiceRole.entities.Notification.create({
        user_id:receipt.member_user_id,
        title:next==='verified_received'?'Incoming payment verified':next==='returned'?'Incoming payment returned':'Incoming payment exception',
        message:next==='verified_received'?'The incoming receipt was independently verified and posted to the institution’s transactional ledger. Account balance display reconciliation remains a separate step.':next==='returned'?'The bank return was recorded and the corresponding ledger reversal was created.':'The incoming payment requires follow-up with client services.',
        type:next==='verified_received'?'info':'warning',read:false
      })
    ]);
    return Response.json({receipt:{id:receiptId,status:next},ledger_posted:next==='verified_received',journal_id:result.journalId||null,duplicate:result.duplicate});
  } catch (error) {
    const message=error instanceof Error?error.message:'Unknown error';
    const conflict=/CONFLICT|SEPARATION_OF_DUTIES|ALREADY_REVERSED/.test(message);
    return Response.json({error:'Incoming receipt action failed or requires review. No unverified receipt is credited.',detail:message},{status:conflict?409:503});
  }
}
