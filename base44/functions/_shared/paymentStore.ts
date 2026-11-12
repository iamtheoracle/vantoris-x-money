import postgres from 'npm:postgres@3.4.7';

type Sql = ReturnType<typeof postgres>;
let client: Sql | null = null;

function database(): Sql {
  if (client) return client;
  const url = Deno.env.get('VANTORIS_LEDGER_DATABASE_URL');
  if (!url) throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured; payment-critical storage is unavailable.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('VANTORIS_LEDGER_DATABASE_URL must use PostgreSQL.');
  }
  client = postgres(url, {
    ssl: 'require',
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  return client;
}

const uuid = () => crypto.randomUUID();

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function requireText(value: unknown, label: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`Invalid ${label}`);
  return value.trim();
}


/** Stable RFC 9562 UUIDv8 for provider idempotency; scoped per member so two
 * members choosing the same client key cannot collide at the provider. */
export async function deriveProviderIdempotencyKey(memberId:string, clientKey:string):Promise<string> {
  const name=`${requireText(memberId,'member ID',160)}:${requireText(clientKey,'client idempotency key',160)}`;
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(name)));
  digest[6]=(digest[6]&0x0f)|0x80;
  digest[8]=(digest[8]&0x3f)|0x80;
  const hex=[...digest.slice(0,16)].map(v=>v.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export interface OperationClaim {
  id: string;
  status: string;
  created: boolean;
}

/** A unique constraint, not a preflight lookup, arbitrates concurrent retries. */
export async function claimPaymentOperation(input: {
  operationType: string;
  idempotencyKey: string;
  request: unknown;
}): Promise<OperationClaim> {
  const operationType = requireText(input.operationType, 'operation type', 80);
  const idempotencyKey = requireText(input.idempotencyKey, 'idempotency key', 160);
  const requestHash = await sha256(input.request);
  return await database().begin(async tx => {
    const inserted = await tx`
      INSERT INTO avcu_payments.payment_operations
        (id, operation_type, idempotency_key, request_hash, status)
      VALUES
        (${uuid()}, ${operationType}, ${idempotencyKey}, ${requestHash}, 'accepted')
      ON CONFLICT (operation_type, idempotency_key) DO NOTHING
      RETURNING id, status
    `;
    if (inserted.length) return { id: inserted[0].id, status: inserted[0].status, created: true };
    const [prior] = await tx`
      SELECT id, status, request_hash FROM avcu_payments.payment_operations
       WHERE operation_type = ${operationType} AND idempotency_key = ${idempotencyKey}
       FOR UPDATE
    `;
    if (!prior) throw new Error('Idempotency claim disappeared; retry safely.');
    if (prior.request_hash !== requestHash) {
      throw new Error('IDEMPOTENCY_CONFLICT: this key was already used with a different request.');
    }
    return { id: prior.id, status: prior.status, created: false };
  });
}

/** Store an API-verified or signature-verified event. Duplicate IDs are harmless;
 * a reused provider ID with different payload is a hard integrity exception. */
export async function ingestProviderEvent(input: {
  providerId: string; environment: 'sandbox' | 'production'; providerEventId: string;
  transferReference?: string; eventType: string; eventSequence?: number;
  payload: unknown; verifiedAt: string;
}): Promise<{ id: string; duplicate: boolean }> {
  const hash = await sha256(input.payload);
  return await database().begin(async tx => {
    const rows = await tx`
      INSERT INTO avcu_payments.provider_events
        (id, provider_id, environment, provider_event_id, transfer_reference,
         event_type, event_sequence, payload_hash, verified_at)
      VALUES
        (${uuid()}, ${requireText(input.providerId,'provider ID',80)},
         ${input.environment}, ${requireText(input.providerEventId,'provider event ID',200)},
         ${input.transferReference || null}, ${requireText(input.eventType,'event type',120)},
         ${input.eventSequence ?? null}, ${hash}, ${input.verifiedAt})
      ON CONFLICT (provider_id, environment, provider_event_id) DO NOTHING
      RETURNING id
    `;
    if (rows.length) return { id: rows[0].id, duplicate: false };
    const [prior] = await tx`
      SELECT id, payload_hash FROM avcu_payments.provider_events
       WHERE provider_id = ${input.providerId} AND environment = ${input.environment}
         AND provider_event_id = ${input.providerEventId}
       FOR UPDATE
    `;
    if (!prior || prior.payload_hash !== hash) throw new Error('PROVIDER_EVENT_INTEGRITY_CONFLICT');
    return { id: prior.id, duplicate: true };
  });
}


/** Register the Base44 projection after a unique SQL operation claim.
 * Repeating the same registration is safe; mismatched values are rejected. */
export async function registerPaymentTransfer(input: {
  base44TransferRequestId: string; idempotencyKey: string; sourceAccountRef: string;
  rail: 'ACH' | 'FEDWIRE'; amountCents: number;
}): Promise<{ id: string; duplicate: boolean }> {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 1) throw new Error('INVALID_TRANSFER_AMOUNT');
  return await database().begin(async tx => {
    const rows = await tx`
      INSERT INTO avcu_payments.payment_transfers
        (id, base44_transfer_request_id, idempotency_key, source_account_ref, rail, amount_cents, status)
      VALUES (${uuid()}, ${input.base44TransferRequestId}, ${input.idempotencyKey},
        ${input.sourceAccountRef}, ${input.rail}, ${input.amountCents}, 'awaiting_bank_review')
      ON CONFLICT (idempotency_key) DO NOTHING RETURNING id
    `;
    if (rows.length) return { id: rows[0].id, duplicate: false };
    const [prior] = await tx`
      SELECT id, base44_transfer_request_id, source_account_ref, rail, amount_cents
        FROM avcu_payments.payment_transfers WHERE idempotency_key=${input.idempotencyKey} FOR UPDATE
    `;
    if (!prior || prior.base44_transfer_request_id !== input.base44TransferRequestId ||
        prior.source_account_ref !== input.sourceAccountRef || prior.rail !== input.rail ||
        Number(prior.amount_cents) !== input.amountCents) {
      throw new Error('PAYMENT_TRANSFER_IDEMPOTENCY_CONFLICT');
    }
    return { id: prior.id, duplicate: true };
  });
}


/** Reserve funds against the ledger's posted member balance. The SQL function
 * locks the member ledger account row, so concurrent outgoing requests cannot
 * both spend the same available cents. */
export async function reserveOutgoingFunds(input:{
  operationId:string; accountRef:string; amountCents:number; actorId:string;
}):Promise<{holdId:string;availableAfterCents:number;duplicate:boolean}> {
  if(!Number.isSafeInteger(input.amountCents)||input.amountCents<1) throw new Error('INVALID_FUNDS_RESERVATION_AMOUNT');
  const [row]=await database()`
    SELECT * FROM avcu_payments.reserve_outgoing_funds(
      ${input.operationId}::uuid,${requireText(input.accountRef,'account reference',160)},
      ${input.amountCents},${requireText(input.actorId,'actor ID',160)}
    )
  `;
  return {holdId:row.hold_id,availableAfterCents:Number(row.available_after_cents),duplicate:row.duplicate};
}

export async function releaseOutgoingFundsHoldForTransfer(input:{memberId:string;clientIdempotencyKey:string;actorId:string;reason:string}):Promise<boolean> {
  const key=`${requireText(input.memberId,'member ID',160)}:${requireText(input.clientIdempotencyKey,'client idempotency key',160)}`;
  return await database().begin(async tx=>{
    const [operation]=await tx`
      SELECT id FROM avcu_payments.payment_operations
       WHERE operation_type='outgoing_transfer_request' AND idempotency_key=${key}
       FOR UPDATE
    `;
    if(!operation) return false;
    const [transition]=await tx`
      SELECT avcu_payments.transition_outgoing_funds_hold(
        ${operation.id}::uuid,'released',${requireText(input.actorId,'actor ID',160)},
        ${requireText(input.reason,'release reason',300)}
      ) AS transitioned
    `;
    await tx`
      UPDATE avcu_payments.payment_transfers SET status='rejected',updated_at=clock_timestamp()
       WHERE idempotency_key=${key} AND status NOT IN ('settled','returned','failed','cancelled')
    `;
    return transition?.transitioned===true;
  });
}

type AuditJsonValue = string | number | boolean | null | AuditJsonValue[] | { [key: string]: AuditJsonValue };

export async function recordPaymentAudit(input:{actorId:string;action:string;objectType:string;objectId:string;details:Record<string,AuditJsonValue>}):Promise<void> {
  await database()`
    INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
    VALUES (${requireText(input.actorId,'actor ID',160)},${requireText(input.action,'audit action',120)},
      ${requireText(input.objectType,'audit object type',80)},${requireText(input.objectId,'audit object ID',200)},
      ${database().json(input.details as never)})
  `;
}

export async function hasActiveOutgoingFundsHold(input:{idempotencyKey:string;amountCents:number}):Promise<boolean> {
  const rows=await database()`
    SELECT h.id FROM avcu_payments.payment_operations o
    JOIN avcu_payments.outgoing_funds_holds h ON h.operation_id=o.id
     WHERE o.operation_type='outgoing_transfer_request'
       AND o.idempotency_key=${requireText(input.idempotencyKey,'idempotency key',200)}
       AND h.status='active' AND h.amount_cents=${input.amountCents}
  `;
  return rows.length===1;
}

export async function transitionOutgoingFundsHold(input:{
  operationId:string; status:'captured'|'released'; actorId:string; reason?:string;
}):Promise<boolean> {
  const [row]=await database()`
    SELECT avcu_payments.transition_outgoing_funds_hold(
      ${input.operationId}::uuid,${input.status},
      ${requireText(input.actorId,'actor ID',160)},${input.reason||null}
    ) AS transitioned
  `;
  return row?.transitioned===true;
}

export async function setPaymentOperationStatus(idempotencyKey:string,status:'accepted'|'processing'|'unknown'|'succeeded'|'failed'|'reversed'):Promise<void> {
  const result=await database()`
    UPDATE avcu_payments.payment_operations
       SET status=${status},updated_at=clock_timestamp()
     WHERE operation_type='outgoing_transfer_request' AND idempotency_key=${idempotencyKey}
  `;
  if(result.count!==1) throw new Error('PAYMENT_OPERATION_NOT_FOUND');
}

export async function setProviderTransferReference(input: {
  base44TransferRequestId: string; providerId: string; providerTransferId: string;
}): Promise<void> {
  const changed = await database()`
    UPDATE avcu_payments.payment_transfers
       SET provider_id=${input.providerId}, provider_transfer_id=${input.providerTransferId},
           status='submitted_to_bank', updated_at=clock_timestamp()
     WHERE base44_transfer_request_id=${input.base44TransferRequestId}
       AND (provider_transfer_id IS NULL OR provider_transfer_id=${input.providerTransferId})
  `;
  if (changed.count !== 1) throw new Error('PAYMENT_TRANSFER_PROVIDER_REFERENCE_CONFLICT');
}

export interface Lease {
  lockName: string; ownerId: string; fencingToken: number; expiresAt: string;
}
export async function acquireLease(lockName: string, ownerId = uuid(), ttlSeconds = 300): Promise<Lease | null> {
  const rows = await database()`SELECT * FROM avcu_payments.acquire_lease(${lockName}, ${ownerId}, ${ttlSeconds})`;
  const row = rows[0];
  return row?.acquired ? { lockName, ownerId, fencingToken: Number(row.fencing_token), expiresAt: new Date(row.expires_at).toISOString() } : null;
}
export async function renewLease(lease: Lease, ttlSeconds = 300): Promise<boolean> {
  const [row] = await database()`SELECT avcu_payments.renew_lease(${lease.lockName}, ${lease.ownerId}, ${lease.fencingToken}, ${ttlSeconds}) AS renewed`;
  return row?.renewed === true;
}
export async function releaseLease(lease: Lease): Promise<boolean> {
  const [row] = await database()`SELECT avcu_payments.release_lease(${lease.lockName}, ${lease.ownerId}, ${lease.fencingToken}) AS released`;
  return row?.released === true;
}

/** Fetch cursor, insert the entire Plaid page and advance cursor in one commit.
 * Call only after obtaining the matching provider/environment lease. */
export async function commitPlaidEventPage(input: {
  lease: Lease; environment: 'sandbox' | 'production'; expectedAfterId: number;
  events: Array<{ event_id: number; transfer_id: string; event_type: string; transfer_amount: number; timestamp?: string }>;
}): Promise<{ afterId: number; inserted: number; duplicates: number }> {
  return await database().begin(async tx => {
    const [lock] = await tx`SELECT avcu_payments.assert_lease(${input.lease.lockName}, ${input.lease.ownerId}, ${input.lease.fencingToken}) AS valid`;
    if (!lock?.valid) throw new Error('LEASE_FENCING_REJECTED');
    const [cursor] = await tx`
      SELECT after_id FROM avcu_payments.provider_cursors
       WHERE provider_id = 'plaid' AND environment = ${input.environment}
       FOR UPDATE
    `;
    const actual = Number(cursor?.after_id ?? 0);
    if (actual !== input.expectedAfterId) throw new Error('PLAID_CURSOR_CONFLICT');
    let afterId = actual, inserted = 0, duplicates = 0;
    for (const event of input.events) {
      if (!Number.isSafeInteger(event.event_id) || event.event_id <= actual ||
          !event.transfer_id || !event.event_type ||
          !Number.isFinite(event.transfer_amount) || event.transfer_amount <= 0) {
        throw new Error('INVALID_PLAID_EVENT_PAGE');
      }
      const amountCents = Math.round(event.transfer_amount * 100);
      if (!Number.isSafeInteger(amountCents) || amountCents < 1) throw new Error('INVALID_PLAID_AMOUNT');
      const providerEventId = `plaid-transfer-event:${event.event_id}`;
      const payload = { ...event, amount_cents: amountCents };
      const hash = await sha256(payload);
      const rows = await tx`
        INSERT INTO avcu_payments.provider_events
          (id, provider_id, environment, provider_event_id, transfer_reference,
           event_type, event_sequence, payload_hash, amount_cents, currency, verified_at)
        VALUES (${uuid()}, 'plaid', ${input.environment}, ${providerEventId},
          ${event.transfer_id}, ${event.event_type}, ${event.event_id},
          ${hash}, ${amountCents}, 'USD', clock_timestamp())
        ON CONFLICT (provider_id, environment, provider_event_id) DO NOTHING
        RETURNING id
      `;
      if (rows.length) inserted++;
      else {
        const [prior] = await tx`
          SELECT payload_hash FROM avcu_payments.provider_events
           WHERE provider_id='plaid' AND environment=${input.environment}
             AND provider_event_id=${providerEventId}
        `;
        if (!prior || prior.payload_hash !== hash) throw new Error('PLAID_EVENT_PAYLOAD_CONFLICT');
        duplicates++;
      }
      afterId = Math.max(afterId, event.event_id);
    }
    await tx`
      INSERT INTO avcu_payments.provider_cursors(provider_id, environment, after_id)
      VALUES ('plaid', ${input.environment}, ${afterId})
      ON CONFLICT (provider_id, environment)
      DO UPDATE SET after_id=EXCLUDED.after_id, updated_at=clock_timestamp()
    `;
    await tx`
      INSERT INTO avcu_payments.payment_audit(actor_id, action, object_type, object_id, details)
      VALUES (${input.lease.ownerId}, 'plaid_page_committed', 'provider_cursor',
        ${input.environment}, ${tx.json({afterId, inserted, duplicates, fencingToken:input.lease.fencingToken})})
    `;
    return { afterId, inserted, duplicates };
  });
}


export async function getProviderCursor(providerId: string, environment: 'sandbox' | 'production'): Promise<number> {
  const rows = await database()`
    SELECT after_id FROM avcu_payments.provider_cursors
     WHERE provider_id=${providerId} AND environment=${environment}
  `;
  return Number(rows[0]?.after_id ?? 0);
}

/** Process a verified Plaid event and any settlement/reversal journal in one
 * PostgreSQL transaction. Missing account mapping/clearing configuration is
 * a held event, never a guessed ledger posting. */
export async function processPlaidProviderEvent(input: {
  providerEventId: string; environment: 'sandbox' | 'production';
  clearingLedgerAccountIds: { ACH: string; FEDWIRE: string };
}): Promise<{ status: string; journalId?: string; reason?: string }> {
  return await database().begin(async tx => {
    const [event] = await tx`
      SELECT * FROM avcu_payments.provider_events
       WHERE provider_id='plaid' AND environment=${input.environment}
         AND provider_event_id=${input.providerEventId}
       FOR UPDATE
    `;
    if (!event) throw new Error('PROVIDER_EVENT_NOT_FOUND');
    if (event.processing_status === 'processed') return { status: 'duplicate' };
    if (!event.verified_at) throw new Error('UNVERIFIED_PROVIDER_EVENT');
    const [transfer] = await tx`
      SELECT * FROM avcu_payments.payment_transfers
       WHERE provider_id='plaid' AND provider_transfer_id=${event.transfer_reference}
       FOR UPDATE
    `;
    if (!transfer) {
      await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
        WHERE id=${event.id}`;
      return { status:'held', reason:'No registered institution transfer mapping for provider transfer ID.' };
    }
    if (Number(transfer.amount_cents) !== Number(event.amount_cents) ||
        transfer.currency !== event.currency) {
      await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
        WHERE id=${event.id}`;
      return { status:'held', reason:'Provider event amount or currency does not match the approved transfer.' };
    }
    if (event.event_sequence !== null && transfer.last_event_sequence !== null &&
        Number(event.event_sequence) <= Number(transfer.last_event_sequence)) {
      await tx`UPDATE avcu_payments.provider_events SET processing_status='processed', processed_at=clock_timestamp()
        WHERE id=${event.id}`;
      return { status:'ignored_old_event' };
    }

    const rawType = String(event.event_type).toLowerCase().replace(/^transfer[._]/,'');
    const currentStatus = String(transfer.status);
    if (['settled','returned','failed','cancelled'].includes(currentStatus)) {
      const safeDuplicate = currentStatus === 'settled' && ['posted','settled','pending','returned'].includes(rawType);
      if (!safeDuplicate) {
        await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
          WHERE id=${event.id}`;
        return { status:'held', reason:'Provider event would move a terminal transfer into an invalid state.' };
      }
      if (currentStatus === 'settled' && rawType === 'pending') {
        await tx`UPDATE avcu_payments.provider_events SET processing_status='processed',processed_at=clock_timestamp()
          WHERE id=${event.id}`;
        return { status:'ignored_status_regression' };
      }
    }
    let nextStatus = '';
    let journalId: string | undefined;
    if (rawType === 'posted' || rawType === 'settled') {
      const [reservation] = await tx`
        SELECT h.id,h.amount_cents,h.status
          FROM avcu_payments.payment_operations o
          LEFT JOIN avcu_payments.outgoing_funds_holds h ON h.operation_id=o.id
         WHERE o.operation_type='outgoing_transfer_request'
           AND o.idempotency_key=${transfer.idempotency_key}
         FOR UPDATE OF o
      `;
      if (!reservation || !reservation.id || reservation.status!=='active' ||
          Number(reservation.amount_cents)!==Number(transfer.amount_cents)) {
        await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
          WHERE id=${event.id}`;
        return {status:'held',reason:'A matching active outgoing funds reservation is required before settlement posting.'};
      }
      nextStatus = 'settled';
      if (!transfer.settled_journal_id) {
        const clearingAccountId = transfer.rail === 'ACH'
          ? input.clearingLedgerAccountIds.ACH : input.clearingLedgerAccountIds.FEDWIRE;
        if (!clearingAccountId) {
          await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
            WHERE id=${event.id}`;
          return { status:'held', reason:'Approved clearing ledger account is not configured for this rail.' };
        }
        const [memberLedger] = await tx`
          SELECT id FROM avcu_payments.ledger_accounts
           WHERE external_account_ref=${transfer.source_account_ref} AND currency=${transfer.currency}
        `;
        const [clearing] = await tx`
          SELECT id FROM avcu_payments.ledger_accounts
           WHERE id=${clearingAccountId} AND account_type='bank_clearing'
             AND currency=${transfer.currency}
        `;
        if (!memberLedger || !clearing) {
          await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
            WHERE id=${event.id}`;
          return { status:'held', reason:'Member or bank-clearing ledger account mapping is missing.' };
        }
        // Serialize every balance mutation against reservations on these accounts.
        for (const accountId of [String(memberLedger.id), String(clearing.id)].sort()) {
          const [locked] = await tx`
            SELECT id FROM avcu_payments.ledger_accounts
             WHERE id=${accountId} AND currency=${transfer.currency} FOR UPDATE
          `;
          if (!locked) throw new Error('SETTLEMENT_LEDGER_ACCOUNT_LOCK_FAILED');
        }
        journalId = uuid();
        await tx`
          INSERT INTO avcu_payments.ledger_journals
            (id, source_type, source_id, idempotency_key, currency, description)
          VALUES (${journalId}, 'outgoing_transfer_settlement', ${transfer.id},
            ${'settlement:'+transfer.id}, ${transfer.currency}, 'Settled outgoing bank transfer')
        `;
        await tx`
          INSERT INTO avcu_payments.ledger_entries(id,journal_id,ledger_account_id,currency,amount_cents)
          VALUES (${uuid()},${journalId},${memberLedger.id},${transfer.currency},${Number(transfer.amount_cents)}),
                 (${uuid()},${journalId},${clearing.id},${transfer.currency},${-Number(transfer.amount_cents)})
        `;
      } else journalId = transfer.settled_journal_id;
      await tx`UPDATE avcu_payments.payment_transfers
        SET status='settled', settled_journal_id=COALESCE(settled_journal_id,${journalId}),
            last_event_sequence=${event.event_sequence}, updated_at=clock_timestamp()
        WHERE id=${transfer.id}`;
      await tx`
        UPDATE avcu_payments.outgoing_funds_holds h
           SET status='captured',updated_at=clock_timestamp()
          FROM avcu_payments.payment_operations o
         WHERE o.operation_type='outgoing_transfer_request'
           AND o.idempotency_key=${transfer.idempotency_key}
           AND h.operation_id=o.id AND h.status='active'
      `;
      await tx`
        INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
        SELECT 'plaid-provider','outgoing_funds_captured','payment_operation',o.id::text,
          jsonb_build_object('transfer_id',${transfer.id},'journal_id',${journalId})
          FROM avcu_payments.payment_operations o
         WHERE o.operation_type='outgoing_transfer_request'
           AND o.idempotency_key=${transfer.idempotency_key}
      `;
    } else if (rawType === 'returned') {
      nextStatus = 'returned';
      if (transfer.settled_journal_id) {
        const [priorReversal] = await tx`SELECT id FROM avcu_payments.ledger_journals
          WHERE reversal_of=${transfer.settled_journal_id}`;
        if (!priorReversal) {
          const [original] = await tx`SELECT currency FROM avcu_payments.ledger_journals
            WHERE id=${transfer.settled_journal_id} FOR UPDATE`;
          if (!original) throw new Error('SETTLEMENT_JOURNAL_MISSING');
          journalId = uuid();
          await tx`
            INSERT INTO avcu_payments.ledger_journals
              (id,source_type,source_id,idempotency_key,currency,description,reversal_of)
            VALUES (${journalId},'provider_return',${transfer.settled_journal_id},
              ${'return:'+event.provider_event_id},${original.currency},
              'Reverse settled transfer returned by provider',${transfer.settled_journal_id})
          `;
          const originalEntries = await tx`SELECT ledger_account_id,amount_cents
            FROM avcu_payments.ledger_entries WHERE journal_id=${transfer.settled_journal_id}`;
          for (const accountId of [...new Set(originalEntries.map((entry) => String(entry.ledger_account_id)))].sort()) {
            const [locked] = await tx`
              SELECT id FROM avcu_payments.ledger_accounts
               WHERE id=${accountId} AND currency=${original.currency} FOR UPDATE
            `;
            if (!locked) throw new Error('PROVIDER_RETURN_ACCOUNT_LOCK_FAILED');
          }
          for (const entry of originalEntries) {
            await tx`INSERT INTO avcu_payments.ledger_entries
              (id,journal_id,ledger_account_id,currency,amount_cents)
              VALUES (${uuid()},${journalId},${entry.ledger_account_id},${original.currency},${-Number(entry.amount_cents)})`;
          }
        } else journalId = priorReversal.id;
      }
      await tx`UPDATE avcu_payments.payment_transfers SET status='returned',
        last_event_sequence=${event.event_sequence}, updated_at=clock_timestamp()
        WHERE id=${transfer.id}`;
    } else if (['pending','failed','cancelled'].includes(rawType)) {
      nextStatus = rawType;
      await tx`UPDATE avcu_payments.payment_transfers SET status=${nextStatus},
        last_event_sequence=${event.event_sequence}, updated_at=clock_timestamp()
        WHERE id=${transfer.id}`;
      if (['failed','cancelled'].includes(nextStatus)) {
        const [holdAccount] = await tx`
          SELECT h.ledger_account_id
            FROM avcu_payments.outgoing_funds_holds h
            JOIN avcu_payments.payment_operations o ON o.id=h.operation_id
           WHERE o.operation_type='outgoing_transfer_request'
             AND o.idempotency_key=${transfer.idempotency_key}
             AND h.status='active'
        `;
        if (holdAccount) {
          const [lockedAccount] = await tx`
            SELECT id FROM avcu_payments.ledger_accounts
             WHERE id=${holdAccount.ledger_account_id} FOR UPDATE
          `;
          if (!lockedAccount) throw new Error('FAILED_TRANSFER_HOLD_ACCOUNT_MISSING');
        }
        await tx`
          UPDATE avcu_payments.outgoing_funds_holds h
             SET status='released',release_reason='Provider reported transfer failed or cancelled',
                 updated_at=clock_timestamp()
            FROM avcu_payments.payment_operations o
           WHERE o.operation_type='outgoing_transfer_request'
             AND o.idempotency_key=${transfer.idempotency_key}
             AND h.operation_id=o.id AND h.status='active'
        `;
      }
    } else {
      await tx`UPDATE avcu_payments.provider_events SET processing_status='held'
        WHERE id=${event.id}`;
      return { status:'held', reason:'Unsupported Plaid transfer event type.' };
    }

    const operationStatus = nextStatus === 'settled' ? 'succeeded'
      : nextStatus === 'returned' ? 'reversed'
      : ['failed','cancelled'].includes(nextStatus) ? 'failed' : 'processing';
    await tx`UPDATE avcu_payments.payment_operations
      SET status=${operationStatus},updated_at=clock_timestamp()
      WHERE operation_type='outgoing_transfer_request'
        AND idempotency_key=${transfer.idempotency_key}`;
    await tx`UPDATE avcu_payments.provider_events SET processing_status='processed',
      processed_at=clock_timestamp() WHERE id=${event.id}`;
    await tx`
      INSERT INTO avcu_payments.payment_outbox(source_event_id,base44_transfer_request_id,target_status)
      VALUES (${event.id},${transfer.base44_transfer_request_id},${nextStatus==='pending'?'pending_settlement':nextStatus})
      ON CONFLICT (source_event_id) DO NOTHING
    `;
    await tx`
      INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
      VALUES ('plaid-provider','provider_event_processed','provider_event',${event.provider_event_id},
        ${tx.json({transferId:transfer.id,status:nextStatus,journalId:journalId||null})})
    `;
    return { status:nextStatus, journalId };
  });
}

export interface JournalEntryInput { ledgerAccountId: string; amountCents: number; }
export async function postBalancedJournal(input: {
  sourceType: string; sourceId: string; idempotencyKey: string;
  description: string; currency?: string; entries: JournalEntryInput[];
}): Promise<{ journalId: string; duplicate: boolean }> {
  const currency = input.currency || 'USD';
  if (!input.entries || input.entries.length < 2 ||
      input.entries.some(e => !Number.isSafeInteger(e.amountCents) || e.amountCents === 0) ||
      input.entries.reduce((sum,e)=>sum+e.amountCents,0) !== 0) {
    throw new Error('UNBALANCED_JOURNAL');
  }
  return await database().begin(async tx => {
    // Lock accounts in stable order so ledger writes serialize with outgoing holds.
    const grouped = new Map<string, number>();
    for (const entry of input.entries) {
      grouped.set(entry.ledgerAccountId, (grouped.get(entry.ledgerAccountId) ?? 0) + entry.amountCents);
    }
    const accountTypes = new Map<string, string>();
    for (const accountId of [...grouped.keys()].sort()) {
      const [account] = await tx`
        SELECT id, account_type FROM avcu_payments.ledger_accounts
         WHERE id=${accountId} AND currency=${currency} FOR UPDATE
      `;
      if (!account) throw new Error('LEDGER_ACCOUNT_NOT_FOUND_OR_CURRENCY_MISMATCH');
      accountTypes.set(accountId, String(account.account_type));
    }
    const id = uuid();
    const rows = await tx`
      INSERT INTO avcu_payments.ledger_journals
        (id, source_type, source_id, idempotency_key, currency, description)
      VALUES (${id}, ${input.sourceType}, ${input.sourceId}, ${input.idempotencyKey}, ${currency}, ${input.description})
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `;
    if (!rows.length) {
      const [prior] = await tx`SELECT id, source_type, source_id, currency FROM avcu_payments.ledger_journals WHERE idempotency_key=${input.idempotencyKey} FOR UPDATE`;
      if (!prior || prior.source_type !== input.sourceType || prior.source_id !== input.sourceId ||
          prior.currency !== currency) {
        throw new Error('LEDGER_IDEMPOTENCY_CONFLICT');
      }
      const priorEntries = await tx`
        SELECT ledger_account_id, amount_cents FROM avcu_payments.ledger_entries
         WHERE journal_id=${prior.id}
      `;
      const canonical = (entries: readonly unknown[]) =>
        entries.map(raw => {
          const entry = raw as {ledger_account_id: unknown; amount_cents: unknown};
          return [String(entry.ledger_account_id), Number(entry.amount_cents)] as const;
        }).sort((a,b) => a[0].localeCompare(b[0]) || a[1]-b[1]);
      const expectedEntries = canonical(input.entries.map(entry => ({
        ledger_account_id: entry.ledgerAccountId, amount_cents: entry.amountCents,
      })));
      const actualEntries = canonical(priorEntries);
      if (actualEntries.length !== expectedEntries.length ||
          actualEntries.some((entry,index) =>
            entry[0] !== expectedEntries[index][0] || entry[1] !== expectedEntries[index][1])) {
        throw new Error('LEDGER_IDEMPOTENCY_CONFLICT');
      }
      return { journalId: prior.id, duplicate: true };
    }
    // A normal debit may not consume cents already reserved by pending transfers.
    // This check follows the idempotency claim so successful retries remain duplicates.
    for (const [accountId, netAmount] of grouped) {
      if (accountTypes.get(accountId) !== 'member_deposit') continue;
      const [balance] = await tx`
        SELECT
          -COALESCE((SELECT sum(amount_cents) FROM avcu_payments.ledger_entries WHERE ledger_account_id=${accountId}),0) AS posted_cents,
          COALESCE((SELECT sum(amount_cents) FROM avcu_payments.outgoing_funds_holds WHERE ledger_account_id=${accountId} AND status='active'),0) AS held_cents
      `;
      const availableAfter = Number(balance.posted_cents) - Number(balance.held_cents) - netAmount;
      if (availableAfter < 0) throw new Error('INSUFFICIENT_AVAILABLE_FUNDS_AFTER_HOLDS');
    }
    for (const entry of input.entries) {
      await tx`INSERT INTO avcu_payments.ledger_entries
        (id, journal_id, ledger_account_id, currency, amount_cents)
        VALUES (${uuid()}, ${id}, ${entry.ledgerAccountId}, ${currency}, ${entry.amountCents})`;
    }
    return { journalId: id, duplicate: false };
  });
}

/** Reverse a complete journal once. New entries are exact opposites; source rows
 * remain immutable and the deferred balance trigger validates the new journal. */
export async function reverseJournal(input: {
  originalJournalId: string; idempotencyKey: string; actorId: string; reason: string;
}): Promise<{ journalId: string; duplicate: boolean }> {
  return await database().begin(async tx => {
    const [original] = await tx`
      SELECT id, currency FROM avcu_payments.ledger_journals
       WHERE id=${input.originalJournalId} FOR UPDATE
    `;
    if (!original) throw new Error('ORIGINAL_JOURNAL_NOT_FOUND');
    const [prior] = await tx`SELECT id, idempotency_key FROM avcu_payments.ledger_journals WHERE reversal_of=${original.id}`;
    if (prior) {
      if (prior.idempotency_key === input.idempotencyKey) return { journalId: prior.id, duplicate: true };
      throw new Error('JOURNAL_ALREADY_REVERSED_WITH_DIFFERENT_KEY');
    }
    const entries = await tx`
      SELECT ledger_account_id, amount_cents FROM avcu_payments.ledger_entries
       WHERE journal_id=${original.id}
    `;
    if (entries.length < 2) throw new Error('ORIGINAL_JOURNAL_INVALID');
    const accountIds = [...new Set(entries.map((entry) => String(entry.ledger_account_id)))].sort();
    for (const accountId of accountIds) {
      const [locked] = await tx`
        SELECT id FROM avcu_payments.ledger_accounts
         WHERE id=${accountId} AND currency=${original.currency} FOR UPDATE
      `;
      if (!locked) throw new Error('REVERSAL_LEDGER_ACCOUNT_LOCK_FAILED');
    }
    const reversalId = uuid();
    await tx`
      INSERT INTO avcu_payments.ledger_journals
        (id, source_type, source_id, idempotency_key, currency, description, reversal_of)
      VALUES (${reversalId}, 'reversal', ${original.id}, ${input.idempotencyKey},
        ${original.currency}, ${input.reason}, ${original.id})
    `;
    for (const entry of entries) {
      await tx`INSERT INTO avcu_payments.ledger_entries
        (id, journal_id, ledger_account_id, currency, amount_cents)
        VALUES (${uuid()}, ${reversalId}, ${entry.ledger_account_id},
          ${original.currency}, ${-Number(entry.amount_cents)})`;
    }
    await tx`
      INSERT INTO avcu_payments.payment_audit(actor_id, action, object_type, object_id, details)
      VALUES (${input.actorId}, 'ledger_journal_reversed', 'ledger_journal',
        ${original.id}, ${tx.json({reversalJournalId:reversalId, reason:input.reason})})
    `;
    return { journalId: reversalId, duplicate: false };
  });
}


export async function listQueuedPlaidEvents(limit = 50, environment: 'sandbox' | 'production' = 'sandbox') {
  const rows = await database()`
    SELECT provider_event_id FROM avcu_payments.provider_events
     WHERE provider_id='plaid' AND environment=${environment}
       AND processing_status IN ('queued','held')
     ORDER BY event_sequence ASC NULLS LAST LIMIT ${Math.min(Math.max(limit,1),100)}
  `;
  return rows.map(row => row.provider_event_id as string);
}

export async function claimPendingPaymentOutbox(
  ownerId: string, limit = 50, leaseSeconds = 90,
) {
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 15 || leaseSeconds > 600) {
    throw new Error('INVALID_OUTBOX_LEASE');
  }
  const rows = await database()`
    WITH candidates AS (
      SELECT id FROM avcu_payments.payment_outbox
       WHERE delivered_at IS NULL
         AND available_at <= clock_timestamp()
         AND (claim_expires_at IS NULL OR claim_expires_at <= clock_timestamp())
       ORDER BY id
       FOR UPDATE SKIP LOCKED
       LIMIT ${Math.min(Math.max(limit,1),100)}
    )
    UPDATE avcu_payments.payment_outbox AS outbox
       SET claim_owner=${ownerId}::uuid,
           claim_expires_at=clock_timestamp() + make_interval(secs => ${leaseSeconds})
      FROM candidates
     WHERE outbox.id=candidates.id
    RETURNING outbox.id,outbox.base44_transfer_request_id,outbox.target_status,outbox.attempts
  `;
  return rows.map(row => ({id:Number(row.id),transferRequestId:row.base44_transfer_request_id,
    status:row.target_status,attempts:Number(row.attempts)}));
}

export async function markPaymentOutboxDelivered(id: number, ownerId: string): Promise<boolean> {
  const result = await database()`
    UPDATE avcu_payments.payment_outbox
       SET delivered_at=clock_timestamp(),last_error=NULL,claim_owner=NULL,claim_expires_at=NULL
     WHERE id=${id} AND delivered_at IS NULL AND claim_owner=${ownerId}::uuid
       AND claim_expires_at > clock_timestamp()
  `;
  return result.count === 1;
}
export async function recordPaymentOutboxFailure(
  id: number, ownerId: string, message: string,
): Promise<boolean> {
  const result = await database()`
    UPDATE avcu_payments.payment_outbox
       SET attempts=attempts+1,last_error=${message.slice(0,500)},
           available_at=clock_timestamp() + make_interval(secs => LEAST(300, power(2, LEAST(attempts,8))::integer)),
           claim_owner=NULL,claim_expires_at=NULL
     WHERE id=${id} AND delivered_at IS NULL AND claim_owner=${ownerId}::uuid
       AND claim_expires_at > clock_timestamp()
  `;
  return result.count === 1;
}


export async function recordIncomingReceipt(input: {
  rail:'ACH'|'FEDWIRE'; bankReference:string; idempotencyKey:string;
  memberAccountRef:string; amountCents:number; evidenceReference:string; recordedBy:string;
}): Promise<{id:string;duplicate:boolean;status:string}> {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents < 1) throw new Error('INVALID_RECEIPT_AMOUNT');
  return await database().begin(async tx => {
    const rows = await tx`
      INSERT INTO avcu_payments.bank_receipts
        (id,rail,bank_reference,idempotency_key,member_account_ref,amount_cents,
         evidence_reference,verification_status,recorded_by)
      VALUES (${uuid()},${input.rail},${input.bankReference},${input.idempotencyKey},
        ${input.memberAccountRef},${input.amountCents},${input.evidenceReference},
        'awaiting_verification',${input.recordedBy})
      ON CONFLICT DO NOTHING RETURNING id,verification_status
    `;
    if (rows.length) return {id:rows[0].id,duplicate:false,status:rows[0].verification_status};
    const matches = await tx`
      SELECT id,verification_status,member_account_ref,amount_cents,rail,bank_reference,idempotency_key
        FROM avcu_payments.bank_receipts
       WHERE idempotency_key=${input.idempotencyKey}
          OR (rail=${input.rail} AND bank_reference=${input.bankReference})
       FOR UPDATE
    `;
    const prior=matches[0];
    if (matches.length!==1 || !prior || prior.idempotency_key!==input.idempotencyKey ||
        prior.member_account_ref!==input.memberAccountRef ||
        Number(prior.amount_cents)!==input.amountCents || prior.rail!==input.rail ||
        prior.bank_reference!==input.bankReference) throw new Error('INCOMING_RECEIPT_IDEMPOTENCY_CONFLICT');
    return {id:prior.id,duplicate:true,status:prior.verification_status};
  });
}

export async function linkIncomingReceipt(receiptId:string,base44ReceiptId:string):Promise<void> {
  const result=await database()`
    UPDATE avcu_payments.bank_receipts SET base44_receipt_id=${base44ReceiptId}
     WHERE id=${receiptId} AND (base44_receipt_id IS NULL OR base44_receipt_id=${base44ReceiptId})
  `;
  if(result.count!==1) throw new Error('INCOMING_RECEIPT_PROJECTION_CONFLICT');
}

/** Independent receipt verification and the member/clearing ledger posting
 * commit together. Returns and rejections are also idempotent. */
export async function verifyAndPostIncomingReceipt(input:{
  receiptId:string; actorId:string; action:'verify_received'|'record_return'|'reject_receipt';
  evidenceReference:string; clearingLedgerAccountId:string;
}):Promise<{status:string;journalId?:string;duplicate:boolean}> {
  return await database().begin(async tx=>{
    const [receipt]=await tx`SELECT * FROM avcu_payments.bank_receipts WHERE id=${input.receiptId} FOR UPDATE`;
    if(!receipt) throw new Error('INCOMING_RECEIPT_NOT_FOUND');
    if(receipt.recorded_by===input.actorId) throw new Error('SEPARATION_OF_DUTIES_VIOLATION');
    if(input.action==='verify_received' && receipt.verification_status==='verified_received') {
      return {status:'verified_received',journalId:receipt.ledger_journal_id||undefined,duplicate:true};
    }
    if(input.action==='record_return' && receipt.verification_status==='returned') {
      return {status:'returned',journalId:receipt.reversal_journal_id||receipt.ledger_journal_id||undefined,duplicate:true};
    }
    if(input.action==='reject_receipt' && receipt.verification_status==='rejected') {
      return {status:'rejected',duplicate:true};
    }
    if(input.action==='verify_received') {
      if(receipt.verification_status!=='awaiting_verification') throw new Error('RECEIPT_STATE_CONFLICT');
      const [memberLedger]=await tx`SELECT id FROM avcu_payments.ledger_accounts
        WHERE external_account_ref=${receipt.member_account_ref} AND account_type='member_deposit'
          AND currency=${receipt.currency}`;
      const [clearing]=await tx`SELECT id FROM avcu_payments.ledger_accounts
        WHERE id=${input.clearingLedgerAccountId} AND account_type='bank_clearing'
          AND currency=${receipt.currency}`;
      if(!memberLedger||!clearing) throw new Error('RECEIPT_LEDGER_ACCOUNT_MAPPING_MISSING');
      for (const accountId of [String(memberLedger.id), String(clearing.id)].sort()) {
        const [locked] = await tx`SELECT id FROM avcu_payments.ledger_accounts
          WHERE id=${accountId} AND currency=${receipt.currency} FOR UPDATE`;
        if (!locked) throw new Error('RECEIPT_LEDGER_ACCOUNT_LOCK_FAILED');
      }
      const journalId=uuid();
      await tx`INSERT INTO avcu_payments.ledger_journals
        (id,source_type,source_id,idempotency_key,currency,description)
        VALUES (${journalId},'incoming_bank_receipt',${receipt.id},
          ${'incoming-receipt:'+receipt.id},${receipt.currency},'Verified incoming bank receipt')`;
      await tx`INSERT INTO avcu_payments.ledger_entries
        (id,journal_id,ledger_account_id,currency,amount_cents)
        VALUES (${uuid()},${journalId},${clearing.id},${receipt.currency},${Number(receipt.amount_cents)}),
               (${uuid()},${journalId},${memberLedger.id},${receipt.currency},${-Number(receipt.amount_cents)})`;
      await tx`UPDATE avcu_payments.bank_receipts SET verification_status='verified_received',
        verified_by=${input.actorId},ledger_journal_id=${journalId}
        WHERE id=${receipt.id}`;
      await tx`INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
        VALUES (${input.actorId},'incoming_receipt_verified_and_posted','bank_receipt',${receipt.id},
          ${tx.json({amountCents:Number(receipt.amount_cents),journalId,evidenceReference:input.evidenceReference})})`;
      return {status:'verified_received',journalId,duplicate:false};
    }
    if(input.action==='record_return') {
      if(receipt.verification_status==='awaiting_verification') {
        await tx`UPDATE avcu_payments.bank_receipts SET verification_status='returned',
          verified_by=${input.actorId} WHERE id=${receipt.id}`;
        await tx`INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
          VALUES (${input.actorId},'incoming_receipt_returned_before_posting','bank_receipt',${receipt.id},
            ${tx.json({evidenceReference:input.evidenceReference})})`;
        return {status:'returned',duplicate:false};
      }
      if(receipt.verification_status!=='verified_received'||!receipt.ledger_journal_id) throw new Error('RECEIPT_STATE_CONFLICT');
      const [original]=await tx`SELECT currency FROM avcu_payments.ledger_journals
        WHERE id=${receipt.ledger_journal_id} FOR UPDATE`;
      if(!original) throw new Error('RECEIPT_JOURNAL_NOT_FOUND');
      const entries=await tx`SELECT ledger_account_id,amount_cents FROM avcu_payments.ledger_entries
        WHERE journal_id=${receipt.ledger_journal_id}`;
      for (const accountId of [...new Set(entries.map((entry) => String(entry.ledger_account_id)))].sort()) {
        const [locked] = await tx`SELECT id FROM avcu_payments.ledger_accounts
          WHERE id=${accountId} AND currency=${original.currency} FOR UPDATE`;
        if (!locked) throw new Error('RECEIPT_REVERSAL_ACCOUNT_LOCK_FAILED');
      }
      const reversalId=uuid();
      await tx`INSERT INTO avcu_payments.ledger_journals
        (id,source_type,source_id,idempotency_key,currency,description,reversal_of)
        VALUES (${reversalId},'incoming_receipt_return',${receipt.ledger_journal_id},
          ${'incoming-return:'+receipt.id},${original.currency},'Reverse returned incoming bank receipt',
          ${receipt.ledger_journal_id})`;
      for(const entry of entries) await tx`INSERT INTO avcu_payments.ledger_entries
        (id,journal_id,ledger_account_id,currency,amount_cents)
        VALUES (${uuid()},${reversalId},${entry.ledger_account_id},${original.currency},${-Number(entry.amount_cents)})`;
      await tx`UPDATE avcu_payments.bank_receipts SET verification_status='returned',
        verified_by=${input.actorId},reversal_journal_id=${reversalId} WHERE id=${receipt.id}`;
      await tx`INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
        VALUES (${input.actorId},'incoming_receipt_returned','bank_receipt',${receipt.id},
          ${tx.json({reversalJournalId:reversalId,evidenceReference:input.evidenceReference})})`;
      return {status:'returned',journalId:reversalId,duplicate:false};
    }
    if(receipt.verification_status!=='awaiting_verification') throw new Error('RECEIPT_STATE_CONFLICT');
    await tx`UPDATE avcu_payments.bank_receipts SET verification_status='rejected',verified_by=${input.actorId}
      WHERE id=${receipt.id}`;
    await tx`INSERT INTO avcu_payments.payment_audit(actor_id,action,object_type,object_id,details)
      VALUES (${input.actorId},'incoming_receipt_rejected','bank_receipt',${receipt.id},
        ${tx.json({evidenceReference:input.evidenceReference})})`;
    return {status:'rejected',duplicate:false};
  });
}

export async function closePaymentStore(): Promise<void> {
  if (client) { const current = client; client = null; await current.end({ timeout: 5 }); }
}
