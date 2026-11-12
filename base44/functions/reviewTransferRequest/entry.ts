import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { assertStaffIsNotRequester } from '../_shared/paymentAuthorization.ts';
import { releaseOutgoingFundsHoldForTransfer } from '../_shared/paymentStore.ts';

const REVIEW_ROLES = new Set([
  'admin', 'administrator', 'super_administrator', 'executive',
  'operations_officer', 'operations_manager', 'finance_officer',
  'treasury_officer', 'compliance_officer',
]);
const APPROVER_ROLES = new Set([
  'admin', 'administrator', 'super_administrator', 'executive',
  'finance_officer', 'treasury_officer',
]);
const textField = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const staff = await base44.auth.me();
    if (!staff?.id || !REVIEW_ROLES.has(staff.role)) {
      return Response.json({ error: 'Authorized operations staff only.' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const requestId = textField(body?.request_id, 128);
    const action = textField(body?.action, 32);
    const note = textField(body?.note, 500);
    if (!requestId || !['review', 'approve_second', 'reject'].includes(action)) {
      return Response.json({ error: 'A request ID and valid action are required.' }, { status: 400 });
    }

    const request = await base44.asServiceRole.entities.TransferRequest.get(requestId);
    if (!request) return Response.json({ error: 'Transfer request not found.' }, { status: 404 });
    try {
      assertStaffIsNotRequester(staff.id, request.user_id);
    } catch {
      return Response.json({ error: 'Separation of duties: the requester cannot review, approve, or reject their own transfer.' }, { status: 403 });
    }

    let update: Record<string, unknown>;
    if (action === 'reject') {
      if (!['awaiting_bank_review', 'awaiting_dual_approval'].includes(request.status)) {
        return Response.json({ error: 'This request is no longer awaiting review.' }, { status: 409 });
      }
      update = {
        status: 'rejected',
        rejection_reason: note || 'Rejected by operations',
        reviewed_at: new Date().toISOString(),
        reviewer_user_id: request.reviewer_user_id || staff.id,
      };
    } else if (action === 'review') {
      if (request.status !== 'awaiting_bank_review') {
        return Response.json({ error: 'This request has already been reviewed.' }, { status: 409 });
      }
      if (request.rail === 'FEDWIRE') {
        update = {
          status: 'awaiting_dual_approval',
          reviewer_user_id: staff.id,
          reviewer_note: note,
          reviewed_at: new Date().toISOString(),
        };
      } else if (request.rail === 'ACH') {
        update = {
          status: 'awaiting_dual_approval',
          reviewer_user_id: staff.id,
          reviewer_note: note,
          reviewed_at: new Date().toISOString(),
        };
      } else {
        return Response.json({ error: 'Unsupported transfer rail.' }, { status: 400 });
      }
    } else {
      if (!APPROVER_ROLES.has(staff.role)) {
        return Response.json({ error: 'A treasury or finance approver is required.' }, { status: 403 });
      }
      if (!['ACH', 'FEDWIRE'].includes(request.rail) || request.status !== 'awaiting_dual_approval') {
        return Response.json({ error: 'Only an ACH or Fedwire request awaiting its second approval can be approved here.' }, { status: 409 });
      }
      if (!request.reviewer_user_id || request.reviewer_user_id === staff.id) {
        return Response.json({ error: 'The second approver must be a different staff member.' }, { status: 403 });
      }
      update = {
        status: 'approved_awaiting_bank_submission',
        approver_user_id: staff.id,
        approver_note: note,
        approved_at: new Date().toISOString(),
      };
    }

    const claim = await base44.asServiceRole.entities.TransferRequest.updateMany(
      { id: requestId, status: request.status },
      { $set: update },
    );
    if (!claim?.success || claim.updated !== 1) {
      return Response.json({ error: 'Another staff action changed this request. Refresh before trying again.' }, { status: 409 });
    }
    const updated = await base44.asServiceRole.entities.TransferRequest.get(requestId);
    if (action === 'reject') {
      await releaseOutgoingFundsHoldForTransfer({
        memberId:request.user_id,clientIdempotencyKey:request.idempotency_key,
        actorId:staff.id,reason:'Transfer request rejected by authorized staff',
      });
    }
    await Promise.allSettled([
      base44.asServiceRole.entities.AuditLog.create({
        action_type: `transfer_request_${action}`,
        description: `Staff ${action} for ${request.rail} request`,
        details: JSON.stringify({
          transferRequestId: requestId,
          rail: request.rail,
          priorStatus: request.status,
          nextStatus: update.status,
          staffUserId: staff.id,
        }),
        target_user_id: request.user_id,
        user_id: staff.id,
      }),
      base44.asServiceRole.entities.Notification.create({
        user_id: request.user_id,
        title: action === 'reject' ? 'Transfer request rejected' : 'Transfer request updated',
        message: action === 'reject'
          ? 'Your transfer request was rejected by operations. Contact support for details.'
          : 'Your transfer request passed an operations review step. It has not been sent to a bank.',
        type: action === 'reject' ? 'warning' : 'info',
        read: false,
      }),
    ]);

    return Response.json({
      request: {
        id: updated.id,
        rail: updated.rail,
        status: updated.status,
        reviewer_user_id: updated.reviewer_user_id,
        approver_user_id: updated.approver_user_id,
      },
      execution: 'not_submitted',
      message: 'Review recorded. No bank submission or account debit occurred.',
    });
  } catch {
    return Response.json({ error: 'Review could not be recorded. No bank transfer was executed.' }, { status: 500 });
  }
}
