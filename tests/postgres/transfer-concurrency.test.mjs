import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import postgres from 'postgres';

const databaseUrl = process.env.VANTORIS_LEDGER_TEST_DATABASE_URL || process.env.DATABASE_URL;
const senderAccount = 'CONCURRENCY-SENDER-USD';
const receiverAccount = 'CONCURRENCY-RECEIVER-USD';
const senderId = '10000000-0000-4000-8000-000000000001';
const collisionOperationId = '40000000-0000-4000-8000-000000000001';
const tokenA = Buffer.from('e'.repeat(64), 'hex');
const tokenB = Buffer.from('7'.repeat(64), 'hex');

function requestHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function setRuntimeRole(tx) {
  await tx.unsafe('SET LOCAL ROLE avcu_backend');
}

test('concurrent member transfers cannot double-spend and a post-hold failure rolls back', async () => {
  assert(databaseUrl, 'VANTORIS_LEDGER_TEST_DATABASE_URL or DATABASE_URL is required');
  const db = postgres(databaseUrl, { max: 4, connect_timeout: 10, idle_timeout: 5 });

  try {
    const attempts = [
      { token: tokenA, operationId: randomUUID(), key: 'concurrency-race-a' },
      { token: tokenB, operationId: randomUUID(), key: 'concurrency-race-b' },
    ].map(item => ({
      ...item,
      amount: 7000,
      hash: requestHash({ senderId, source: senderAccount, receiver: receiverAccount, amount: 7000, key: item.key }),
    }));

    let ready = 0;
    let releaseGate;
    const gate = new Promise(resolve => { releaseGate = resolve; });

    async function transfer(attempt) {
      return db.begin(async tx => {
        await setRuntimeRole(tx);
        ready += 1;
        if (ready === 2) releaseGate();
        await gate;

        const [claim] = await tx.unsafe(
          'SELECT * FROM vantoris_ledger.create_member_internal_transfer_operation($1::uuid,$2::bytea,$3::text,$4::text,$5::bigint,$6::text,$7::text)',
          [attempt.operationId, attempt.token, senderAccount, receiverAccount, attempt.amount, attempt.key, attempt.hash],
        );
        assert.equal(claim.operation_status, 'accepted');
        const [posted] = await tx.unsafe(
          'SELECT * FROM vantoris_ledger.execute_member_internal_transfer($1::uuid,$2::bytea)',
          [claim.operation_id, attempt.token],
        );
        return { ...posted, attempt };
      });
    }

    const outcomes = await Promise.allSettled(attempts.map(transfer));
    const successful = outcomes.filter(item => item.status === 'fulfilled');
    const rejected = outcomes.filter(item => item.status === 'rejected');
    assert.equal(successful.length, 1, 'exactly one transfer may consume the sender balance');
    assert.equal(rejected.length, 1, 'the competing transfer must fail');
    assert(
      String(rejected[0].reason?.message || rejected[0].reason).includes('INSUFFICIENT_AVAILABLE_FUNDS'),
      'the losing transfer must fail on the locked available balance',
    );

    const winner = successful[0].value.attempt;
    const retry = await db.begin(async tx => {
      await setRuntimeRole(tx);
      const [claim] = await tx.unsafe(
        'SELECT * FROM vantoris_ledger.create_member_internal_transfer_operation($1::uuid,$2::bytea,$3::text,$4::text,$5::bigint,$6::text,$7::text)',
        [winner.operationId, winner.token, senderAccount, receiverAccount, winner.amount, winner.key, winner.hash],
      );
      const [posted] = await tx.unsafe(
        'SELECT * FROM vantoris_ledger.execute_member_internal_transfer($1::uuid,$2::bytea)',
        [claim.operation_id, winner.token],
      );
      return { claim, posted };
    });
    assert.equal(retry.claim.duplicate, true, 'identical retry must reuse the existing operation');
    assert.equal(retry.posted.duplicate, true, 'identical retry must reuse the original journal and hold');

    const [raceState] = await db.unsafe(
      "SELECT " +
      "(SELECT count(*)::int FROM vantoris_ledger.payment_operations WHERE member_id=$1::uuid AND idempotency_key LIKE 'concurrency-race-%') AS operation_count, " +
      "(SELECT count(*)::int FROM vantoris_ledger.payment_operations WHERE member_id=$1::uuid AND idempotency_key LIKE 'concurrency-race-%' AND status='posted') AS posted_count, " +
      "(SELECT count(*)::int FROM vantoris_ledger.outgoing_funds_holds h JOIN vantoris_ledger.payment_operations p ON p.id=h.operation_id WHERE p.idempotency_key LIKE 'concurrency-race-%' AND h.status='captured') AS captured_count, " +
      "(SELECT count(*)::int FROM vantoris_ledger.outgoing_funds_holds h JOIN vantoris_ledger.payment_operations p ON p.id=h.operation_id WHERE p.idempotency_key LIKE 'concurrency-race-%' AND h.status='active') AS active_count",
      [senderId],
    );
    assert.equal(Number(raceState.operation_count), 1, 'failed concurrent transaction must not leave an accepted operation');
    assert.equal(Number(raceState.posted_count), 1);
    assert.equal(Number(raceState.captured_count), 1);
    assert.equal(Number(raceState.active_count), 0);

    const forcedFailureId = collisionOperationId;
    const forcedFailureKey = 'concurrency-forced-rollback';
    const forcedFailureHash = requestHash({
      senderId,
      source: senderAccount,
      receiver: receiverAccount,
      amount: 1000,
      key: forcedFailureKey,
    });

    await assert.rejects(
      () => db.begin(async tx => {
        await setRuntimeRole(tx);
        const [claim] = await tx.unsafe(
          'SELECT * FROM vantoris_ledger.create_member_internal_transfer_operation($1::uuid,$2::bytea,$3::text,$4::text,$5::bigint,$6::text,$7::text)',
          [forcedFailureId, tokenA, senderAccount, receiverAccount, 1000, forcedFailureKey, forcedFailureHash],
        );
        await tx.unsafe(
          'SELECT * FROM vantoris_ledger.execute_member_internal_transfer($1::uuid,$2::bytea)',
          [claim.operation_id, tokenA],
        );
      }),
      error => error?.code === '23505',
      'pre-existing journal idempotency collision must abort after hold creation',
    );

    const [rollbackState] = await db.unsafe(
      "SELECT " +
      "(SELECT count(*)::int FROM vantoris_ledger.payment_operations WHERE id=$1::uuid) AS operation_count, " +
      "(SELECT count(*)::int FROM vantoris_ledger.outgoing_funds_holds WHERE operation_id=$1::uuid) AS hold_count, " +
      "(SELECT count(*)::int FROM vantoris_ledger.journals WHERE idempotency_key='internal-transfer:'||$1::text) AS collision_journal_count, " +
      "(SELECT -COALESCE(sum(e.amount_cents),0)::bigint FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id WHERE a.account_reference=$2::text) AS sender_available_balance",
      [forcedFailureId, senderAccount],
    );
    assert.equal(Number(rollbackState.operation_count), 0, 'failed transaction must roll back the operation claim');
    assert.equal(Number(rollbackState.hold_count), 0, 'failed transaction must roll back the active hold');
    assert.equal(Number(rollbackState.collision_journal_count), 1, 'the pre-existing collision record must remain untouched');
    assert.equal(Number(rollbackState.sender_available_balance), 3000, 'failed transaction must not change sender balance');
  } finally {
    await db.end({ timeout: 5 });
  }
});
