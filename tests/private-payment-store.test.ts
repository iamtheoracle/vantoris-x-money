import { assertStaffIsNotRequester } from '../base44/functions/_shared/paymentAuthorization.ts';
function assert(condition:unknown,message='Assertion failed'):asserts condition {
  if(!condition) throw new Error(message);
}
function assertEquals<T>(actual:T,expected:T):void {
  if(actual!==expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
}
async function assertRejects(fn:()=>Promise<unknown>):Promise<Error> {
  try { await fn(); } catch(error) { return error instanceof Error ? error : new Error(String(error)); }
  throw new Error('Expected operation to reject');
}
import {
  acquireLease, releaseLease, renewLease, claimPaymentOperation,
  ingestProviderEvent, postBalancedJournal, reverseJournal, processPlaidProviderEvent,
  recordIncomingReceipt, linkIncomingReceipt, verifyAndPostIncomingReceipt, closePaymentStore,
  reserveOutgoingFunds, transitionOutgoingFundsHold,
} from '../base44/functions/_shared/paymentStore.ts';

Deno.test('Vantoris transfer requester cannot act as reviewer, approver, or submitter',()=>{
  assertStaffIsNotRequester('staff-2','member-1');
  let rejected=false;
  try { assertStaffIsNotRequester('member-1','member-1'); } catch(error) {
    rejected=error instanceof Error && error.message==='SEPARATION_OF_DUTIES_REQUESTER_CONFLICT';
  }
  assert(rejected,'Requester self-approval must be rejected.');
});

Deno.test('Vantoris provider idempotency key is stable and member-scoped',async()=>{
  const {deriveProviderIdempotencyKey}=await import('../base44/functions/_shared/paymentStore.ts');
  const first=await deriveProviderIdempotencyKey('member-a','same-client-key');
  const retry=await deriveProviderIdempotencyKey('member-a','same-client-key');
  const other=await deriveProviderIdempotencyKey('member-b','same-client-key');
  assertEquals(first,retry);
  assert(first!==other);
  assertEquals(first.length,36);
});

const enabled = !!Deno.env.get('VANTAGE_LEDGER_TEST_DATABASE_URL');
Deno.test({
  name: 'Vantoris PostgreSQL payment store integration',
  ignore: !enabled,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testUrl=Deno.env.get('VANTAGE_LEDGER_TEST_DATABASE_URL');
    if(!testUrl) throw new Error('VANTAGE_LEDGER_TEST_DATABASE_URL is required for integration tests.');
    Deno.env.set('VANTAGE_LEDGER_DATABASE_URL',testUrl);
    const key = `test-${crypto.randomUUID()}`;
    try {
      const claims = await Promise.all(Array.from({length:20},()=>claimPaymentOperation({
        operationType:'integration_test', idempotencyKey:key, request:{amount:100,nonce:key}
      })));
      assertEquals(claims.filter(x=>x.created).length,1);
      assertEquals(new Set(claims.map(x=>x.id)).size,1);

      const mismatch = await assertRejects(()=>claimPaymentOperation({
        operationType:'integration_test', idempotencyKey:key, request:{amount:101,nonce:key}
      }));
      assert(mismatch.message.includes('IDEMPOTENCY_CONFLICT'));

      const eventKey=`evt-${crypto.randomUUID()}`;
      const eventInput={providerId:'test-provider',environment:'sandbox' as const,
        providerEventId:eventKey,eventType:'TEST',payload:{eventKey,amount:1},verifiedAt:new Date().toISOString()};
      const events=await Promise.all(Array.from({length:10},()=>ingestProviderEvent(eventInput)));
      assertEquals(events.filter(x=>!x.duplicate).length,1);
      assertEquals(new Set(events.map(x=>x.id)).size,1);

      const lockName=`test-lock-${crypto.randomUUID()}`;
      const ownerA=crypto.randomUUID(), ownerB=crypto.randomUUID();
      const leaseA=await acquireLease(lockName,ownerA,15);
      assert(leaseA);
      assertEquals(await acquireLease(lockName,ownerB,15),null);
      await new Promise(resolve=>setTimeout(resolve,16000));
      const leaseB=await acquireLease(lockName,ownerB,15);
      assert(leaseB);
      assert(leaseB!.fencingToken>leaseA!.fencingToken);
      assertEquals(await renewLease(leaseA!,15),false);
      assertEquals(await releaseLease(leaseA!),false);
      assertEquals(await renewLease(leaseB!,15),true);
      assertEquals(await releaseLease(leaseB!),true);

      const accountA=crypto.randomUUID(), accountB=crypto.randomUUID();
      // Test fixture accounts are intentionally unique and isolated.
      const postgres = (await import('npm:postgres@3.4.7')).default;
      const db=postgres(Deno.env.get('VANTAGE_LEDGER_DATABASE_URL')!,{ssl:'require',prepare:false});
      await db`INSERT INTO avcu_payments.ledger_accounts(id,external_account_ref,account_type) VALUES
        (${accountA},${'test:'+accountA},'member_deposit'),
        (${accountB},${'test:'+accountB},'bank_clearing')`;
      try {
        // Seed a 5,000-cent posted member balance; negative ledger entries are credits.
        await postBalancedJournal({sourceType:'test_opening',sourceId:key,idempotencyKey:`opening-${key}`,
          description:'Integration test opening balance',entries:[
            {ledgerAccountId:accountA,amountCents:-5000},{ledgerAccountId:accountB,amountCents:5000}
          ]});
        const holdOperationA=await claimPaymentOperation({operationType:'outgoing_transfer_request',
          idempotencyKey:`hold-a-${key}`,request:{amountCents:4000,account:accountA}});
        const holdOperationB=await claimPaymentOperation({operationType:'outgoing_transfer_request',
          idempotencyKey:`hold-b-${key}`,request:{amountCents:4000,account:accountA}});
        const holdAttempts=await Promise.allSettled([
          reserveOutgoingFunds({operationId:holdOperationA.id,accountRef:`test:${accountA}`,
            amountCents:4000,actorId:'integration-test'}),
          reserveOutgoingFunds({operationId:holdOperationB.id,accountRef:`test:${accountA}`,
            amountCents:4000,actorId:'integration-test'}),
        ]);
        assert(holdAttempts.filter(x=>x.status==='fulfilled').length===1,
          'Only one concurrent reservation may consume the 5,000-cent available balance.');
        assertEquals(holdAttempts.filter(x=>x.status==='rejected').length,1);
        const winningOperation=holdAttempts[0].status==='fulfilled'?holdOperationA:holdOperationB;
        const winningHold=await reserveOutgoingFunds({operationId:winningOperation.id,
          accountRef:`test:${accountA}`,amountCents:4000,actorId:'integration-test'});
        assertEquals(winningHold.duplicate,true);
        assertEquals(winningHold.availableAfterCents,1000);
        const heldDebit=await assertRejects(()=>postBalancedJournal({
          sourceType:'test_competing_debit',sourceId:key,idempotencyKey:`held-debit-${key}`,
          description:'Must not consume funds reserved for an outgoing transfer',
          entries:[{ledgerAccountId:accountA,amountCents:2000},{ledgerAccountId:accountB,amountCents:-2000}]
        }));
        assert(heldDebit.message.includes('INSUFFICIENT_AVAILABLE_FUNDS_AFTER_HOLDS'),
          'Ledger debits must respect active outgoing reservations.');
        assertEquals(await transitionOutgoingFundsHold({operationId:winningOperation.id,
          status:'released',actorId:'integration-test',reason:'Test release'}),true);
        const afterRelease=await reserveOutgoingFunds({operationId:winningOperation.id,
          accountRef:`test:${accountA}`,amountCents:4000,actorId:'integration-test'}).catch(()=>null);
        assert(afterRelease===null,'A finalized hold must not be reactivated by retry.');

        const journal=await postBalancedJournal({sourceType:'test',sourceId:key,idempotencyKey:`journal-${key}`,
          description:'Integration test journal',entries:[
            {ledgerAccountId:accountA,amountCents:1000},{ledgerAccountId:accountB,amountCents:-1000}
          ]});
        assertEquals(journal.duplicate,false);
        const retries=await Promise.all(Array.from({length:8},()=>postBalancedJournal({
          sourceType:'test',sourceId:key,idempotencyKey:`journal-${key}`,
          description:'Integration test journal',entries:[
            {ledgerAccountId:accountA,amountCents:1000},{ledgerAccountId:accountB,amountCents:-1000}
          ]
        })));
        assertEquals(new Set(retries.map(x=>x.journalId)).size,1);
        assertEquals(retries.filter(x=>!x.duplicate).length,0);
        assertEquals(retries[0].journalId,journal.journalId);
        await assertRejects(()=>postBalancedJournal({
          sourceType:'test',sourceId:key,idempotencyKey:`journal-${key}`,
          description:'Conflicting idempotency payload',
          entries:[{ledgerAccountId:accountA,amountCents:2000},{ledgerAccountId:accountB,amountCents:-2000}]
        }));
        const reversal=await reverseJournal({originalJournalId:journal.journalId,
          idempotencyKey:`reversal-${key}`,actorId:'integration-test',reason:'Integration test reversal'});
        assertEquals(reversal.duplicate,false);
        const reversalRetry=await reverseJournal({originalJournalId:journal.journalId,
          idempotencyKey:`reversal-${key}`,actorId:'integration-test',reason:'Integration test reversal'});
        assertEquals(reversalRetry.journalId,reversal.journalId);
        await assertRejects(()=>reverseJournal({originalJournalId:journal.journalId,
          idempotencyKey:`different-reversal-${key}`,actorId:'integration-test',reason:'Second reversal'}));

        const transferId=crypto.randomUUID();
        const providerTransferId=`plaid-test-${key}`;
        const settlementOperation=await claimPaymentOperation({operationType:'outgoing_transfer_request',
          idempotencyKey:`transfer-test:${key}`,request:{amountCents:1000,account:accountA}});
        await reserveOutgoingFunds({operationId:settlementOperation.id,accountRef:`test:${accountA}`,
          amountCents:1000,actorId:'integration-test'});
        await db`INSERT INTO avcu_payments.payment_transfers
          (id,base44_transfer_request_id,idempotency_key,source_account_ref,provider_id,
           provider_transfer_id,rail,amount_cents,status)
          VALUES (${transferId},${'base44-test:'+key},${'transfer-test:'+key},
            ${'test:'+accountA},'plaid',${providerTransferId},'ACH',1000,'submitted_to_bank')`;
        const postedEventId=crypto.randomUUID();
        await db`INSERT INTO avcu_payments.provider_events
          (id,provider_id,environment,provider_event_id,transfer_reference,event_type,
           event_sequence,payload_hash,amount_cents,currency,verified_at)
          VALUES (${postedEventId},'plaid','sandbox',${'posted:'+key},${providerTransferId},
            'posted',1,${'a'.repeat(64)},1000,'USD',clock_timestamp())`;
        const posted=await processPlaidProviderEvent({
          providerEventId:`posted:${key}`,environment:'sandbox',
          clearingLedgerAccountIds:{ACH:accountB,FEDWIRE:accountB}
        });
        assertEquals(posted.status,'settled');
        assert(posted.journalId);
        const capturedHold=await db`
          SELECT h.status FROM avcu_payments.outgoing_funds_holds h
          WHERE h.operation_id=${settlementOperation.id}
        `;
        assert(capturedHold[0]?.status==='captured','Settlement must capture the active funds hold atomically.');
        const outgoingSigns=await db`
          SELECT ledger_account_id,amount_cents FROM avcu_payments.ledger_entries
           WHERE journal_id=${posted.journalId}
        `;
        assertEquals(Number(outgoingSigns.find(x=>x.ledger_account_id===accountA)?.amount_cents),1000);
        assertEquals(Number(outgoingSigns.find(x=>x.ledger_account_id===accountB)?.amount_cents),-1000);
        const returnedEventId=crypto.randomUUID();
        await db`INSERT INTO avcu_payments.provider_events
          (id,provider_id,environment,provider_event_id,transfer_reference,event_type,
           event_sequence,payload_hash,amount_cents,currency,verified_at)
          VALUES (${returnedEventId},'plaid','sandbox',${'returned:'+key},${providerTransferId},
            'returned',2,${'b'.repeat(64)},1000,'USD',clock_timestamp())`;
        const returned=await processPlaidProviderEvent({
          providerEventId:`returned:${key}`,environment:'sandbox',
          clearingLedgerAccountIds:{ACH:accountB,FEDWIRE:accountB}
        });
        assertEquals(returned.status,'returned');
        assert(returned.journalId);
        const balances=await db`
          SELECT count(*)::int AS entry_count, sum(amount_cents)::bigint AS net
            FROM avcu_payments.ledger_entries WHERE journal_id=${returned.journalId}
        `;
        assertEquals(balances[0].entry_count,2);
        assertEquals(Number(balances[0].net),0);
        const outgoingReversalSigns=await db`
          SELECT ledger_account_id,amount_cents FROM avcu_payments.ledger_entries
           WHERE journal_id=${returned.journalId}
        `;
        assertEquals(Number(outgoingReversalSigns.find(x=>x.ledger_account_id===accountA)?.amount_cents),-1000);
        assertEquals(Number(outgoingReversalSigns.find(x=>x.ledger_account_id===accountB)?.amount_cents),1000);

        const receiptKey=`receipt-${key}`;
        const receiptInput={rail:'ACH' as const,bankReference:`bankref-${key}`,
          idempotencyKey:receiptKey,memberAccountRef:`test:${accountA}`,
          amountCents:2500,evidenceReference:'vault://integration-test/evidence',
          recordedBy:'receipt-recorder'};
        const receipt=await recordIncomingReceipt(receiptInput);
        const receiptRetry=await recordIncomingReceipt(receiptInput);
        assertEquals(receipt.duplicate,false);
        assertEquals(receiptRetry.id,receipt.id);
        assertEquals(receiptRetry.duplicate,true);
        await assertRejects(()=>recordIncomingReceipt({...receiptInput,idempotencyKey:`different-key-${key}`}));
        await linkIncomingReceipt(receipt.id,`base44-receipt:${key}`);
        const verified=await verifyAndPostIncomingReceipt({
          receiptId:receipt.id,actorId:'independent-verifier',action:'verify_received',
          evidenceReference:'vault://integration-test/verified',clearingLedgerAccountId:accountB
        });
        assertEquals(verified.status,'verified_received');
        assert(verified.journalId);
        const incomingSigns=await db`
          SELECT ledger_account_id,amount_cents FROM avcu_payments.ledger_entries
           WHERE journal_id=${verified.journalId}
        `;
        assertEquals(Number(incomingSigns.find(x=>x.ledger_account_id===accountB)?.amount_cents),2500);
        assertEquals(Number(incomingSigns.find(x=>x.ledger_account_id===accountA)?.amount_cents),-2500);
        const returnedReceipt=await verifyAndPostIncomingReceipt({
          receiptId:receipt.id,actorId:'independent-verifier-2',action:'record_return',
          evidenceReference:'vault://integration-test/return',clearingLedgerAccountId:accountB
        });
        assertEquals(returnedReceipt.status,'returned');
        assert(returnedReceipt.journalId);
        const incomingReversalSigns=await db`
          SELECT ledger_account_id,amount_cents FROM avcu_payments.ledger_entries
           WHERE journal_id=${returnedReceipt.journalId}
        `;
        assertEquals(Number(incomingReversalSigns.find(x=>x.ledger_account_id===accountB)?.amount_cents),-2500);
        assertEquals(Number(incomingReversalSigns.find(x=>x.ledger_account_id===accountA)?.amount_cents),2500);

        await assertRejects(()=>db.begin(async tx=>{
          const badId=crypto.randomUUID();
          await tx`INSERT INTO avcu_payments.ledger_journals
            (id,source_type,source_id,idempotency_key,currency,description)
            VALUES (${badId},'test_unbalanced',${key},${'bad:'+key},'USD','Must fail')`;
          await tx`INSERT INTO avcu_payments.ledger_entries
            (id,journal_id,ledger_account_id,currency,amount_cents)
            VALUES (${crypto.randomUUID()},${badId},${accountA},'USD',100)`;
        }));
      } finally {
        // The test database is disposable; ledger rows are append-only by design.
        await db.end({timeout:5});
      }
    } finally {
      await closePaymentStore();
    }
  }
});
