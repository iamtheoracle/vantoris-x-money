/**
 * HeroBox discovery pipeline safety boundary.
 *
 * Discovery ingestion and publication are intentionally fail-closed until
 * source provenance, human verification, dual approval, server-side
 * authorization, and immutable audit logging are implemented together.
 * This module performs no external discovery, entity creation, updates,
 * auto-approval, or donor publication.
 */

export const HEROBOX_SOURCES = Object.freeze([]);

const DISABLED_REASON = 'HeroBox discovery ingestion is disabled until a server-side source-verification pipeline with human review, dual approval, and immutable audit evidence is connected.';

export async function executeHeroBoxDiscovery() {
  return {
    success: false,
    status: 'disabled',
    message: DISABLED_REASON,
    created: 0,
    updated: 0,
    approved: 0,
    recordsChanged: false,
  };
}

export async function loadHeroBoxDiscoverContent() {
  return {
    organizations: [],
    cases: [],
    news: [],
    unavailable: true,
    reason: DISABLED_REASON,
  };
}

export async function loadAllDiscoveredContent() {
  return {
    organizations: [],
    cases: [],
    news: [],
    discoveryRecords: [],
    unavailable: true,
    reason: DISABLED_REASON,
  };
}
