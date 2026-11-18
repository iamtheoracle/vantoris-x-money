# Upstream Vantoris source recovery diff

**Purpose:** preserve source lineage and expose recovery omissions before any merge, transplant, rename or product reassignment.

## Exact source snapshots

- Upstream repository: `The-Oracle-Arc/vantoris-live`
- Upstream branch: `main`
- Upstream commit: `7ededd1eb4a7b946a9ac50371b33546aad0e0d29`
- Recovery repository: `iamtheoracle/vantoris-x-money`
- Recovery branch: `recovery/merge-vantoris-live`
- Recovery commit: `d0a68ddbfe7551835744624f39ff73445f6694e4`

The upstream README is a generic Base44 project README and the package name is `base44-app`; it does not independently declare X Money. The recovery README declares Vantoris X Money, but the recovery branch also contains AVCU-specific migrations and documents and Vantoris PIP branding metadata. Product ownership therefore remains subject to provenance review.

## Git-tree comparison

| Measure | Count |
|---|---:|
| Upstream tracked blobs | 478 |
| Recovery tracked blobs | 379 |
| Paths present in both | 339 |
| Identical blob contents | 201 |
| Same path, changed contents | 138 |
| Upstream-only paths missing from recovery | 139 |
| Recovery-only paths added after upstream | 40 |

A same-path identical blob is strong source-lineage evidence for that file. A changed blob requires content review. An upstream-only file is not necessarily X Money-owned, but it is a source omission that must be classified before recovery is considered complete. A recovery-only file is not automatically X Money-owned.

### Route comparison

- Upstream `src/App.jsx`: 103 declared route paths.
- Recovery `src/App.jsx`: 105 declared route paths.
- Upstream routes missing from recovery: 0.
- Additional recovery routes: 2.

All upstream route path strings remain present in the recovered router. The recovery branch adds:
- `/operations/incoming-bank-receipts`
- `/operations/payment-rails`

Route-string preservation does not prove component parity, backend workflow continuity, role authorization, production data continuity or live functionality.

## Upstream-only files missing from the recovery branch

These files exist in the upstream snapshot but are absent from the recovery tree. Their product ownership must be established before deciding whether to restore them to X Money, preserve them as Vantoris-wide source, or assign them to another product.

**By top-level area:**

- `(root)`: 6
- `base44/agents`: 17
- `base44/config.jsonc`: 1
- `base44/connectors`: 3
- `base44/entities`: 44
- `base44/functions`: 7
- `base44/shared`: 23
- `base44/workflows`: 9
- `docs/governance`: 3
- `scripts/test-zelle.mjs`: 1
- `server/llm-proxy.mjs`: 1
- `src/components`: 16
- `src/docs`: 1
- `src/hooks`: 1
- `src/lib`: 3
- `src/pages`: 1
- `src/styles`: 1
- `src/utils`: 1

**Complete path list:**

- `.gitignore`
- `CLAUDE.md`
- `Claude .pdf`
- `Create GitHub App.pdf`
- `base44/agents/command.jsonc`
- `base44/agents/communications.jsonc`
- `base44/agents/compliance.jsonc`
- `base44/agents/finance.jsonc`
- `base44/agents/humanitarian.jsonc`
- `base44/agents/intelligence.jsonc`
- `base44/agents/logistics.jsonc`
- `base44/agents/markets.jsonc`
- `base44/agents/navigation.jsonc`
- `base44/agents/operations.jsonc`
- `base44/agents/portfolio.jsonc`
- `base44/agents/reconnaissance.jsonc`
- `base44/agents/records.jsonc`
- `base44/agents/risk.jsonc`
- `base44/agents/security.jsonc`
- `base44/agents/support.jsonc`
- `base44/agents/vantoris_assistant.jsonc`
- `base44/config.jsonc`
- `base44/connectors/github.jsonc`
- `base44/connectors/googlesheets.jsonc`
- `base44/connectors/slackbot.jsonc`
- `base44/entities/AIEvent.jsonc`
- `base44/entities/AccountEnquiry.jsonc`
- `base44/entities/AppConfiguration.jsonc`
- `base44/entities/Application.jsonc`
- `base44/entities/CapabilityDefinition.jsonc`
- `base44/entities/CodeSnippet.jsonc`
- `base44/entities/DiscoveryAlert.jsonc`
- `base44/entities/DiscoveryChange.jsonc`
- `base44/entities/DiscoveryRecord.jsonc`
- `base44/entities/DiscoveryRun.jsonc`
- `base44/entities/DiscoverySource.jsonc`
- `base44/entities/Document.jsonc`
- `base44/entities/HealthCheck.jsonc`
- `base44/entities/HeroBoxActivity.jsonc`
- `base44/entities/HeroBoxOrder.jsonc`
- `base44/entities/HeroBoxProduct.jsonc`
- `base44/entities/HeroBoxProfile.jsonc`
- `base44/entities/HeroBoxRequest.jsonc`
- `base44/entities/HistoricalStatement.jsonc`
- `base44/entities/HumanitarianCase.jsonc`
- `base44/entities/InternalComment.jsonc`
- `base44/entities/InvestmentDepositRequest.jsonc`
- `base44/entities/InvestmentPortfolio.jsonc`
- `base44/entities/InvestmentSignal.jsonc`
- `base44/entities/InvestmentTransaction.jsonc`
- `base44/entities/InvestmentWithdrawalRequest.jsonc`
- `base44/entities/LegalRegulatoryRecord.jsonc`
- `base44/entities/MarketIntelligenceRecord.jsonc`
- `base44/entities/MemoryRecord.jsonc`
- `base44/entities/MessageThread.jsonc`
- `base44/entities/MetricRecord.jsonc`
- `base44/entities/NewsRecord.jsonc`
- `base44/entities/OperationalProfile.jsonc`
- `base44/entities/OrganizationProfile.jsonc`
- `base44/entities/Recommendation.jsonc`
- `base44/entities/Referral.jsonc`
- `base44/entities/ServiceRequest.jsonc`
- `base44/entities/ServiceTemplate.jsonc`
- `base44/entities/ThreadMessage.jsonc`
- `base44/entities/TransactionExport.jsonc`
- `base44/entities/VerificationRecord.jsonc`
- `base44/entities/VerificationRequest.jsonc`
- `base44/entities/WithdrawalLimit.jsonc`
- `base44/entities/ZelleProfile.jsonc`
- `base44/functions/bulkImportTransactions/entry.ts`
- `base44/functions/exportTransactionLedger/entry.ts`
- `base44/functions/generateAppCode/entry.ts`
- `base44/functions/onApplicationCreate/entry.ts`
- `base44/functions/onApplicationStatusChange/entry.ts`
- `base44/functions/onThreadMessageCreate/entry.ts`
- `base44/functions/rewriteCode/entry.ts`
- `base44/shared/registries/AIRegistry.ts`
- `base44/shared/registries/CapabilityRegistry.ts`
- `base44/shared/registries/EventRegistry.ts`
- `base44/shared/registries/ServiceRegistry.ts`
- `base44/shared/registries/ToolRegistry.ts`
- `base44/shared/registries/WorkflowRegistry.ts`
- `base44/shared/runtime/bud.ts`
- `base44/shared/runtime/index.ts`
- `base44/shared/runtime/specialists.ts`
- `base44/shared/services/AuditService.ts`
- `base44/shared/services/ConfigurationService.ts`
- `base44/shared/services/ConversationService.ts`
- `base44/shared/services/HealthService.ts`
- `base44/shared/services/IdentityService.ts`
- `base44/shared/services/KnowledgeService.ts`
- `base44/shared/services/MemoryService.ts`
- `base44/shared/services/MetricsService.ts`
- `base44/shared/services/ModelService.ts`
- `base44/shared/services/NotificationService.ts`
- `base44/shared/services/PromptService.ts`
- `base44/shared/services/SearchService.ts`
- `base44/shared/services/SessionService.ts`
- `base44/shared/services/TelemetryService.ts`
- `base44/workflows/Auto-Notify Member on Admin Message.jsonc`
- `base44/workflows/Auto-Notify Member on Application Status Change.jsonc`
- `base44/workflows/Auto-Trigger KYC Compliance on Application Create.jsonc`
- `base44/workflows/Daily Discovery Freshness Check.jsonc`
- `base44/workflows/Daily HeroBox Product Freshness Check.jsonc`
- `base44/workflows/Daily Humanitarian Discovery Sweep.jsonc`
- `base44/workflows/Daily News Intelligence Monitor.jsonc`
- `base44/workflows/Monthly HeroBox Google Sheets Export.jsonc`
- `base44/workflows/Monthly Transaction Ledger Export.jsonc`
- `components.json`
- `docs/governance/assistant-orchestration.md`
- `docs/governance/herobox-constitution.md`
- `docs/governance/herobox-operating-manual.md`
- `package-lock.json`
- `scripts/test-zelle.mjs`
- `server/llm-proxy.mjs`
- `src/components/vantoris/SocialBanner.jsx`
- `src/components/vantoris/herobox/CommunityFeed.jsx`
- `src/components/vantoris/herobox/DiscoverCard.jsx`
- `src/components/vantoris/herobox/DiscoverSection.jsx`
- `src/components/vantoris/herobox/HeroBoxDiscover.jsx`
- `src/components/vantoris/herobox/ImpactDashboard.jsx`
- `src/components/vantoris/herobox/OrbitResultCard.jsx`
- `src/components/vantoris/herobox/OrbitSearch.jsx`
- `src/components/vantoris/herobox/PackageShowcase.jsx`
- `src/components/vantoris/herobox/RequestCard.jsx`
- `src/components/vantoris/herobox/SponsorFlow.jsx`
- `src/components/vantoris/herobox/orbit/OrbitNoResults.jsx`
- `src/components/vantoris/herobox/orbit/OrbitResultCard.jsx`
- `src/components/vantoris/herobox/orbit/OrbitSearch.jsx`
- `src/components/vantoris/herobox/orbit/OrbitSuggestions.jsx`
- `src/components/vantoris/home/ImmersiveBalanceCard.jsx`
- `src/docs/governance/herobox-platform-enhancement.md`
- `src/hooks/useMemberAccess.jsx`
- `src/lib/assistantRouter.js`
- `src/lib/authReturnTo.js`
- `src/lib/heroboxPackages.js`
- `src/pages/OAuthConsent.jsx`
- `src/styles/autofill.css`
- `src/utils/index.ts`

## Recovery-only files added after the upstream snapshot

These files exist in the recovery branch but not in the upstream snapshot. They require provenance and product-boundary review.

**By top-level area:**

- `.github/copilot-instructions.md`: 1
- `.github/workflows`: 2
- `base44/entities`: 8
- `base44/functions`: 11
- `base44/shared`: 1
- `(root)`: 1
- `docs/avcu-ai-provider-gateway.md`: 1
- `docs/avcu-manual-ach-wire-operations.md`: 1
- `docs/avcu-payment-rail-security-audit.md`: 1
- `docs/avcu-transactional-payment-store.md`: 1
- `docs/transaction-ownership-migration.md`: 1
- `migrations/001_avcu_payment_control_plane.sql`: 1
- `migrations/002_avcu_backend_grants.sql`: 1
- `migrations/003_avcu_outgoing_funds_holds.sql`: 1
- `migrations/004_avcu_payment_audit_hardening.sql`: 1
- `migrations/005_avcu_payment_outbox_claims.sql`: 1
- `src/lib`: 1
- `src/pages`: 2
- `src/styles.css`: 1
- `tests/avcu-payment-migration.test.ts`: 1
- `tests/avcu-payment-store.test.ts`: 1

**Complete path list:**

- `.github/copilot-instructions.md`
- `.github/workflows/ai-engineering-agent.yml`
- `.github/workflows/recovery-build.yml`
- `base44/entities/AIAuditEvent.jsonc`
- `base44/entities/AIConversation.jsonc`
- `base44/entities/AIMessage.jsonc`
- `base44/entities/IncomingBankReceipt.jsonc`
- `base44/entities/PlaidTransferSyncState.jsonc`
- `base44/entities/TransferProviderCursor.jsonc`
- `base44/entities/TransferRequest.jsonc`
- `base44/entities/TransferWebhookEvent.jsonc`
- `base44/functions/_shared/paymentAuthorization.ts`
- `base44/functions/_shared/paymentStore.ts`
- `base44/functions/_shared/transferRails.ts`
- `base44/functions/bankTransferWebhook/entry.ts`
- `base44/functions/createTransferRequest/entry.ts`
- `base44/functions/reconcileBankTransfers/entry.ts`
- `base44/functions/recordIncomingBankReceipt/entry.ts`
- `base44/functions/recordManualTransferEvent/entry.ts`
- `base44/functions/reviewTransferRequest/entry.ts`
- `base44/functions/submitApprovedTransfer/entry.ts`
- `base44/functions/syncPlaidTransferEvents/entry.ts`
- `base44/shared/runtime/nexus.test.ts`
- `deno.json`
- `docs/avcu-ai-provider-gateway.md`
- `docs/avcu-manual-ach-wire-operations.md`
- `docs/avcu-payment-rail-security-audit.md`
- `docs/avcu-transactional-payment-store.md`
- `docs/transaction-ownership-migration.md`
- `migrations/001_avcu_payment_control_plane.sql`
- `migrations/002_avcu_backend_grants.sql`
- `migrations/003_avcu_outgoing_funds_holds.sql`
- `migrations/004_avcu_payment_audit_hardening.sql`
- `migrations/005_avcu_payment_outbox_claims.sql`
- `src/lib/oracleAssistant.js`
- `src/pages/operations/IncomingBankReceipts.jsx`
- `src/pages/operations/PaymentRailOperations.jsx`
- `src/styles.css`
- `tests/avcu-payment-migration.test.ts`
- `tests/avcu-payment-store.test.ts`

## Changed files shared by both snapshots

There are 138 paths present in both snapshots with different blob contents. High-risk groups include:
- `src/App.jsx` and route/layout/authentication code.
- Base44 entity schemas and server functions.
- Oracle runtime registries and services.
- Netlify function endpoints.
- package/build configuration and deployment configuration.

No changed file is automatically accepted as an X Money change merely because it appears in the recovery branch. Review each against the upstream blob and the intended X Money product specification.

## Specific recovery omissions with potential platform impact

The upstream-only list includes:

- 17 agent definition files under `base44/agents/`.
- `base44/config.jsonc`.
- 3 connector definitions (GitHub, Google Sheets, Slack bot).
- 44 entity schemas absent from the recovery branch.
- 7 server-function entry points absent from the recovery branch.
- 23 shared runtime/registry/service files, including identity, session, memory, notification, audit, telemetry, model, knowledge and workflow services.
- 9 workflow definitions absent from the recovery branch.
- 16 UI components and supporting hooks/pages/styles absent from the recovery branch.
- The original `server/llm-proxy.mjs` and `src/lib/assistantRouter.js` are upstream-only; the recovery branch has different AI gateway code and must be compared for capability and permission parity.

These are source files in the upstream Vantoris project, not proof that every service is production-ready. In particular, the presence of an IdentityService or MemoryService file does not prove secure operation, and the missing files are not automatically Vantoris Base. They are required inputs to the Base and application capability inventory.

## Recovery-only additions requiring identity review

- 8 Base44 entity schemas related to AI conversation/audit and payment/transfer events.
- 11 Base44 function/shared payment files related to transfer submission, webhook, event sync, reconciliation and incoming/manual bank receipts.
- 5 AVCU-labelled PostgreSQL migrations.
- 4 AVCU-specific payment/AI documentation files and 1 transaction ownership migration document.
- 2 AVCU payment test files.
- 2 additional operations routes for incoming bank receipts and payment rails.

The recovery workflow also injects AVCU ledger test configuration and Base44 app configuration. The recovered HTML metadata points to `vantorispip.sbs` and uses Vantoris/private-investment wording. These contradictions must be resolved before product identity can be accepted.

## Required next actions

1. Keep PR #2 draft and unmerged. Do not merge the 824-commit recovery branch into X Money `main`.
2. Classify all changed and recovery-only paths as X Money, VPI, AVCU, Vantoris-wide legacy/shared, or unresolved, with commit/content evidence.
3. Recover and classify all 139 upstream-only paths. Do not silently discard the agent, connector, entity, function, workflow, identity, memory, notification or audit definitions.
4. Confirm the approved product-specific route and feature manifest. Preserve all 103 upstream route paths and verify the additional two recovery routes independently.
5. Reconcile Base44 app ID, canonical URL, product branding, data owner, member identity domain and server endpoint. Do not point X Money at VPI or AVCU environments.
6. Resolve the failing migration contract test. Run full lint, typecheck, build, entity policy checks and PostgreSQL integration after the test/migration contract is corrected.
7. Establish X Money-owned database, identity, authorisation, audit and ledger architecture independently from VPI/AVCU.
8. Integrate with Vantoris Base only through explicit, versioned, least-privilege contracts after the authoritative Base runtime is identified.
9. No merge, production migration, provider activation or deployment until the founder-approved X Money manifest and release gates are satisfied.

## Status

- Upstream source snapshot located and compared: complete.
- Exact route-string comparison: complete.
- File-level tree difference generated: complete.
- Content-level review of all 138 changed blobs: outstanding.
- Product classification of all 139 upstream-only and 40 recovery-only paths: outstanding.
- Clean X Money source manifest: not established.
- Merge/deployment: not performed.


## Content-level provenance review — identity and payment-control slice (15 November 2026)

This is a first evidence slice for the required file-level provenance review. It does not classify all 138 changed blobs, all 40 recovery-only paths, or all 139 upstream-only paths. No file is moved, deleted, renamed, or accepted into an X Money source manifest by this review.

| File / source | Current evidence observed | Provenance classification for X Money |
|---|---|---|
| `recovery/merge-vantoris-live:README.md` | The README self-identifies the branch as Vantoris X Money, but explicitly describes recovery as incomplete and says the branch restores Base44-backed application services. | **Unresolved.** A README label alone does not establish product ownership. |
| `recovery/merge-vantoris-live:package.json` | Package name is `base44-app`; dependencies include `@base44/sdk`, `@base44/vite-plugin`, `@stripe/react-stripe-js` and `@stripe/stripe-js`. | **Unresolved / generic legacy shell.** Not an X Money-specific package identity; Base44 remains a build/runtime dependency. |
| `recovery/merge-vantoris-live:index.html` | Browser title is “Vantoris — Verified Member Banking”; canonical and Open Graph URL are `https://vantorispip.sbs`; Open Graph title is “Vantoris — Private Investment & Payments”. | **Vantoris PIP identity contamination; ownership unresolved.** Not evidence of X Money's approved public identity. |
| `recovery/merge-vantoris-live:migrations/001_avcu_payment_control_plane.sql` | SQL comment calls this an “AVCU payment-control foundation”; it creates schema `avcu_payments` and tables for provider events, payment operations, bank receipts and ledger accounts. | **AVCU-labelled; excluded from the X Money manifest.** The filename/schema are not evidence of X Money ownership. |
| `recovery/merge-vantoris-live:docs/avcu-payment-rail-security-audit.md` | The document title is “AVCU ACH and Fedwire implementation audit” and its release gates explicitly require confirming the AVCU legal applicant and sponsor-bank relationship. | **AVCU-specific content; excluded from the X Money manifest.** |
| `recovery/merge-vantoris-live:src/pages/operations/PaymentRailOperations.jsx` | The operations readiness page names AVCU as the legal applicant and states live payment processing is disabled; it describes a readiness guide, not payment submission or settlement. | **AVCU-specific content; excluded from the X Money manifest.** |
| `recovery/merge-vantoris-live:base44/functions/createTransferRequest/entry.ts` | The function imports the Base44 request client, authenticates with `base44.auth.me()`, loads an account through `asServiceRole`, and calls the payment-store helpers. Its surrounding recovery documentation and payment routes are AVCU-labelled. | **Unresolved payment implementation.** Do not accept into X Money without independent product, account-domain, database and authorization provenance. |
| `recovery/merge-vantoris-live:src/App.jsx` | The router imports member and operations route guards and declares member and operations application routes; the router itself does not establish which institution owns those routes. | **Unresolved shared application source.** Route-string parity is not feature, data, or permission parity. |
| `migration/remove-base44-and-codex:package.json` | Package name is `vantoris-private-institution`; dependencies include `postgres`; the inspected dependency list does not include the Base44 SDK or Vite plugin. | **Vantoris Private Institution source, not X Money.** This is direct product-identity evidence for that branch and confirms it must not fill X Money's missing source tree. |
| `main:README.md` and `main:package.json` | README identifies Vantoris X Money but says the full application tree is missing; package name is `vantoris-x-money`, and the package still includes the Base44 SDK/plugin. | **X Money partial shell only.** Main is not a complete executable product source tree. |

### Result of this review slice

- **Current — verified:** The recovered branch's self-declared X Money identity conflicts with its generic Base44 package, Vantoris PIP canonical metadata and AVCU-specific payment schema/docs/UI.
- **Current — verified:** The recovered payment-rail UI describes disabled readiness controls and explicitly references AVCU; it is not evidence of live payment processing.
- **Current — verified:** The separate `migration/remove-base44-and-codex` branch identifies as Vantoris Private Institution in `package.json`; it is not X Money.
- **Current — verified:** X Money `main` identifies as X Money but documents its own application tree as incomplete and still depends on Base44.
- **Planned:** Continue content review of the remaining changed router/authentication files, all payment functions/entities, all 40 recovery-only paths and the 139 upstream-only omissions. Record each path's source and product owner before any selection.
- **Planned:** Obtain a founder-approved X Money route/API/schema/feature manifest and preserve the VPI source as a separate product.
- **Current — verified:** No application code, migration, route, entity or provider configuration was changed by this review. No merge, deployment, provider activation or production migration occurred.


## Expanded path-level provenance reconciliation — 15 November 2026

### Exact source comparison

Compared the full recursive Git trees at:
- Original source: `The-Oracle-Arc/vantoris-live`, commit `7ededd1eb4a7b946a9ac50371b33546aad0e0d29`.
- Recovery PR head: `iamtheoracle/vantoris-x-money`, branch `recovery/merge-vantoris-live`, commit `d0a68ddbfe7551835744624f39ff73445f6694e4`.

Git blob SHA comparison (path and content identity, not semantic correctness):
- Original source: 478 tracked blobs.
- Recovery source: 379 tracked blobs.
- Common paths: 339.
- Byte-identical common blobs: 201.
- Changed common blobs: 138.
- Original-only paths missing from recovery: 139.
- Recovery-only paths: 40.
- PR #2 file list: 375 changed paths (368 added, 7 modified).

Changed common blobs by area:
- `src/`: 107.
- `base44/`: 20.
- Root/config/docs/server: 11.

The 201 byte-identical paths are source-preserved at the blob level only; this does not establish compatibility, secure behavior, complete wiring, or test coverage.

### Original-only omissions — exact category counts

The 104 missing `base44/` paths break down as:
- Agent definitions: 17.
- Connector definitions: 3.
- Entity schemas: 44.
- Server functions: 7.
- Registries: 6.
- Runtime modules: 3.
- Shared services: 14.
- Workflow definitions: 9.
- Other Base44 paths: 1.

Other original-only paths:
- .gitignore, CLAUDE.md, Claude .pdf, Create GitHub App.pdf, components.json, docs/governance/assistant-orchestration.md, docs/governance/herobox-constitution.md, docs/governance/herobox-operating-manual.md, package-lock.json, scripts/test-zelle.mjs, server/llm-proxy.mjs, src/components/vantoris/SocialBanner.jsx, src/components/vantoris/herobox/CommunityFeed.jsx, src/components/vantoris/herobox/DiscoverCard.jsx, src/components/vantoris/herobox/DiscoverSection.jsx, src/components/vantoris/herobox/HeroBoxDiscover.jsx, src/components/vantoris/herobox/ImpactDashboard.jsx, src/components/vantoris/herobox/OrbitResultCard.jsx, src/components/vantoris/herobox/OrbitSearch.jsx, src/components/vantoris/herobox/PackageShowcase.jsx, src/components/vantoris/herobox/RequestCard.jsx, src/components/vantoris/herobox/SponsorFlow.jsx, src/components/vantoris/herobox/orbit/OrbitNoResults.jsx, src/components/vantoris/herobox/orbit/OrbitResultCard.jsx, src/components/vantoris/herobox/orbit/OrbitSearch.jsx, src/components/vantoris/herobox/orbit/OrbitSuggestions.jsx, src/components/vantoris/home/ImmersiveBalanceCard.jsx, src/docs/governance/herobox-platform-enhancement.md, src/hooks/useMemberAccess.jsx, src/lib/assistantRouter.js, src/lib/authReturnTo.js, src/lib/heroboxPackages.js, src/pages/OAuthConsent.jsx, src/styles/autofill.css, src/utils/index.ts.

This is a material recovery gap: missing entities, functions, registries, services and workflows are not optional presentation files. They may underpin routes and behavior. Do not label the restored application feature-complete while these paths remain unclassified/unrecovered.

### Recovery-only additions — exact category counts

- `base44/`: 20.
- `docs/`: 5.
- `migrations/`: 5.
- `tests/`: 2.
- `src/`: 4.
- `.github/`: 3.
- Root/runtime config: deno.json.

The recovery-only Base44 additions include payment authorization/store/rail helpers and transfer, webhook, reconciliation, manual receipt and approval functions. Their presence in the recovery branch is not proof that they belong to X Money.

### Explicit AVCU contamination — confirmed by paths and content

The following 11 paths are explicitly AVCU-named:
- `docs/avcu-ai-provider-gateway.md`
- `docs/avcu-manual-ach-wire-operations.md`
- `docs/avcu-payment-rail-security-audit.md`
- `docs/avcu-transactional-payment-store.md`
- `migrations/001_avcu_payment_control_plane.sql`
- `migrations/002_avcu_backend_grants.sql`
- `migrations/003_avcu_outgoing_funds_holds.sql`
- `migrations/004_avcu_payment_audit_hardening.sql`
- `migrations/005_avcu_payment_outbox_claims.sql`
- `tests/avcu-payment-migration.test.ts`
- `tests/avcu-payment-store.test.ts`

Content inspection additionally confirmed:
- `base44/functions/oracleRuntime/entry.ts` stores history under the label `AVCU Assistant`.
- `netlify/functions/ask.mjs` uses AVCU-prefixed usage/spend keys and a hardcoded Base44 app/server fallback.
- The recovery package is named `base44-app` and depends on Base44 SDK/plugin and Stripe browser packages.
- The recovery HTML canonical/OG metadata points to `https://vantorispip.sbs` and describes private investment/payments.
- The original upstream README and package also identify as generic Base44 app source; package name and Base44 dependency are inherited, not X Money-specific provenance.
- Original upstream `src/lib/assistantRouter.js` defines a Vantoris Command router and specialist divisions; that file is missing from recovery, replaced by a different Oracle/Nexus runtime surface. This is a semantic replacement, not source parity.
- Original upstream `base44/shared/services/SessionService.ts` uses an in-memory Map and one-hour TTL; `MemoryService.ts` stores JSON via Base44 entities and its `clearExpired()` only queries expired rows; `CapabilityRegistry.ts` includes enabled capabilities with empty permission arrays. These legacy implementations are not accepted as production-grade Base services.

### Classification outcome

- **Current — verified, inherited source:** 201 common paths are byte-identical to the named upstream commit.
- **Current — verified, modified source:** 138 common paths differ; all require review before acceptance.
- **Current — verified, missing source:** 139 original paths are absent from recovery, including the complete listed Base44 agent/entity/function/registry/runtime/service/workflow inventory.
- **Current — verified, recovery-only additions:** 40 paths do not exist in the original upstream tree; 11 of these are explicitly AVCU-labelled docs/migrations/tests. Other payment/runtime additions remain unresolved for X Money.
- **Current — verified, identity conflict:** recovery README says X Money, while package name remains generic, canonical metadata is Vantoris PIP, and selected runtime/payment code contains AVCU identifiers.
- **Current — verified, no code moved:** no source files were transplanted, renamed, deleted or merged in this review.

### Next classification tranche

1. Inspect the 138 changed blobs by functional group, prioritizing `src/App.jsx`, auth/session, Account/Transaction/User schemas, account issuance/application functions, Oracle runtime, AI gateway, and all payment store functions.
2. Compare each changed blob to its exact upstream counterpart and record semantic differences, not only hashes.
3. Classify all 40 recovery-only additions by product owner and dependency.
4. Build an explicit inventory for all 139 upstream omissions and determine which are required for approved X Money capabilities.
5. Keep AVCU-labelled source outside the X Money acceptance manifest unless the founder explicitly approves a documented ownership transfer. Keep VPI source separate.


## Semantic comparison tranche — identity, ledger schemas, issuance and AI gateway

Compared the following recovery files with their exact upstream blobs at 7ededd1eb4a7b946a9ac50371b33546aad0e0d29. Blob hashes are recorded for reproducibility.

| Path | Upstream blob | Recovery blob | Semantic finding / disposition |
|---|---|---|---|
| base44/entities/Account.jsonc | 7d631d6911681563fe6b563aa5888480233ff3db | bcc905bc36973efe3122e6377681e8cf4023c0f7 | Recovery adds owner/operator read RLS and denies client create/update/delete. Positive hardening at schema-source level; runtime policy enforcement remains unverified. |
| base44/entities/Transaction.jsonc | 2b1f650b2fcf3e7f28cc5d11cffdeaa1d4e07bdc | 2aac8533aed893186cb039be51cc16cddbd97e04 | Recovery adds user_id ownership and read RLS, denies client create/update/delete. Historical rows need verified owner backfill before member reads are complete; see docs/transaction-ownership-migration.md. |
| base44/entities/User.jsonc | dea79d78f5b00135a7230990fdbbfa77f0ba0fe8 | e390866aafc26274be27f061db1644b403dcb1d9 | Recovery adds field-level role update restriction to super_administrator, admin_notes field restrictions, and a top-level operator allowlist for read/update. This is not least-privilege by itself: operator roles can update user records at the entity level, so every mutable non-role field and every update path still requires direct policy tests and server-side authorization review. |
| base44/functions/generateAccount/entry.ts | e570b38de59891c498c20536c27439d8b5aed779 | 9430a13ef86e6d2abfd8a64cbb56effabe1dba36 | Recovery adds an operator role allowlist, approved application/target-member match, duplicate application guard and zero opening balance. This is a material security improvement. It still uses Base44 service-role entity operations and does not establish a self-owned PostgreSQL authority. |
| base44/functions/submitApplication/entry.ts | 515acb7e85dfe824a7c2de790db5fd01908bb70c | b425adf0fec131e775c3db1ec7dd0dceafffcf1f | Recovery adds body shape, bounded field and document-reference validation before persistence. Product ownership remains inherited from the generic upstream application; Base44 is still required. |
| base44/functions/oracleRuntime/entry.ts | f5d48acf897f2adb0eba34ba6149169b55ccf8b3 | 28749582ffbbd434a361e20940a684c75cb3b286 | Recovery restricts health diagnostics to an operator allowlist and fixes baseline capabilities to reasoning/knowledge instead of accepting browser capability hints. It labels conversation history AVCU Assistant and appends member/assistant continuity into a thread summary. The AVCU identity is a confirmed product-boundary defect for an X Money-labelled recovery branch; memory consent, retention and deletion enforcement are not proven. |
| netlify/functions/ask.mjs | 7acf3a8297b29d4d195e2d3aec596a56692a9ee3 | 34e1d42d21eb18afa907e0ec825f7fbe28a17dc0 | Recovery replaces the local canned-response fallback with authenticated provider routing, bounded usage reservations and explicit unavailable responses. However, its system prompt says “America Vanguard Credit Union (AVCU)”, Redis keys are AVCU-prefixed, Base44 app/server defaults are hardcoded, and provider order includes Base44. This is not an independent X Money gateway and must not be treated as one. |
| src/components/OperationsRoute.jsx | c2e3557313797340be50863bcbf76796c9ba8d24 | a8fb6f8522dc404b2df1c41ef4b15db0e026f1f9 | Frontend route guard uses hasOperationsAccess and super-admin checks. It is UI gating only; it does not replace server-side authorization. |
| src/components/MemberRoute.jsx | d94090b0850fa60a1955459423533ef07ad3800e | identical d94090b0850fa60a1955459423533ef07ad3800e | Source-preserved; no semantic change in this file. |

### Security and product-boundary disposition

- **Current — verified in source:** Recovery improves account issuance validation and adds client-write-deny / owner-scoped schema rules for Account and Transaction.
- **Current — verified in source:** Recovery still depends on Base44 for auth, entities, service-role access, AI routing and deployment configuration; it is not an independent PostgreSQL-backed X Money system.
- **Current — verified in source:** AVCU is explicitly embedded in the AI system prompt, Redis keys, assistant history label, payment migrations/docs/tests. This conflicts with the branch's X Money label and the founder's separate-institution boundary.
- **Current — verified in source:** The User entity top-level update policy permits a broad set of operator roles to update user records; field-level role restriction is narrower, but remaining mutable fields and server paths need verification.
- **Current — verified in source:** Account and Transaction RLS source definitions are not proof that equivalent live Base44 policies are deployed or enforced.
- **Planned:** Keep this source outside an X Money release acceptance manifest until product ownership, backend authority and identity are reconciled. Do not silently rename AVCU data into X Money.
- **Planned:** For any eventual PostgreSQL replacement, implement explicit role/action policy tests, member row isolation, service-role least privilege, immutable audit and atomic ledger posting before any operational activation.
- **Current — verified:** No application file or provider configuration was changed by this semantic comparison.

