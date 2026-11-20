/**
 * HeroBox Discovery Engine
 *
 * HeroBox-specific discovery layer that searches legitimate public sources
 * for organizations, humanitarian needs, and humanitarian news, then routes
 * everything through the existing Vantoris verification pipeline.
 *
 * PROCESS:
 *   DISCOVER → DEDUPLICATE → VERIFY → CORROBORATE → CLASSIFY
 *   → RISK CHECK → REVIEW → APPROVE → PUBLISH → REFRESH
 *
 * Only APPROVED records become publicly visible in HeroBox.
 *
 * Discovery is NOT authorization. Discovering an organization does not
 * authorize spending money. All financial actions remain subject to the
 * existing Vantoris authorization and permission system.
 */

import { base44 } from '@/api/base44Client';
import {
  findDuplicate,
  consolidateDuplicate,
  assessSourceReliability,
  flagRisks,
  transitionOrgState,
  transitionCaseState,
} from './discoveryPipeline';

// ============================================================
// SOURCE CATALOG — legitimate public sources HeroBox can browse
// ============================================================

export const HEROBOX_SOURCES = [
  {
    name: 'Charity Navigator',
    source_type: 'regulator',
    discovery_domain: 'organization',
    domain: 'charitynavigator.org',
    base_url: 'https://www.charitynavigator.org',
    access_method: 'web_search',
    responsible_division: 'reconnaissance',
    description: 'Independent charity assessment organization that evaluates US charities based on financial health, accountability, and transparency.',
  },
  {
    name: 'IRS Tax Exempt Organization Search',
    source_type: 'government',
    discovery_domain: 'organization',
    domain: 'irs.gov',
    base_url: 'https://apps.irs.gov/app/eos',
    access_method: 'web_search',
    responsible_division: 'compliance',
    description: 'IRS Exempt Organizations Select Check — official US government database of tax-exempt organizations, EINs, and Form 990 data.',
  },
  {
    name: 'ProPublica Nonprofit Explorer',
    source_type: 'government',
    discovery_domain: 'organization',
    domain: 'projects.propublica.org',
    base_url: 'https://projects.propublica.org/nonprofits',
    access_method: 'web_search',
    responsible_division: 'reconnaissance',
    description: 'Free public database of IRS Form 990 filings for tax-exempt organizations.',
  },
  {
    name: 'Official NGO & Charity Websites',
    source_type: 'ngo',
    discovery_domain: 'organization',
    domain: '',
    base_url: '',
    access_method: 'web_search',
    responsible_division: 'reconnaissance',
    description: 'Official websites of recognized NGOs, charities, and humanitarian organizations.',
  },
  {
    name: 'UN OCHA ReliefWeb',
    source_type: 'ngo',
    discovery_domain: 'humanitarian',
    domain: 'reliefweb.int',
    base_url: 'https://reliefweb.int',
    access_method: 'web_search',
    responsible_division: 'humanitarian',
    description: 'UN-maintained humanitarian information service covering global emergencies, disasters, and relief operations.',
  },
  {
    name: 'USAID Humanitarian Assistance',
    source_type: 'government',
    discovery_domain: 'humanitarian',
    domain: 'usaid.gov',
    base_url: 'https://www.usaid.gov',
    access_method: 'web_search',
    responsible_division: 'humanitarian',
    description: 'US government agency for international development and humanitarian assistance.',
  },
  {
    name: 'Recognized Medical Relief Organizations',
    source_type: 'ngo',
    discovery_domain: 'organization',
    domain: '',
    base_url: '',
    access_method: 'web_search',
    responsible_division: 'humanitarian',
    description: 'Official sources for recognized medical-relief organizations (Direct Relief, Doctors Without Borders, Americares, etc.).',
  },
  {
    name: 'Recognized Military & Veteran Support Organizations',
    source_type: 'ngo',
    discovery_domain: 'organization',
    domain: '',
    base_url: '',
    access_method: 'web_search',
    responsible_division: 'humanitarian',
    description: 'Official sources for recognized military/veteran support organizations (Fisher House, Operation Homefront, Wounded Warrior Project, etc.).',
  },
  {
    name: 'Legitimate Humanitarian News Sources',
    source_type: 'news',
    discovery_domain: 'news',
    domain: '',
    base_url: '',
    access_method: 'web_search',
    responsible_division: 'intelligence',
    description: 'Recognized humanitarian news and reporting sources (Reuters, AP, BBC, UN news, etc.).',
  },
];

// ============================================================
// DISCOVERY PROMPTS
// ============================================================

const ORGANIZATION_PROMPT = `You are the Vantoris HeroBox Discovery Engine. Your task is to discover REAL, LEGITIMATE charitable and humanitarian organizations from the web using Google Search.

NEVER fabricate organizations, names, ratings, EINs, or URLs. If you cannot verify a field from a real public source, leave it empty or mark it "Not rated by Charity Navigator" for ratings. Do NOT invent ratings.

Search for legitimate organizations across these categories:
- Medical relief organizations (e.g., Direct Relief, Doctors Without Borders/MSF, Americares, International Rescue Committee)
- Military & veteran support organizations (e.g., Fisher House Foundation, Operation Homefront, Army Emergency Relief, Air Force Aid Society, Navy-Marine Corps Relief Society, Blue Star Families, Folds of Honor, Homes For Our Troops, Semper Fi & America's Fund, DAV Charitable Service Trust, Gary Sinise Foundation, Wounded Warrior Project)
- Humanitarian relief organizations (e.g., International Rescue Committee, World Central Kitchen, Catholic Relief Services, Save the Children, UNICEF USA, Red Cross)
- Children's homes, orphanages, and family support organizations
- Food assistance organizations (e.g., Feeding America, food banks)
- Emergency and disaster response organizations

These are EXAMPLES of the type of organizations to discover — NOT a whitelist. Discover additional legitimate organizations automatically.

For EACH organization, collect from legitimate public sources:
- name: Official organization name
- organization_type: One of (ngo, charity, medical_relief, veteran_support, military_family_support, deployed_support, military_support, food_assistance, emergency_relief, disaster_response, childrens_home, orphanage, shelter, humanitarian, community)
- logo_url: Official logo URL if publicly available (empty string if not)
- description: Short factual description
- mission: The organization's stated mission if available
- location: Headquarters location
- areas_served: Geographic areas or populations served
- website_url: Official website URL
- charity_navigator_url: Charity Navigator profile URL if it exists (empty string if not)
- charity_navigator_rating: The rating if available (e.g., "4/5 stars", "Give with Confidence"). If no rating exists, use exactly: "Not rated by Charity Navigator"
- ein: IRS Employer Identification Number if publicly documented (empty string if not)
- financial_info: Brief financial accountability summary if available
- programs: Array of program descriptions
- current_needs: Array of current documented needs
- source_url: The URL where this information was found
- source_name: Name of the source
- source_domain: Domain of the source
- confidence_level: low/medium/high based on source quality
- verification_status: verified if from official source, partially_verified if from secondary, unverified otherwise

IMPORTANT: A Charity Navigator rating verifies information about the ORGANIZATION according to Charity Navigator's methodology. It does NOT verify individual people, photographs, medical diagnoses, specific stories, or specific campaigns.

Return up to 15 real organizations. Every organization MUST have a real source_url.`;

const HUMANITARIAN_PROMPT = `You are the Vantoris HeroBox Discovery Engine. Your task is to discover REAL, LEGITIMATELY DOCUMENTED humanitarian needs and cases from the web using Google Search.

NEVER fabricate people, needs, medical conditions, or emergencies. Only create a case when sufficient public evidence exists from a credible source. Do NOT diagnose medical conditions.

Search for:
- Legitimately documented humanitarian assistance needs (food, shelter, essential supplies)
- Verified emergency and disaster relief needs
- Children's homes and orphanages with documented needs
- Military families with documented support needs
- Community support needs from recognized organizations

For EACH case, collect:
- case_title: Descriptive title
- recipient_type: One of (individual, family, childrens_home, orphanage, shelter, ngo, organization, military_personnel, military_family, community)
- recipient_name: Public name if documented (empty if not)
- category: One of (financial_assistance, surgery_medical, food, essential_supplies, children_support, shelter, emergency, military_support, communication, disaster_relief, other)
- location: Geographic location if documented
- stated_need: The documented need in the source's words
- requested_assistance: What is being requested
- estimated_amount: Amount in USD if documented (0 if not)
- source_url: Real URL where this was documented
- source_name: Source name
- evidence: Array of evidence items
- risk_flags: Array of risk indicators if any
- confidence_level: low/medium/high
- verification_status: unverified, partially_verified, or verified

Return up to 10 real, documented cases. Every case MUST have a real source_url. If you cannot find enough credible cases, return fewer — do NOT fabricate.`;

const NEWS_PROMPT = `You are the Vantoris HeroBox Discovery Engine. Your task is to discover REAL, RECENT humanitarian news from legitimate news sources using Google Search.

Search for recent (last 30 days) humanitarian news from recognized sources (Reuters, AP, BBC, UN News, ReliefWeb, etc.):
- Breaking humanitarian developments
- Disaster response updates
- Refugee and displacement situations
- Military family support initiatives
- Medical relief efforts
- Food security and hunger crises
- Children and family humanitarian situations

For EACH news item:
- headline: The news headline
- summary: Factual summary
- category: One of (breaking, international, local, humanitarian, military, financial, corporate, regulatory, technology, vantoris_relevant)
- source_url: Real URL to the article
- source_name: News source name
- source_domain: Domain
- publication_date: Publication date if available
- is_confirmed: true only if confirmed by multiple credible sources
- confidence_level: low/medium/high
- verification_status: unverified, partially_verified, or verified

Return up to 10 real news items. Every item MUST have a real source_url.`;

// ============================================================
// MAIN DISCOVERY FUNCTION
// ============================================================

/**
 * Execute a full HeroBox discovery cycle.
 * Discovers organizations, humanitarian cases, and news, then routes
 * everything through the verification pipeline.
 *
 * @param {Object} options - { autoApproveHighConfidence }
 * @returns {Object} - { organizations, cases, news, errors, summary }
 */
export async function executeHeroBoxDiscovery(options = {}) {
  const { autoApproveHighConfidence = true } = options;

  // Log the run
  const run = await base44.entities.DiscoveryRun.create({
    run_type: 'organization_discovery',
    status: 'running',
    started_at: new Date().toISOString(),
    triggered_by: 'manual',
    responsible_division: 'reconnaissance',
  }).catch(() => null);

  const summary = {
    organizations: { discovered: 0, updated: 0, consolidated: 0, approved: 0 },
    cases: { discovered: 0, updated: 0, consolidated: 0, approved: 0 },
    news: { discovered: 0, updated: 0, approved: 0 },
    errors: [],
  };

  try {
    // === PHASE 1: DISCOVER ORGANIZATIONS ===
    const orgResults = await discoverOrganizations(autoApproveHighConfidence);
    summary.organizations = orgResults;

    // === PHASE 2: DISCOVER HUMANITARIAN CASES ===
    const caseResults = await discoverHumanitarianCases(autoApproveHighConfidence);
    summary.cases = caseResults;

    // === PHASE 3: DISCOVER HUMANITARIAN NEWS ===
    const newsResults = await discoverHumanitarianNews(autoApproveHighConfidence);
    summary.news = newsResults;

    // Update run
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_checked: HEROBOX_SOURCES.length,
        records_discovered: summary.organizations.discovered + summary.cases.discovered + summary.news.discovered,
        records_updated: summary.organizations.updated + summary.cases.updated + summary.news.updated,
        summary: `HeroBox Discovery: ${summary.organizations.discovered} organizations (${summary.organizations.approved} auto-approved), ${summary.cases.discovered} cases (${summary.cases.approved} auto-approved), ${summary.news.discovered} news items.`,
      }).catch(() => {});
    }

    return summary;
  } catch (err) {
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: JSON.stringify([err.message]),
        summary: `HeroBox discovery failed: ${err.message}`,
      }).catch(() => {});
    }
    summary.errors.push(err.message);
    return summary;
  }
}

// ============================================================
// ORGANIZATION DISCOVERY
// ============================================================

async function discoverOrganizations(autoApprove) {
  const result = { discovered: 0, updated: 0, consolidated: 0, approved: 0, errors: [] };

  try {
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: ORGANIZATION_PROMPT,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                organization_type: { type: 'string' },
                logo_url: { type: 'string' },
                description: { type: 'string' },
                mission: { type: 'string' },
                location: { type: 'string' },
                areas_served: { type: 'string' },
                website_url: { type: 'string' },
                charity_navigator_url: { type: 'string' },
                charity_navigator_rating: { type: 'string' },
                ein: { type: 'string' },
                financial_info: { type: 'string' },
                programs: { type: 'array', items: { type: 'string' } },
                current_needs: { type: 'array', items: { type: 'string' } },
                source_url: { type: 'string' },
                source_name: { type: 'string' },
                source_domain: { type: 'string' },
                confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                verification_status: { type: 'string', enum: ['unverified', 'partially_verified', 'verified'] },
              },
            },
          },
        },
      },
    });

    const items = llmResponse?.items || [];

    // Fetch existing organizations for deduplication
    const existingOrgs = await base44.entities.OrganizationProfile.filter(
      { status: { $in: ['discovered', 'verification_pending', 'verified', 'approved', 'active'] } },
      '-date_discovered', 100
    ).catch(() => []);

    for (const item of items) {
      try {
        if (!item.name || !item.source_url) continue;

        // === DEDUPLICATE ===
        const dupCheck = findDuplicate(
          { title: item.name, source_url: item.source_url },
          existingOrgs
        );

        if (dupCheck.isDuplicate && dupCheck.matchType === 'url') {
          // Exact URL match — update last_checked
          await base44.entities.OrganizationProfile.update(dupCheck.duplicateRecord.id, {
            date_last_verified: new Date().toISOString(),
          }).catch(() => {});
          result.updated++;
          continue;
        }

        if (dupCheck.isDuplicate && dupCheck.matchType === 'title') {
          // Consolidate — add corroborating source
          await consolidateDuplicate(dupCheck.duplicateRecord, item, 'OrganizationProfile');
          result.consolidated++;
          continue;
        }

        // === SOURCE RELIABILITY ===
        const reliability = assessSourceReliability({
          source_type: item.source_domain?.includes('charitynavigator') ? 'regulator' : 'ngo',
          verification_status: item.verification_status || 'unverified',
          corroborating_count: 0,
          conflicting_count: 0,
        });

        // === RISK CHECK ===
        const riskFlags = flagRisks(item, { result: item.verification_status });

        // === CREATE DISCOVERY RECORD ===
        const discoveryRecord = await base44.entities.DiscoveryRecord.create({
          discovery_domain: 'organization',
          title: item.name,
          description: item.description || '',
          content_summary: item.description || '',
          source_url: item.source_url,
          source_domain: item.source_domain || '',
          source_name: item.source_name || '',
          source_classification: item.verification_status === 'verified' ? 'primary' : 'secondary',
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          evidence_summary: `Discovered from ${item.source_name || item.source_url}`,
          responsible_division: 'reconnaissance',
          next_recheck: computeNextRecheck(168),
          status: 'active',
        });

        // === CREATE ORGANIZATION PROFILE ===
        const orgData = {
          name: item.name,
          organization_type: mapOrgType(item.organization_type),
          logo_url: item.logo_url || '',
          description: item.description || '',
          mission: item.mission || '',
          location: item.location || '',
          areas_served: item.areas_served || '',
          website_url: item.website_url || item.source_url,
          charity_navigator_url: item.charity_navigator_url || '',
          charity_navigator_rating: item.charity_navigator_rating || 'Not rated by Charity Navigator',
          ein: item.ein || '',
          financial_info: item.financial_info || '',
          programs: JSON.stringify(item.programs || []),
          current_needs: JSON.stringify(item.current_needs || []),
          contact_info: '',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          source_url: item.source_url,
          source_name: item.source_name || '',
          corroborating_sources: JSON.stringify([]),
          evidence_summary: `Discovered from ${item.source_name || item.source_url}`,
          discovery_record_id: discoveryRecord.id,
          date_discovered: new Date().toISOString(),
          date_last_verified: new Date().toISOString(),
          next_verification_at: computeNextRecheck(168),
          status: 'discovered',
          responsible_division: 'humanitarian',
          risk_flags: JSON.stringify(riskFlags),
        };

        const org = await base44.entities.OrganizationProfile.create(orgData);

        // Link discovery record to organization
        await base44.entities.DiscoveryRecord.update(discoveryRecord.id, {
          linked_entity_type: 'OrganizationProfile',
          linked_entity_id: org.id,
        }).catch(() => {});

        result.discovered++;

        // === AUTO-APPROVE HIGH-CONFIDENCE VERIFIED RECORDS ===
        if (autoApprove && item.verification_status === 'verified' && item.confidence_level === 'high') {
          await transitionOrgState(org.id, 'verification_pending').catch(() => {});
          await transitionOrgState(org.id, 'verified').catch(() => {});
          await transitionOrgState(org.id, 'approved').catch(() => {});
          await base44.entities.OrganizationProfile.update(org.id, {
            verification_status: 'verified',
            confidence_level: 'high',
          }).catch(() => {});
          result.approved++;
        } else {
          // Move to verification_pending for review
          await transitionOrgState(org.id, 'verification_pending').catch(() => {});
        }

        // Add to existing list for future dedup
        existingOrgs.push(org);
      } catch (err) {
        result.errors.push(err.message);
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  }

  return result;
}

// ============================================================
// HUMANITARIAN CASE DISCOVERY
// ============================================================

async function discoverHumanitarianCases(autoApprove) {
  const result = { discovered: 0, updated: 0, consolidated: 0, approved: 0, errors: [] };

  try {
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: HUMANITARIAN_PROMPT,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                case_title: { type: 'string' },
                recipient_type: { type: 'string' },
                recipient_name: { type: 'string' },
                category: { type: 'string' },
                location: { type: 'string' },
                stated_need: { type: 'string' },
                requested_assistance: { type: 'string' },
                estimated_amount: { type: 'number' },
                evidence: { type: 'array', items: { type: 'string' } },
                risk_flags: { type: 'array', items: { type: 'string' } },
                source_url: { type: 'string' },
                source_name: { type: 'string' },
                confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                verification_status: { type: 'string', enum: ['unverified', 'partially_verified', 'verified'] },
              },
            },
          },
        },
      },
    });

    const items = llmResponse?.items || [];

    const existingCases = await base44.entities.HumanitarianCase.filter(
      { case_status: { $in: ['discovered', 'verification_pending', 'review_pending', 'approved', 'active'] } },
      '-date_discovered', 100
    ).catch(() => []);

    for (const item of items) {
      try {
        if (!item.case_title || !item.source_url) continue;

        // === DEDUPLICATE ===
        const dupCheck = findDuplicate(
          { title: item.case_title, source_url: item.source_url },
          existingCases
        );

        if (dupCheck.isDuplicate && dupCheck.matchType === 'url') {
          await base44.entities.HumanitarianCase.update(dupCheck.duplicateRecord.id, {
            date_last_verified: new Date().toISOString(),
          }).catch(() => {});
          result.updated++;
          continue;
        }

        if (dupCheck.isDuplicate && dupCheck.matchType === 'title') {
          await consolidateDuplicate(dupCheck.duplicateRecord, item, 'HumanitarianCase');
          result.consolidated++;
          continue;
        }

        // === RISK CHECK ===
        const riskFlags = flagRisks(item, { result: item.verification_status });

        // === CREATE DISCOVERY RECORD ===
        const discoveryRecord = await base44.entities.DiscoveryRecord.create({
          discovery_domain: 'humanitarian',
          title: item.case_title,
          description: item.stated_need || '',
          content_summary: item.stated_need || '',
          source_url: item.source_url,
          source_name: item.source_name || '',
          source_classification: 'secondary',
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          evidence_summary: `Discovered from ${item.source_name || item.source_url}`,
          responsible_division: 'humanitarian',
          next_recheck: computeNextRecheck(72),
          status: 'active',
        });

        // === CREATE HUMANITARIAN CASE ===
        const caseData = {
          case_title: item.case_title,
          recipient_type: mapRecipientType(item.recipient_type),
          recipient_name: item.recipient_name || '',
          category: mapCaseCategory(item.category),
          location: item.location || '',
          stated_need: item.stated_need || '',
          requested_assistance: item.requested_assistance || '',
          estimated_amount: item.estimated_amount || 0,
          source_url: item.source_url,
          source_name: item.source_name || '',
          discovery_record_id: discoveryRecord.id,
          evidence: JSON.stringify(item.evidence || []),
          corroborating_sources: JSON.stringify([]),
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          date_discovered: new Date().toISOString(),
          date_last_verified: new Date().toISOString(),
          next_verification_at: computeNextRecheck(72),
          case_status: 'discovered',
          review_status: 'pending',
          assigned_division: 'humanitarian',
          risk_flags: JSON.stringify([...(item.risk_flags || []), ...riskFlags]),
        };

        const newCase = await base44.entities.HumanitarianCase.create(caseData);

        // Link discovery record
        await base44.entities.DiscoveryRecord.update(discoveryRecord.id, {
          linked_entity_type: 'HumanitarianCase',
          linked_entity_id: newCase.id,
        }).catch(() => {});

        result.discovered++;

        // === AUTO-APPROVE HIGH-CONFIDENCE VERIFIED CASES ===
        if (autoApprove && item.verification_status === 'verified' && item.confidence_level === 'high') {
          await transitionCaseState(newCase.id, 'verification_pending').catch(() => {});
          await transitionCaseState(newCase.id, 'review_pending').catch(() => {});
          await transitionCaseState(newCase.id, 'approved').catch(() => {});
          await transitionCaseState(newCase.id, 'active').catch(() => {});
          result.approved++;
        } else {
          await transitionCaseState(newCase.id, 'verification_pending').catch(() => {});
        }

        existingCases.push(newCase);
      } catch (err) {
        result.errors.push(err.message);
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  }

  return result;
}

// ============================================================
// HUMANITARIAN NEWS DISCOVERY
// ============================================================

async function discoverHumanitarianNews(autoApprove) {
  const result = { discovered: 0, updated: 0, approved: 0, errors: [] };

  try {
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: NEWS_PROMPT,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                summary: { type: 'string' },
                category: { type: 'string' },
                source_url: { type: 'string' },
                source_name: { type: 'string' },
                source_domain: { type: 'string' },
                publication_date: { type: 'string' },
                is_confirmed: { type: 'boolean' },
                confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                verification_status: { type: 'string', enum: ['unverified', 'partially_verified', 'verified'] },
              },
            },
          },
        },
      },
    });

    const items = llmResponse?.items || [];

    const existingNews = await base44.entities.NewsRecord.filter(
      { status: 'active' },
      '-discovered_date', 50
    ).catch(() => []);

    for (const item of items) {
      try {
        if (!item.headline || !item.source_url) continue;

        // === DEDUPLICATE ===
        const dupCheck = findDuplicate(
          { title: item.headline, source_url: item.source_url },
          existingNews
        );

        if (dupCheck.isDuplicate && dupCheck.matchType === 'url') {
          await base44.entities.NewsRecord.update(dupCheck.duplicateRecord.id, {
            last_checked: new Date().toISOString(),
          }).catch(() => {});
          result.updated++;
          continue;
        }

        // === CREATE DISCOVERY RECORD ===
        const discoveryRecord = await base44.entities.DiscoveryRecord.create({
          discovery_domain: 'news',
          title: item.headline,
          description: item.summary || '',
          content_summary: item.summary || '',
          source_url: item.source_url,
          source_domain: item.source_domain || '',
          source_name: item.source_name || '',
          source_classification: 'secondary',
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          responsible_division: 'intelligence',
          next_recheck: computeNextRecheck(24),
          status: 'active',
        });

        // === CREATE NEWS RECORD ===
        await base44.entities.NewsRecord.create({
          headline: item.headline,
          summary: item.summary || '',
          category: mapNewsCategory(item.category),
          source_url: item.source_url,
          source_name: item.source_name || '',
          source_domain: item.source_domain || '',
          publication_date: item.publication_date || null,
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          corroborating_sources: JSON.stringify([]),
          is_confirmed: item.is_confirmed || false,
          responsible_division: 'intelligence',
          discovery_record_id: discoveryRecord.id,
          status: 'active',
        });

        result.discovered++;

        if (autoApprove && item.verification_status === 'verified' && item.is_confirmed) {
          result.approved++;
        }
      } catch (err) {
        result.errors.push(err.message);
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  }

  return result;
}

// ============================================================
// HELPERS
// ============================================================

function computeNextRecheck(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function mapOrgType(type) {
  const validTypes = [
    'ngo', 'charity', 'childrens_home', 'orphanage', 'shelter', 'humanitarian',
    'military_support', 'veteran_support', 'military_family_support', 'deployed_support',
    'medical_relief', 'food_assistance', 'emergency_relief', 'disaster_response',
    'community', 'business', 'provider', 'government',
  ];
  if (!type) return 'ngo';
  const lower = type.toLowerCase();
  if (validTypes.includes(lower)) return lower;
  // Map common variations
  if (lower.includes('medical')) return 'medical_relief';
  if (lower.includes('veteran')) return 'veteran_support';
  if (lower.includes('military_family') || lower.includes('family')) return 'military_family_support';
  if (lower.includes('deployed')) return 'deployed_support';
  if (lower.includes('food')) return 'food_assistance';
  if (lower.includes('emergency')) return 'emergency_relief';
  if (lower.includes('disaster')) return 'disaster_response';
  if (lower.includes('orphan')) return 'orphanage';
  if (lower.includes('children')) return 'childrens_home';
  if (lower.includes('shelter')) return 'shelter';
  if (lower.includes('charity')) return 'charity';
  return 'ngo';
}

function mapRecipientType(type) {
  const validTypes = [
    'individual', 'family', 'childrens_home', 'orphanage', 'shelter',
    'ngo', 'organization', 'military_personnel', 'military_family', 'community',
  ];
  if (!type) return 'organization';
  const lower = type.toLowerCase();
  if (validTypes.includes(lower)) return lower;
  if (lower.includes('military_family') || lower.includes('family')) return 'military_family';
  if (lower.includes('military') || lower.includes('soldier')) return 'military_personnel';
  if (lower.includes('orphan')) return 'orphanage';
  if (lower.includes('children')) return 'childrens_home';
  if (lower.includes('shelter')) return 'shelter';
  if (lower.includes('individual')) return 'individual';
  if (lower.includes('family')) return 'family';
  if (lower.includes('community')) return 'community';
  return 'organization';
}

function mapCaseCategory(category) {
  const validCategories = [
    'financial_assistance', 'surgery_medical', 'food', 'essential_supplies',
    'children_support', 'shelter', 'emergency', 'military_support',
    'communication', 'disaster_relief', 'other',
  ];
  if (!category) return 'other';
  const lower = category.toLowerCase();
  if (validCategories.includes(lower)) return lower;
  if (lower.includes('medical') || lower.includes('surgery')) return 'surgery_medical';
  if (lower.includes('food')) return 'food';
  if (lower.includes('supply') || lower.includes('supplies')) return 'essential_supplies';
  if (lower.includes('children')) return 'children_support';
  if (lower.includes('shelter')) return 'shelter';
  if (lower.includes('emergency')) return 'emergency';
  if (lower.includes('military')) return 'military_support';
  if (lower.includes('disaster')) return 'disaster_relief';
  if (lower.includes('communication')) return 'communication';
  return 'other';
}

function mapNewsCategory(category) {
  const validCategories = [
    'breaking', 'international', 'local', 'humanitarian', 'military',
    'financial', 'corporate', 'regulatory', 'technology', 'vantoris_relevant',
  ];
  if (!category) return 'humanitarian';
  const lower = category.toLowerCase();
  if (validCategories.includes(lower)) return lower;
  return 'humanitarian';
}

// ============================================================
// DATA LOADER — for the HeroBox Discover UI
// ============================================================

/**
 * Load approved content for the HeroBox Discover screen.
 * Only returns approved/active records — never unverified content.
 */
export async function loadHeroBoxDiscoverContent() {
  const [orgs, cases, news] = await Promise.all([
    base44.entities.OrganizationProfile.filter(
      { status: { $in: ['approved', 'active'] } },
      '-date_discovered', 50
    ).catch(() => []),
    base44.entities.HumanitarianCase.filter(
      { case_status: { $in: ['approved', 'active'] } },
      '-date_discovered', 30
    ).catch(() => []),
    base44.entities.NewsRecord.filter(
      { verification_status: { $in: ['verified', 'partially_verified'] }, status: 'active' },
      '-discovered_date', 20
    ).catch(() => []),
  ]);

  return { organizations: orgs, cases, news };
}

/**
 * Load ALL discovered content for admin review (including unverified).
 */
export async function loadAllDiscoveredContent() {
  const [orgs, cases, news, records] = await Promise.all([
    base44.entities.OrganizationProfile.list('-date_discovered', 100).catch(() => []),
    base44.entities.HumanitarianCase.list('-date_discovered', 100).catch(() => []),
    base44.entities.NewsRecord.list('-discovered_date', 50).catch(() => []),
    base44.entities.DiscoveryRecord.filter(
      { discovery_domain: { $in: ['organization', 'humanitarian', 'news'] } },
      '-discovered_date', 100
    ).catch(() => []),
  ]);

  return { organizations: orgs, cases, news, records };
}