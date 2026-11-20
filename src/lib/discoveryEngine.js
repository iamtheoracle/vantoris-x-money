/**
 * Fail-closed discovery automation adapter.
 * Automated writes remain disabled until source retrieval, verification,
 * review, and audit run server-side. The UI receives typed result contracts,
 * but every operation throws before returning success or changing records.
 */

/** @returns {never} */
function unavailable() {
  throw new Error('Discovery automation is not configured. No records were changed or approved.');
}

/** @param {string} domain @param {{ triggered_by?: string }} [options] @returns {Promise<{recordsDiscovered: number, recordsUpdated: number}>} */
export async function executeDiscoveryRun(domain, options = {}) {
  void domain;
  void options;
  return unavailable();
}

/** @returns {Promise<{staleCount: number}>} */
export async function checkFreshness() {
  return unavailable();
}

/** @returns {Promise<{reason?: string, refreshed: number, sources: number}>} */
export async function refreshProductCatalog() {
  return unavailable();
}

/** @param {string} recordId @returns {Promise<{verified: boolean, result: string, confidence: string}>} */
export async function verifyDiscoveryRecord(recordId) {
  void recordId;
  return unavailable();
}

/** @returns {Promise<{refreshed: number, stillStale: number, unavailable: number}>} */
export async function refreshStaleRecords() {
  return unavailable();
}

/** @returns {Promise<{changesDetected: number, totalProducts: number}>} */
export async function detectProductChanges() {
  return unavailable();
}
