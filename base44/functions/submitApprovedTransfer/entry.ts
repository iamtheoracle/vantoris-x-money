import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  deriveProviderIdempotencyKey, registerPaymentTransfer,
  setPaymentOperationStatus, setProviderTransferReference, hasActiveOutgoingFundsHold,
} from '../_shared/paymentStore.ts';
import { assertStaffIsNotRequester } from '../_shared/paymentAuthorization.ts';
import { getTransferRailAdapter } from '../_shared/transferRails.ts';

const SUBMIT_ROLES = new Set(['admin', 'administrator', 'super_administrator', 'finance_officer', 'treasury_officer']);
export default async function(req: Request): Promise<Response> {
  let submissionReserved = false;
  let providerCallStarted = false;
  let paymentOperationKey = '';
  let reconcileUnexpectedFailure: (() => Promise<unknown>) | null = null;
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const staff = await base44.auth.me();
    if (!staff?.id || !SUBMIT_ROLES.has(staff.role)) {
      return Response.json({ error: 'Authorized finance or treasury staff only.' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const requestId = typeof body?.request_id === 'string' ? body.request_id.trim() : '';
    if (!requestId) return Response.json({ error: 'Transfer request ID is required.' }, { status: 400 });

    const transfer = await base44.asServiceRole.entities.TransferRequest.get(requestId);
    if (!transfer) return Response.json({ error: 'Transfer request not found.' }, { status: 404 });
    try {
      assertStaffIsNotRequester(staff.id, transfer.user_id);
    } catch {
      return Response.json({ error: 'Separation of duties: the requester cannot submit their own transfer.' }, { status: 403 });
    }
    paymentOperationKey = `${transfer.user_id}:${transfer.idempotency_key}`;
    if (transfer.status !== 'approved_awaiting_bank_submission') {
      return Response.json({ error: 'Transfer has not completed the required review approvals.' }, { status: 409 });
    }
    if (!['ACH', 'FEDWIRE'].includes(transfer.rail) ||
        !transfer.reviewer_user_id || !transfer.approver_user_id ||
        transfer.reviewer_user_id === transfer.approver_user_id) {
      return Response.json({ error: 'ACH and Fedwire require two distinct staff approvals before submission.' }, { status: 403 });
    }
    if (Deno.env.get('VANTORIS_PROVIDER_SUBMISSION_ENABLED') !== 'true') {
      return Response.json({ error: 'External bank submission is disabled until U.S. sponsor-bank authorization, compliance approval and provider configuration are verified. No bank request was sent.' }, { status: 503 });
    }
    if (!transfer.beneficiary_account_token) {
      return Response.json({ error: 'A provider-issued beneficiary account token is required. No bank request was sent.' }, { status: 503 });
    }

    const rail = transfer.rail === 'ACH' ? 'ACH' : transfer.rail === 'FEDWIRE' ? 'FEDWIRE' : null;
    if (!rail) return Response.json({ error: 'Unsupported transfer rail. No bank request was sent.' }, { status: 400 });
    await registerPaymentTransfer({
      base44TransferRequestId: transfer.id,
      idempotencyKey: `${transfer.user_id}:${transfer.idempotency_key}`,
      sourceAccountRef: transfer.source_account_id,
      rail,
      amountCents: transfer.amount_cents,
    });
    const holdActive = await hasActiveOutgoingFundsHold({
      idempotencyKey: `${transfer.user_id}:${transfer.idempotency_key}`,
      amountCents: transfer.amount_cents,
    });
    if (!holdActive) {
      return Response.json({ error: 'A matching active funds reservation is required before bank submission. No bank request was sent.' }, { status: 409 });
    }
    const adapter = getTransferRailAdapter(rail);
    if (adapter.providerId === 'not-configured') {
      return Response.json({ error: 'Bank rail adapter is not configured. No bank request was sent and the request remains approved for manual handling.' }, { status: 503 });
    }

    const reservation = await base44.asServiceRole.entities.TransferRequest.updateMany(
      { id: transfer.id, status: 'approved_awaiting_bank_submission' },
      { $set: { status: 'submitting_to_bank', submission_started_at: new Date().toISOString(), submission_operator_user_id: staff.id } },
    );
    if (!reservation?.success || reservation.updated !== 1) {
      return Response.json({ error: 'This transfer is already being submitted or its status changed. Do not retry until checked.' }, { status: 409 });
    }
    submissionReserved = true;
    reconcileUnexpectedFailure = () => base44.asServiceRole.entities.TransferRequest.updateMany(
      { id: transfer.id, status: 'submitting_to_bank' },
      { $set: { status: 'submission_unknown', submission_error: 'Unexpected failure after submission reservation; reconcile before retrying.' } },
    );
    try {
      await setPaymentOperationStatus(`${transfer.user_id}:${transfer.idempotency_key}`,'processing');
    } catch {
      await base44.asServiceRole.entities.TransferRequest.updateMany(
        { id: transfer.id, status: 'submitting_to_bank' },
        { $set: { status: 'submission_unknown', submission_error: 'Payment operation store could not confirm the reservation.' } },
      ).catch(()=>null);
      return Response.json({ error: 'Payment operation store could not confirm this submission. No bank request was sent; reconcile before retrying.' }, { status: 503 });
    }

    const providerIdempotencyKey = await deriveProviderIdempotencyKey(transfer.user_id,transfer.idempotency_key);
    let result;
    try {
      providerCallStarted = true;
      result = await adapter.submit({
        transferRequestId: transfer.id,
        amountCents: transfer.amount_cents,
        currency: 'USD',
        idempotencyKey: providerIdempotencyKey,
        beneficiary: {
          name: transfer.beneficiary_name,
          bankName: transfer.beneficiary_bank_name,
          routingNumber: transfer.beneficiary_routing_number,
          accountToken: transfer.beneficiary_account_token,
          accountLast4: transfer.beneficiary_account_last4,
        },
        memo: transfer.memo,
      });
    } catch {
      await Promise.allSettled([
        base44.asServiceRole.entities.TransferRequest.updateMany(
          { id: transfer.id, status: 'submitting_to_bank' },
          { $set: { status: 'submission_unknown', submission_error: 'Provider result uncertain; reconcile with provider before retrying.' } },
        ),
        setPaymentOperationStatus(`${transfer.user_id}:${transfer.idempotency_key}`,'unknown'),
      ]);
      return Response.json({ error: 'Provider result is uncertain. Transfer locked for reconciliation; do not resubmit blindly.' }, { status: 503 });
    }
    if (!result?.providerTransferId || !result.providerId) {
      await Promise.allSettled([
        base44.asServiceRole.entities.TransferRequest.updateMany(
          { id: transfer.id, status: 'submitting_to_bank' },
          { $set: { status: 'submission_unknown', submission_error: 'Provider response lacked a verifiable reference.' } },
        ),
        setPaymentOperationStatus(`${transfer.user_id}:${transfer.idempotency_key}`,'unknown'),
      ]);
      return Response.json({ error: 'Provider response is incomplete. Transfer locked for reconciliation; do not resubmit.' }, { status: 502 });
    }
    await setProviderTransferReference({
      base44TransferRequestId: transfer.id,
      providerId: result.providerId,
      providerTransferId: result.providerTransferId,
    });
    const finalStatus = result.status === 'pending' ? 'pending_settlement' : 'submitted_to_bank';
    const committed = await base44.asServiceRole.entities.TransferRequest.updateMany(
      { id: transfer.id, status: 'submitting_to_bank' },
      { $set: {
        status: finalStatus,
        provider_id: result.providerId,
        bank_reference: result.bankReference || result.providerTransferId,
        provider_transfer_id: result.providerTransferId,
        submitted_at: result.acceptedAt,
      } },
    );
    if (!committed?.success || committed.updated !== 1) {
      return Response.json({ error: 'Provider returned a bank reference but the institution could not finalize the record. Escalate for reconciliation; do not resubmit.', bank_reference: result.bankReference || result.providerTransferId }, { status: 500 });
    }
    return Response.json({ submitted: true, provider_transfer_id: result.providerTransferId, bank_reference: result.bankReference || '', status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transfer provider unavailable.';
    if (submissionReserved) {
      // Once the request is reserved, unexpected failures must never be reported
      // as definitely not submitted. The provider may have accepted it before a
      // later persistence failure; lock it for reconciliation instead.
      await Promise.allSettled([
        reconcileUnexpectedFailure?.() ?? Promise.resolve(),
        paymentOperationKey ? setPaymentOperationStatus(paymentOperationKey, 'unknown') : Promise.resolve(),
      ]);
      return Response.json({
        error: providerCallStarted
          ? 'Provider execution may have started, but finalization failed. Transfer locked for reconciliation; do not resubmit.'
          : 'Submission reservation was created but failed before the provider call. Reconcile the locked request before retrying.',
        execution: providerCallStarted ? 'unknown' : 'not_submitted',
      }, { status: 503 });
    }
    return Response.json({ error: message, execution: 'not_submitted' }, { status: 503 });
  }
}
