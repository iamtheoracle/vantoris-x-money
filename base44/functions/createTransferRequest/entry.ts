import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { claimPaymentOperation, registerPaymentTransfer, acquireLease, releaseLease, reserveOutgoingFunds, recordPaymentAudit } from '../_shared/paymentStore.ts';

const MAX_AMOUNT_CENTS = 100000000;
const RAILS = new Set(['ACH', 'FEDWIRE', 'INTERNAL']);
const textField = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const member = await base44.auth.me();
    if (!member?.id) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'A valid JSON object is required' }, { status: 400 });
    }
    const rail = body.rail;
    const sourceAccountId = textField(body.source_account_id, 128);
    const beneficiaryName = textField(body.beneficiary_name, 120);
    const routing = textField(body.beneficiary_routing_number, 9);
    const accountLast4 = textField(body.beneficiary_account_last4, 4);
    const bankName = textField(body.beneficiary_bank_name, 120);
    const memo = textField(body.memo, 140);
    const key = textField(body.idempotency_key, 100);
    const cents = body.amount_cents;

    if (!RAILS.has(rail) || rail === 'INTERNAL') {
      return Response.json({ error: 'Only ACH and domestic Fedwire requests are accepted by this intake endpoint.' }, { status: 400 });
    }
    if (!sourceAccountId || !beneficiaryName || !bankName ||
        !/^\d{9}$/.test(routing) || !/^\d{4}$/.test(accountLast4) ||
        !Number.isSafeInteger(cents) || cents < 1 || cents > MAX_AMOUNT_CENTS ||
        !/^[A-Za-z0-9._:-]{16,100}$/.test(key)) {
      return Response.json({ error: 'Check the source account, beneficiary, 9-digit routing number, account last four, amount, and idempotency key.' }, { status: 400 });
    }

    const account = await base44.asServiceRole.entities.Account.get(sourceAccountId);
    if (!account || account.user_id !== member.id || account.status !== 'active') {
      return Response.json({ error: 'The selected source account is unavailable.' }, { status: 404 });
    }
    if (account.currency !== 'USD') {
      return Response.json({ error: 'The selected account does not have a verified USD currency record. No transfer request or funds hold was created; operations review is required.' }, { status: 409 });
    }

    // PostgreSQL's unique constraint arbitrates concurrent retries before the
    // Base44 projection is created. The database URL is server-side only.
    const operation = await claimPaymentOperation({
      operationType: 'outgoing_transfer_request',
      idempotencyKey: `${member.id}:${key}`,
      request: {
        user_id: member.id, source_account_id: sourceAccountId, rail,
        amount_cents: cents, currency: 'USD', beneficiary_name: beneficiaryName,
        beneficiary_bank_name: bankName, beneficiary_routing_number: routing,
        beneficiary_account_last4: accountLast4, memo,
      },
    });
    const lease = await acquireLease(`outgoing-transfer-projection:${operation.id}`,crypto.randomUUID(),120);
    if (!lease) return Response.json({error:'This request is being recorded by another worker. Retry with the same idempotency key.'},{status:409});
    try {
      const existing = await base44.asServiceRole.entities.TransferRequest.filter({
        user_id: member.id,
        idempotency_key: key,
      });
      if (existing?.length > 1) {
        return Response.json({error:'Multiple legacy transfer projections exist for this key. Operations review is required.'},{status:409});
      }
      if (existing?.length) {
        const prior = existing[0];
        await registerPaymentTransfer({
          base44TransferRequestId: prior.id, idempotencyKey: `${member.id}:${key}`,
          sourceAccountRef: sourceAccountId, rail, amountCents: cents,
        });
        await recordPaymentAudit({actorId:member.id,action:'outgoing_transfer_request_retried',
          objectType:'transfer_request',objectId:prior.id,
          details:{operationId:operation.id,rail,amountCents:cents,duplicate:true}});
        return Response.json({ request: { id: prior.id, rail: prior.rail, amount_cents: prior.amount_cents, status: prior.status }, duplicate: true, execution: 'not_submitted' }, { status: 200 });
      }
      if (!operation.created && operation.status !== 'accepted') {
        return Response.json({ error: 'This payment operation is no longer in an initial state. Operations review is required; do not create another key.' }, { status: 409 });
      }

    // Reserve against the transactional ledger before creating the member-facing
    // request. Missing ledger mapping or insufficient available funds fails closed.
    let fundsReservation: Awaited<ReturnType<typeof reserveOutgoingFunds>>;
    try {
      fundsReservation = await reserveOutgoingFunds({
        operationId: operation.id, accountRef: sourceAccountId,
        amountCents: cents, actorId: member.id,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : '';
      if (reason.includes('INSUFFICIENT_AVAILABLE_FUNDS')) {
        return Response.json({ error: 'Insufficient available funds for this transfer. Pending holds are included.' }, { status: 409 });
      }
      if (reason.includes('MEMBER_LEDGER_ACCOUNT_NOT_CONFIGURED')) {
        return Response.json({ error: 'This account is not connected to an approved transactional ledger. No transfer request was created.' }, { status: 503 });
      }
      throw error;
    }
      const request = await base44.asServiceRole.entities.TransferRequest.create({
        user_id: member.id,
        source_account_id: sourceAccountId,
        rail,
        direction: 'outgoing',
        amount_cents: cents,
        currency: 'USD',
        beneficiary_name: beneficiaryName,
        beneficiary_bank_name: bankName,
        beneficiary_routing_number: routing,
        beneficiary_account_last4: accountLast4,
        memo,
        idempotency_key: key,
        status: 'awaiting_bank_review',
      });

      await registerPaymentTransfer({
        base44TransferRequestId: request.id, idempotencyKey: `${member.id}:${key}`,
        sourceAccountRef: sourceAccountId, rail, amountCents: cents,
      });
      await recordPaymentAudit({actorId:member.id,action:'outgoing_transfer_request_created',
        objectType:'transfer_request',objectId:request.id,
        details:{operationId:operation.id,rail,amountCents:cents,fundsHoldId:fundsReservation.holdId,
          availableAfterReservationCents:fundsReservation.availableAfterCents}});

      await Promise.allSettled([
        base44.asServiceRole.entities.Notification.create({
          user_id: member.id,
          title: 'Transfer request received',
          message: 'Your transfer request is recorded for review. Funds are reserved from available balance; no bank transfer has been sent.',
          type: 'info',
          read: false,
        }),
        base44.asServiceRole.entities.AuditLog.create({
          action_type: 'transfer_request_created',
          description: `Member submitted an outgoing ${rail} transfer request`,
          details: JSON.stringify({ transferRequestId: request.id, amount_cents: cents, currency: 'USD', fundsReserved: true }),
          target_user_id: member.id,
          user_id: member.id,
        }),
      ]);

      return Response.json({
        request: { id: request.id, rail: request.rail, amount_cents: request.amount_cents, status: request.status },
        execution: 'not_submitted',
        funds_reserved: true,
        available_after_reservation_cents: fundsReservation.availableAfterCents,
        message: 'Request recorded. The amount is reserved from available funds pending review; no bank transfer has been sent.',
      }, { status: 201 });
    } finally {
      await releaseLease(lease).catch(()=>false);
    }
  } catch {
    return Response.json({ error: 'Transfer request could not be recorded. No transfer execution is confirmed.' }, { status: 500 });
  }
}
