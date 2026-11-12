import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { assertStaffIsNotRequester } from '../_shared/paymentAuthorization.ts';
import { hasActiveOutgoingFundsHold } from '../_shared/paymentStore.ts';

const STAFF_ROLES = new Set([
  'admin', 'administrator', 'super_administrator', 'executive',
  'operations_officer', 'operations_manager', 'finance_officer',
  'treasury_officer', 'compliance_officer',
]);
const FINAL_ROLES = new Set([
  'admin', 'administrator', 'super_administrator', 'executive',
  'finance_officer', 'treasury_officer', 'compliance_officer',
]);
const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const staff = await base44.auth.me();
    if (!staff?.id || !STAFF_ROLES.has(staff.role)) {
      return Response.json({ error: 'Authorized operations staff only.' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const requestId = clean(body?.request_id, 128);
    const action = clean(body?.action, 32);
    const bankReference = clean(body?.bank_reference, 120);
    const evidenceReference = clean(body?.evidence_reference, 500);
    const note = clean(body?.note, 500);
    if (!requestId || !['record_submission', 'reconcile_settled', 'record_return', 'record_failure'].includes(action)) {
      return Response.json({ error: 'A request ID and valid manual action are required.' }, { status: 400 });
    }
    if (!bankReference || !evidenceReference) {
      return Response.json({ error: 'Enter the bank-generated reference and a secure evidence reference before recording this action.' }, { status: 400 });
    }

    const transfer = await base44.asServiceRole.entities.TransferRequest.get(requestId);
    if (!transfer) return Response.json({ error: 'Transfer request not found.' }, { status: 404 });
    try {
      assertStaffIsNotRequester(staff.id, transfer.user_id);
    } catch {
      return Response.json({ error: 'Separation of duties: the requester cannot record or reconcile their own manual transfer.' }, { status: 403 });
    }
    if (action === 'record_submission') {
      const holdActive = await hasActiveOutgoingFundsHold({
        idempotencyKey: `${transfer.user_id}:${transfer.idempotency_key}`,
        amountCents: transfer.amount_cents,
      });
      if (!holdActive) {
        return Response.json({ error: 'A matching active funds reservation is required before manual bank submission.' }, { status: 409 });
      }
    } else {
      return Response.json({
        error: 'Manual settlement, return and failure posting are disabled until the PostgreSQL ledger reconciliation transaction is implemented. Do not mark this transfer settled manually.',
      }, { status: 503 });
    }

    const now = new Date().toISOString();
    let update: Record<string, unknown>;

    if (action === 'record_submission') {
      if (!['approved_awaiting_bank_submission'].includes(transfer.status)) {
        return Response.json({ error: 'Only a fully approved request can be recorded as submitted to the bank.' }, { status: 409 });
      }
      if (!['ACH', 'FEDWIRE'].includes(transfer.rail) ||
          !transfer.reviewer_user_id || !transfer.approver_user_id ||
          transfer.reviewer_user_id === transfer.approver_user_id) {
        return Response.json({ error: 'ACH and Fedwire require two distinct recorded approvals before manual bank submission.' }, { status: 403 });
      }
      update = {
        status: 'submitted_to_bank',
        bank_reference: bankReference,
        manual_processing: true,
        manual_operator_user_id: staff.id,
        manual_submitted_at: now,
        manual_evidence_reference: evidenceReference,
        manual_operator_note: note,
        submitted_at: now,
      };
    } else {
      if (!FINAL_ROLES.has(staff.role)) {
        return Response.json({ error: 'A finance, treasury, compliance or administrator role is required for final manual reconciliation.' }, { status: 403 });
      }
      if (!['submitted_to_bank', 'pending_settlement'].includes(transfer.status)) {
        return Response.json({ error: 'Only a request already recorded as submitted to the bank can be reconciled.' }, { status: 409 });
      }
      if (!transfer.manual_processing || !transfer.manual_operator_user_id) {
        return Response.json({ error: 'This request has no recorded manual bank operator submission.' }, { status: 409 });
      }
      if (transfer.manual_operator_user_id === staff.id) {
        return Response.json({ error: 'A different staff member must verify the bank evidence and reconcile this request.' }, { status: 403 });
      }
      if (action === 'reconcile_settled') {
        update = {
          status: 'settled',
          manual_reconciled_by_user_id: staff.id,
          manual_reconciled_at: now,
          manual_reconciliation_evidence_reference: evidenceReference,
          manual_reconciliation_note: note,
          reconciled_at: now,
          settled_at: now,
        };
      } else if (action === 'record_return') {
        update = {
          status: 'returned',
          manual_reconciled_by_user_id: staff.id,
          manual_reconciled_at: now,
          manual_reconciliation_evidence_reference: evidenceReference,
          manual_reconciliation_note: note,
          failure_reason: note || 'Bank evidence indicates returned payment',
        };
      } else {
        update = {
          status: 'failed',
          manual_reconciled_by_user_id: staff.id,
          manual_reconciled_at: now,
          manual_reconciliation_evidence_reference: evidenceReference,
          manual_reconciliation_note: note,
          failure_reason: note || 'Bank evidence indicates failed payment',
        };
      }
    }

    const claim = await base44.asServiceRole.entities.TransferRequest.updateMany(
      { id: requestId, status: transfer.status },
      { $set: update },
    );
    if (!claim?.success || claim.updated !== 1) {
      return Response.json({ error: 'Another staff action changed this transfer. Refresh and verify its current bank status.' }, { status: 409 });
    }
    const updated = await base44.asServiceRole.entities.TransferRequest.get(requestId);
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: `manual_transfer_${action}`,
      description: `Manual ${action.replaceAll('_', ' ')} recorded for ${transfer.rail}`,
      details: JSON.stringify({
        transferRequestId: requestId,
        rail: transfer.rail,
        amountCents: transfer.amount_cents,
        priorStatus: transfer.status,
        nextStatus: update.status,
        bankReference,
        evidenceReference,
        operatorUserId: action === 'record_submission' ? staff.id : transfer.manual_operator_user_id,
        verifierUserId: action === 'record_submission' ? null : staff.id,
        note,
      }),
      target_user_id: transfer.user_id,
      user_id: staff.id,
    });
    await base44.asServiceRole.entities.Notification.create({
      user_id: transfer.user_id,
      title: action === 'record_submission' ? 'Bank submission recorded' :
        action === 'reconcile_settled' ? 'Transfer settled' :
        action === 'record_return' ? 'Transfer returned by bank' : 'Transfer failed',
      message: action === 'record_submission'
        ? 'An operator recorded the bank submission reference. Final settlement is not yet confirmed.'
        : action === 'reconcile_settled'
          ? 'Your transfer was reconciled against bank evidence.'
          : 'The bank reported an exception for your transfer. Contact support for assistance.',
      type: 'info',
      read: false,
    });

    return Response.json({
      request: { id: updated.id, status: updated.status, bank_reference: updated.bank_reference },
      execution: 'manual_record_only',
      message: action === 'record_submission'
        ? 'Manual bank submission recorded. Settlement is not confirmed.'
        : 'Manual bank evidence recorded and independently reviewed.',
    });
  } catch {
    return Response.json({ error: 'Manual bank record could not be saved. The system did not execute a bank payment.' }, { status: 500 });
  }
}
