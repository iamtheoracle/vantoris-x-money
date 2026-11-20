/**
 * Fail-closed exception authorization placeholder.
 * Privileged exception actions remain blocked until a trusted server endpoint
 * verifies credentials and issues a scoped, expiring grant.
 */
export async function requestExceptionAuth() {
  return { success: false, grant: null, reason: 'Privileged exception authorization is not configured. No action was authorized.' };
}

export async function logExceptionAuthEvent() {
  // Do not persist credentials or invent an audit record without a trusted backend.
  return { recorded: false, reason: 'Audit backend is not configured.' };
}

export function getActionLabel(action) {
  return String(action || 'privileged action').replace(/[_-]+/g, ' ');
}

export function isLockedOut() {
  return false;
}

export function getLockoutRemaining() {
  return 0;
}
