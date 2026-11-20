/** Client-side audit placeholder. Authoritative audit entries must be written by a trusted backend. */
export async function logAuditEntry(_entry = {}) {
  return { recorded: false, reason: 'Trusted server-side audit logging is not configured.' };
}
