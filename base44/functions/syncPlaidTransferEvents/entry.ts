import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  acquireLease, releaseLease, getProviderCursor, commitPlaidEventPage,
} from '../_shared/paymentStore.ts';

const ROLES = new Set([
  'admin','administrator','super_administrator','finance_officer',
  'treasury_officer','compliance_officer','auditor',
]);

export default async function(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  let lease: Awaited<ReturnType<typeof acquireLease>> = null;
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const internalSecret = Deno.env.get('VANTAGE_INTERNAL_SYNC_SECRET');
    const trustedInternalCall = !!internalSecret && body?.internal_secret === internalSecret;
    const staff = await base44.auth.me().catch(() => null);
    if (!trustedInternalCall && (!staff?.id || !ROLES.has(staff.role))) {
      return Response.json({ error: 'Authorized finance or treasury staff only.' }, { status: 403 });
    }

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');
    const environment = Deno.env.get('PLAID_ENV');
    if (!clientId || !secret || !['sandbox','production'].includes(environment || '')) {
      return Response.json({ error: 'Plaid credentials and environment are not configured.' }, { status: 503 });
    }
    const env = environment as 'sandbox' | 'production';
    const apiBase = env === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com';

    lease = await acquireLease(`plaid-transfer-event-sync:${env}`, crypto.randomUUID(), 300);
    if (!lease) return Response.json({ error: 'Another Plaid event sync owns the active lease.' }, { status: 409 });

    const afterId = await getProviderCursor('plaid', env);
    const response = await fetch(`${apiBase}/transfer/event/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, after_id: afterId, count: 500 }),
      signal: AbortSignal.timeout(25000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error_message || payload?.display_message || 'Plaid event sync request failed.');
    }
    const rawEvents = Array.isArray(payload?.transfer_events) ? payload.transfer_events : [];
    const events = rawEvents.map((event: any) => ({
      event_id: Number(event.event_id),
      transfer_id: typeof event.transfer_id === 'string' ? event.transfer_id : '',
      event_type: typeof event.event_type === 'string' ? event.event_type : '',
      transfer_amount: Number(event.transfer_amount),
      timestamp: typeof event.timestamp === 'string' ? event.timestamp : undefined,
    }));
    const committed = await commitPlaidEventPage({
      lease, environment: env, expectedAfterId: afterId, events,
    });
    return Response.json({
      provider: 'plaid',
      environment: env,
      inserted: committed.inserted,
      duplicates: committed.duplicates,
      after_id: committed.afterId,
      has_more: payload?.has_more === true,
      message: 'Plaid events and cursor committed to the PostgreSQL payment store. Reconciliation processes queued events separately.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({
      error: 'Plaid sync failed; PostgreSQL cursor was not advanced unless the event page transaction committed.',
      detail: message,
    }, { status: 502 });
  } finally {
    if (lease) await releaseLease(lease).catch(() => false);
  }
}
