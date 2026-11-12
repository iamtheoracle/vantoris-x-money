import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  listQueuedPlaidEvents, processPlaidProviderEvent,
  claimPendingPaymentOutbox, markPaymentOutboxDelivered,
  recordPaymentOutboxFailure,
} from '../_shared/paymentStore.ts';

const STAFF_ROLES = new Set([
  'admin','administrator','super_administrator','executive',
  'operations_officer','operations_manager','finance_officer',
  'treasury_officer','compliance_officer','auditor',
]);

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const staff = await base44.auth.me();
    if (!staff?.id || !STAFF_ROLES.has(staff.role)) {
      return Response.json({ error: 'Authorized staff only.' }, { status: 403 });
    }
    const environment = Deno.env.get('PLAID_ENV');
    if (!['sandbox','production'].includes(environment || '')) {
      return Response.json({ error: 'Plaid environment is not configured.' }, { status: 503 });
    }
    const clearingLedgerAccountIds = {
      ACH: Deno.env.get('VANTORIS_ACH_CLEARING_LEDGER_ACCOUNT_ID') || '',
      FEDWIRE: Deno.env.get('VANTORIS_FEDWIRE_CLEARING_LEDGER_ACCOUNT_ID') || '',
    };
    const body = await req.json().catch(() => null);
    const limit = Number.isInteger(body?.limit) ? Math.min(Math.max(body.limit,1),100) : 50;
    const queued = await listQueuedPlaidEvents(limit, environment as 'sandbox'|'production');
    let processed = 0, held = 0, duplicates = 0, projectionDelivered = 0, projectionFailed = 0;

    for (const providerEventId of queued) {
      try {
        const result = await processPlaidProviderEvent({
          providerEventId,
          environment: environment as 'sandbox'|'production',
          clearingLedgerAccountIds,
        });
        if (result.status === 'held') held++;
        else if (result.status === 'duplicate' || result.status === 'ignored_old_event') duplicates++;
        else processed++;
      } catch {
        held++;
      }
    }

    // PostgreSQL is authoritative for the provider event and journal. This
    // outbox safely retries the Base44 UI projection if that write fails.
    const outboxOwnerId = crypto.randomUUID();
    const pending = await claimPendingPaymentOutbox(outboxOwnerId, limit, 90);
    for (const item of pending) {
      try {
        const transfer = await base44.asServiceRole.entities.TransferRequest.get(item.transferRequestId);
        if (!transfer) throw new Error('Base44 transfer projection not found.');
        if (transfer.status !== item.status) {
          const allowed = new Set([
            'approved_awaiting_bank_submission','submitting_to_bank','submission_unknown',
            'submitted_to_bank','pending_settlement','settled','returned','failed','cancelled',
          ]);
          if (!allowed.has(transfer.status)) throw new Error('Base44 transfer state is not eligible for projection.');
          const update = await base44.asServiceRole.entities.TransferRequest.updateMany(
            { id: transfer.id, status: transfer.status },
            { $set: { status: item.status, reconciled_at: new Date().toISOString() } },
          );
          if (!update?.success || update.updated !== 1) throw new Error('Concurrent Base44 transfer update.');
        }
        if (await markPaymentOutboxDelivered(item.id, outboxOwnerId)) projectionDelivered++;
      } catch (error) {
        projectionFailed++;
        await recordPaymentOutboxFailure(item.id, outboxOwnerId, error instanceof Error ? error.message : 'Projection failed').catch(()=>{});
      }
    }

    return Response.json({
      provider: 'plaid', environment, scanned: queued.length, processed, held, duplicates,
      projection_delivered: projectionDelivered, projection_failed: projectionFailed,
      message: 'Provider-event state and any settlement/reversal journal are committed transactionally in PostgreSQL. Base44 status updates are delivered through a retryable outbox.',
    });
  } catch (error) {
    return Response.json({
      error: 'PostgreSQL-backed reconciliation failed. No unverified provider event was applied.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
