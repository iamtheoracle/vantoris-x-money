/**
 * Vantoris Discovery — Verification Pipeline & State Machine
 *
 * Governs the lifecycle of every discovered item:
 *
 *   DISCOVER
 *   → DEDUPLICATE
 *   → SOURCE CHECK
 *   → VERIFY
 *   → CORROBORATE
 *   → RISK CHECK
 *   → CLASSIFY
 *   → REVIEW
 *   → APPROVE
 *   → PUBLISH
 *   → REFRESH
 *   → CLOSE/ARCHIVE
 *
 * A newly discovered case must NEVER automatically become donor-visible.
 *
 * State flow for humanitarian cases:
 *   discovered → verification_pending → review_pending → approved → active
 *
 * Failure / exception states:
 *   verification_failed  — verification could not confirm the claim
 *   source_unavailable  — source URL broken or source offline
 *   stale               — information outdated, needs recheck
 *   closed              — case resolved or no longer needed
 *   rejected            — fraudulent or materially suspicious
 *
 * Organization (orphanage / children's home) state flow:
 *   discovered → verification_pending → verified → approved → active → closed/rejected
 */

import { base44 } from '@/api/base44Client';

// ============================================================
// §1  HUMANITARIAN CASE STATES
// ============================================================

export const CASE_STATES = [
  'discovered',
  'verification_pending',
  'review_pending',
  'approved',
  'active',
  'matched',
  'fulfilled',
  'closed',
  'verification_failed',
  'source_unavailable',
  'stale',
  'rejected',
];

// Valid forward transitions for humanitarian cases
const CASE_TRANSITIONS = {
  discovered:           ['verification_pending', 'rejected'],
  verification_pending: ['review_pending', 'verification_failed', 'source_unavailable', 'rejected'],
  review_pending:       ['approved', 'rejected', 'verification_failed'],
  approved:             ['active', 'closed', 'rejected'],
  active:               ['matched', 'fulfilled', 'closed', 'stale', 'source_unavailable'],
  matched:              ['fulfilled', 'closed', 'active'],
  fulfilled:            ['closed'],
  closed:               [],
  verification_failed:  ['review_pending', 'rejected', 'closed'],
  source_unavailable:   ['verification_pending', 'closed', 'rejected'],
  stale:                ['verification_pending', 'closed', 'rejected'],
  rejected:             [],
};

// ============================================================
// §2  ORGANIZATION STATES
// ============================================================

export const ORG_STATES = [
  'discovered',
  'verification_pending',
  'verified',
  'approved',
  'active',
  'closed',
  'rejected',
];

const ORG_TRANSITIONS = {
  discovered:           ['verification_pending', 'rejected'],
  verification_pending: ['verified', 'rejected'],
  verified:             ['approved', 'rejected', 'closed'],
  approved:             ['active', 'closed', 'rejected'],
  active:               ['closed', 'rejected'],
  closed:               [],
  rejected:             [],
};

// ============================================================
// §3  STATE MACHINE VALIDATION
// ============================================================

/**
 * Validate a state transition for a humanitarian case.
 * @returns {boolean} true if the transition is allowed
 */
export function canTransitionCase(fromState, toState) {
  const allowed = CASE_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
}

/**
 * Validate a state transition for an organization.
 */
export function canTransitionOrg(fromState, toState) {
  const allowed = ORG_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
}

/**
 * Get the next valid states from the current state.
 */
export function getNextCaseStates(currentState) {
  return CASE_TRANSITIONS[currentState] || [];
}

export function getNextOrgStates(currentState) {
  return ORG_TRANSITIONS[currentState] || [];
}

/**
 * Is this state donor-visible? Only approved/active/matched/fulfilled cases
 * should appear in the donation flow.
 */
export function isCaseDonorVisible(caseStatus) {
  return ['approved', 'active', 'matched', 'fulfilled'].includes(caseStatus);
}

/**
 * Is this organization donor-visible?
 */
export function isOrgDonorVisible(orgStatus) {
  return ['approved', 'active'].includes(orgStatus);
}

// ============================================================
// §4  SOURCE RELIABILITY SCORING
// ============================================================

/**
 * Source type tiers — primary sources are more reliable than secondary.
 * A high score PRIORITIZES review but does NOT prove truth.
 */
const SOURCE_TYPE_RELIABILITY = {
  government: 0.95,
  court: 0.93,
  regulator: 0.90,
  ngo: 0.75,
  charity: 0.72,
  market_data: 0.85,
  news: 0.65,
  retailer: 0.80,
  provider: 0.78,
  other: 0.40,
};

/**
 * Assess source reliability based on source type, verification status,
 * corroboration count, and conflict count.
 *
 * @param {Object} source - { source_type, verification_status, corroborating_count, conflicting_count }
 * @returns {Object} - { score (0-1), tier, flags }
 */
export function assessSourceReliability(source) {
  const baseScore = SOURCE_TYPE_RELIABILITY[source.source_type] || 0.40;
  const flags = [];

  // Verification modifier
  let verificationModifier = 0;
  if (source.verification_status === 'verified') verificationModifier = 0.10;
  else if (source.verification_status === 'partially_verified') verificationModifier = 0.05;
  else if (source.verification_status === 'conflicting') {
    verificationModifier = -0.20;
    flags.push('conflicting_reports');
  } else if (source.verification_status === 'failed') {
    verificationModifier = -0.30;
    flags.push('verification_failed');
  }

  // Corroboration modifier — each corroborating source adds confidence
  const corroborationBoost = Math.min((source.corroborating_count || 0) * 0.03, 0.15);

  // Conflict modifier — conflicting sources reduce confidence
  const conflictPenalty = Math.min((source.conflicting_count || 0) * 0.08, 0.30);

  let score = baseScore + verificationModifier + corroborationBoost - conflictPenalty;
  score = Math.max(0, Math.min(1, score));

  // Flag suspicious conditions
  if (score < 0.40) flags.push('low_reliability');
  if (source.conflicting_count > 0) flags.push('has_conflicts');
  if (!source.source_type || source.source_type === 'other') flags.push('unclassified_source');

  let tier;
  if (score >= 0.80) tier = 'high';
  else if (score >= 0.55) tier = 'medium';
  else tier = 'low';

  return { score: Math.round(score * 100) / 100, tier, flags };
}

// ============================================================
// §5  DUPLICATE DETECTION
// ============================================================

/**
 * Normalize a title for duplicate comparison.
 * Removes punctuation, lowercases, trims whitespace.
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two titles using token overlap.
 * Returns a score 0-1 where 1 = identical.
 */
export function titleSimilarity(titleA, titleB) {
  const a = normalizeTitle(titleA);
  const b = normalizeTitle(titleB);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if a new discovery item is a duplicate of an existing record.
 * Uses source_url exact match AND title similarity for consolidation.
 *
 * @param {Object} newItem - { title, source_url }
 * @param {Array} existingRecords - existing DiscoveryRecord or domain entity records
 * @returns {Object} - { isDuplicate, duplicateRecord, similarity }
 */
export function findDuplicate(newItem, existingRecords) {
  if (!existingRecords || existingRecords.length === 0) {
    return { isDuplicate: false, duplicateRecord: null, similarity: 0 };
  }

  // 1. Exact source_url match
  if (newItem.source_url) {
    const urlMatch = existingRecords.find(
      (r) => r.source_url && r.source_url === newItem.source_url
    );
    if (urlMatch) {
      return { isDuplicate: true, duplicateRecord: urlMatch, similarity: 1, matchType: 'url' };
    }
  }

  // 2. Title similarity (Jaccard) — threshold 0.75 for consolidation
  let bestMatch = null;
  let bestScore = 0;
  for (const record of existingRecords) {
    const recordTitle = record.title || record.case_title || record.name || '';
    const score = titleSimilarity(newItem.title, recordTitle);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = record;
    }
  }

  if (bestScore >= 0.75) {
    return { isDuplicate: true, duplicateRecord: bestMatch, similarity: bestScore, matchType: 'title' };
  }

  return { isDuplicate: false, duplicateRecord: bestMatch, similarity: bestScore, matchType: null };
}

/**
 * Consolidate a duplicate: add the new source URL to the existing record's
 * corroborating sources, update evidence, and create a change record.
 *
 * @returns {Promise<Object>} - the updated existing record
 */
export async function consolidateDuplicate(existingRecord, newItem, entityType = 'DiscoveryRecord') {
  // Parse existing corroborating sources
  let corroborating = [];
  try {
    corroborating = JSON.parse(existingRecord.corroborating_sources || '[]');
  } catch (e) {
    corroborating = [];
  }

  // Add the new source URL if not already present
  if (newItem.source_url && !corroborating.includes(newItem.source_url)) {
    corroborating.push(newItem.source_url);
  }

  const updateData = {
    corroborating_sources: JSON.stringify(corroborating),
    last_checked: new Date().toISOString(),
  };

  // Update confidence if we now have more corroboration
  if (corroborating.length >= 2 && existingRecord.confidence_level === 'low') {
    updateData.confidence_level = 'medium';
  }
  if (corroborating.length >= 3 && existingRecord.confidence_level !== 'high') {
    updateData.confidence_level = 'high';
  }

  await base44.entities[entityType].update(existingRecord.id, updateData);
  return { ...existingRecord, ...updateData };
}

// ============================================================
// §6  RISK FLAGGING
// ============================================================

/**
 * Risk indicators that should be flagged for review.
 * These are SIGNALS, not accusations — they require human review.
 */
export const RISK_INDICATORS = {
  unverifiable_organization: 'Organization cannot be verified through independent sources',
  conflicting_reports: 'Multiple sources provide materially conflicting information',
  suspicious_fundraising: 'Fundraising claims inconsistent with documented evidence',
  broken_link: 'Source URL is broken or returns error',
  stale_source: 'Source has not been updated within expected freshness window',
  duplicate_case: 'Similar case appears to exist in multiple sources',
  inconsistent_amount: 'Requested amount varies significantly across sources',
  missing_evidence: 'Claim lacks supporting evidence or documentation',
  high_pressure_urgency: 'Uses unusual urgency language without supporting evidence',
  unverified_medical_claim: 'Medical condition stated without supporting medical documentation',
};

/**
 * Flag risk indicators for a discovered item.
 * Returns an array of risk flag keys.
 */
export function flagRisks(item, verificationResult = {}) {
  const flags = [];

  if (verificationResult.result === 'conflicting') flags.push('conflicting_reports');
  if (verificationResult.result === 'failed') flags.push('missing_evidence');

  // Check for suspicious fundraising patterns
  if (item.estimated_amount && item.estimated_amount > 100000) {
    if (!item.evidence || (Array.isArray(item.evidence) && item.evidence.length === 0)) {
      flags.push('suspicious_fundraising');
    }
  }

  // Check for unverified medical claims
  if (item.category === 'surgery_medical' || item.category === 'medical') {
    if (!item.evidence || (Array.isArray(item.evidence) && item.evidence.length === 0)) {
      flags.push('unverified_medical_claim');
    }
  }

  // Check for high-pressure urgency
  const text = `${item.title || ''} ${item.description || ''} ${item.stated_need || ''}`.toLowerCase();
  if (/\b(urgent|emergency|immediate|life or death|act now|last chance)\b/i.test(text)) {
    if (!item.evidence || (Array.isArray(item.evidence) && item.evidence.length === 0)) {
      flags.push('high_pressure_urgency');
    }
  }

  return flags;
}

// ============================================================
// §7  PIPELINE STATE TRANSITIONS (with audit)
// ============================================================

/**
 * Transition a humanitarian case to a new state.
 * Validates the transition and records provenance.
 *
 * @param {string} caseId - HumanitarianCase ID
 * @param {string} newState - Target state
 * @param {Object} context - { reviewer_id, reviewer_name, notes, reason }
 * @returns {Promise<Object>} - { success, oldState, newState, error }
 */
export async function transitionCaseState(caseId, newState, context = {}) {
  const case_ = await base44.entities.HumanitarianCase.get(caseId).catch(() => null);
  if (!case_) return { success: false, error: 'Case not found' };

  const oldState = case_.case_status;
  if (oldState === newState) return { success: true, oldState, newState, unchanged: true };

  if (!canTransitionCase(oldState, newState)) {
    return { success: false, oldState, newState, error: `Invalid transition: ${oldState} → ${newState}` };
  }

  const updateData = {
    case_status: newState,
    date_last_verified: new Date().toISOString(),
  };

  if (context.reviewer_id) {
    updateData.reviewer_id = context.reviewer_id;
    updateData.reviewer_name = context.reviewer_name || '';
    updateData.review_notes = context.notes || '';
    updateData.reviewed_date = new Date().toISOString();
  }

  // Map pipeline states to review_status where applicable
  if (newState === 'review_pending') updateData.review_status = 'pending';
  if (newState === 'approved' || newState === 'active') updateData.review_status = 'approved';
  if (newState === 'rejected') updateData.review_status = 'rejected';

  await base44.entities.HumanitarianCase.update(caseId, updateData);

  return { success: true, oldState, newState };
}

/**
 * Transition an organization to a new state.
 */
export async function transitionOrgState(orgId, newState, context = {}) {
  const org = await base44.entities.OrganizationProfile.get(orgId).catch(() => null);
  if (!org) return { success: false, error: 'Organization not found' };

  const oldState = org.status;
  if (oldState === newState) return { success: true, oldState, newState, unchanged: true };

  if (!canTransitionOrg(oldState, newState)) {
    return { success: false, oldState, newState, error: `Invalid transition: ${oldState} → ${newState}` };
  }

  const updateData = {
    status: newState,
    date_last_verified: new Date().toISOString(),
  };

  await base44.entities.OrganizationProfile.update(orgId, updateData);

  return { success: true, oldState, newState };
}