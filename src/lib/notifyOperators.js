/**
 * Operator notifications must be sent by a trusted server-side workflow.
 *
 * This client helper intentionally does not enumerate user records or attempt
 * to create notifications for other members. Notification RLS now scopes client
 * writes to the signed-in member, so privileged fan-out must be implemented on
 * the server with authenticated caller checks and an audit trail.
 */
export async function notifyOperators(_request = {}) {
  return {
    sent: 0,
    unavailable: true,
    reason: 'Operator notification delivery requires an authorized server-side workflow.',
  };
}
