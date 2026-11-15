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
