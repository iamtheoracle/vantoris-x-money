# Vantoris Private Institution — Route and Capability Preservation Register

**Source inspected:** `work/private-institution-programme`  
**Route source:** `src/App.jsx` (blob 7cc8f315b180ada29ee39f3ff1d5b7759df10b39)  
**Inspection date:** 12 November 2026  
**Purpose:** record the existing recovered application surface before redesign. This is a source inventory, not proof that each route is deployed, accessible to a particular user, or backed by a live provider.

## Route inventory

The recovered router defines **6 public/authentication routes, 35 member routes, and 62 operations routes**. Redirect and fallback routes are recorded separately. No route is authorized for removal by this register.

### Public and authentication

| Path | Component |
|---|---|
| `/welcome` | `Landing` |
| `/login` | `Login` |
| `/brand` | `BrandIdentity` |
| `/register` | `Register` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password` | `ResetPassword` |

### Member experience

| Path | Component |
|---|---|
| `/` | `Home` |
| `/apply` | `Navigate` |
| `/apply/kyc` | `ApplyKYC` |
| `/accounts` | `Accounts` |
| `/accounts/:id` | `AccountDetail` |
| `/services` | `Services` |
| `/messages` | `Messages` |
| `/profile` | `Profile` |
| `/documents` | `MemberDocuments` |
| `/advisor` | `AskPage` |
| `/discovery` | `Discovery` |
| `/discover` | `Discover` |
| `/discover/news` | `DiscoverNews` |
| `/discover/fx` | `DiscoverFX` |
| `/discover/ngo` | `DiscoverNGO` |
| `/discover/marketing` | `DiscoverMarketing` |
| `/discover/flights` | `DiscoverFlights` |
| `/discover/housing` | `DiscoverHousing` |
| `/transactions` | `Transactions` |
| `/qr` | `MemberQR` |
| `/money` | `Money` |
| `/cards` | `CardsPage` |
| `/travel` | `TravelPage` |
| `/homes` | `HomesPage` |
| `/news` | `NewsPage` |
| `/ask` | `AskPage` |
| `/herobox-hub` | `HeroBoxHub` |
| `/support` | `SupportPage` |
| `/move-money` | `MoveMoney` |
| `/move` | `MoveMoney` |
| `/more` | `More` |
| `/dispute` | `TransactionDispute` |
| `/assistant` | `VantorisAssistant` |
| `/herobox` | `HeroBox` |
| `/investment` | `Investment` |

### Staff and operations

| Path | Component |
|---|---|
| `/operations` | `AdminOverview` |
| `/operations/executive` | `ExecutiveDashboard` |
| `/operations/security-dashboard` | `SecurityComplianceDashboard` |
| `/operations/applications` | `AdminApplications` |
| `/operations/kyc` | `AdminKYC` |
| `/operations/members` | `AdminMembers` |
| `/operations/operational-profiles` | `OperationalProfiles` |
| `/operations/accounts` | `AdminAccounts` |
| `/operations/withdrawals` | `AdminWithdrawals` |
| `/operations/withdrawal-limits` | `WithdrawalLimits` |
| `/operations/verification-requests` | `VerificationRequests` |
| `/operations/service-requests` | `ServiceRequests` |
| `/operations/member-messages` | `MemberMessages` |
| `/operations/referrals` | `Referrals` |
| `/operations/response-templates` | `ResponseTemplates` |
| `/operations/assistant` | `AdminAgent` |
| `/operations/recommendations` | `RecommendationReview` |
| `/operations/transaction-export` | `TransactionExportDashboard` |
| `/operations/impact-analytics` | `ImpactAnalytics` |
| `/operations/leaderboard` | `SupporterLeaderboard` |
| `/operations/herobox` | `HeroBoxMissionControl` |
| `/operations/herobox/heroes` | `HeroBoxHeroes` |
| `/operations/herobox/care-packages` | `HeroBoxCarePackages` |
| `/operations/herobox/volunteers` | `HeroBoxVolunteers` |
| `/operations/herobox/products` | `HeroBoxAdminProducts` |
| `/operations/herobox/orders` | `HeroBoxAdminOrders` |
| `/operations/herobox/funds-shipping` | `HeroBoxFundsShipping` |
| `/operations/discovery-network` | `DiscoveryNetwork` |
| `/operations/humanitarian-cases` | `HumanitarianCases` |
| `/operations/organizations` | `Organizations` |
| `/operations/finance` | `Finance` |
| `/operations/approvals` | `Approvals` |
| `/operations/deposits` | `Deposits` |
| `/operations/transfers` | `Transfers` |
| `/operations/incoming-bank-receipts` | `IncomingBankReceipts` |
| `/operations/payment-rails` | `PaymentRailOperations` |
| `/operations/documents` | `OperationsDocuments` |
| `/operations/cards` | `Cards` |
| `/operations/wallet-assignment` | `WalletAssignment` |
| `/operations/account-assignment` | `AccountAssignment` |
| `/operations/reports` | `Reports` |
| `/operations/executive-reports` | `ExecutiveReports` |
| `/operations/audit-logs` | `AuditLogs` |
| `/operations/aum-growth` | `AumGrowth` |
| `/operations/bulk-import` | `BulkTransactionImport` |
| `/operations/transaction-summaries` | `TransactionSummaries` |
| `/operations/withdrawal-audit-log` | `WithdrawalAuditLog` |
| `/operations/activity` | `ActivityTimeline` |
| `/operations/configuration` | `Configuration` |
| `/operations/api-management` | `ApiManagement` |
| `/operations/integrations` | `Integrations` |
| `/operations/notifications` | `OperationsNotifications` |
| `/operations/security` | `Security` |
| `/operations/feature-flags` | `FeatureFlags` |
| `/operations/background-jobs` | `BackgroundJobs` |
| `/operations/system-health` | `SystemHealth` |
| `/operations/data-integrity` | `DataIntegrityAudit` |
| `/operations/investment` | `InvestmentDashboard` |
| `/operations/investment/deposits` | `InvestmentDeposits` |
| `/operations/investment/withdrawals` | `InvestmentWithdrawals` |
| `/operations/investment/portfolios` | `InvestmentPortfolios` |
| `/operations/investment/signals` | `InvestmentSignals` |

### Redirect and fallback

| Path | Component |
|---|---|
| `/admin/*` | `Navigate` |
| `*` | `PageNotFound` |

## Backend surface present in this branch

- Base44 entity schemas: **18** JSONC files.
- Base44 server-function entry points: **11** (`bankTransferWebhook`, `createTransferRequest`, `generateAccount`, `oracleRuntime`, `reconcileBankTransfers`, `recordIncomingBankReceipt`, `recordManualTransferEvent`, `reviewTransferRequest`, `submitApplication`, `submitApprovedTransfer`, `syncPlaidTransferEvents`).
- SQL migrations: **5** (`001_avcu_payment_control_plane.sql`, `002_avcu_backend_grants.sql`, `003_avcu_outgoing_funds_holds.sql`, `004_avcu_payment_audit_hardening.sql`, `005_avcu_payment_outbox_claims.sql`).
- Test files: **5** (`tests/avcu-payment-migration.test.ts`, `tests/avcu-payment-store.test.ts`, `tests/financial-formatting.test.ts`, `tests/heritage-and-card-art.test.ts`, `tests/operational-truthfulness.test.ts`).

These are repository artifacts only. They do not prove that these schemas, functions or migrations are deployed to the Base44 application or production database. The actual deployed Base44 project and data environment remain unverified.

## Source-confirmed risks requiring remediation or proof

| Area | Source evidence | Current classification | Required action |
|---|---|---|---|
| Transaction approvals | `src/pages/operations/Approvals.jsx` previously attempted browser-side Account balance and Transaction status updates. PR #4 removes these writes and keeps the inbox read-only with links to dedicated queues. | Unsafe client mutation removed; generic server-authorized approval lifecycle remains missing. | Implement a server-side transactional, idempotent and audited approval lifecycle before re-enabling decisions. Never report a ledger update without a confirmed commit. |
| Account write policy | `base44/entities/Account.jsonc` denies direct client create/update/delete and scopes reads to owner plus named staff roles. | Repository policy present; deployed policy unverified | Compare exact deployed Base44 RLS with this schema; verify role claims are server-controlled. |
| Client-side privilege helper | `src/lib/operationsAccess.js` contains a hard-coded super-administrator email and client-side role/capability helpers. | UI gating only; not an authorization boundary | Ensure all sensitive route, record and action authorization is independently enforced server-side. Never trust a client role or email check. |
| Home wealth aggregation | `src/pages/Home.jsx` now distinguishes failed queries from empty results and withholds consolidated wealth totals; it still reads and displays individual recorded balances from client-side Base44 queries. | Safer data states in PR #4; authoritative server-side aggregation and deployed RLS remain unverified. | Verify deployed RLS, currency, freshness and valuation semantics; implement server-authorized aggregation before presenting a total. |
| Investment mutations | `src/pages/Investment.jsx` retains a disabled server-investment-operations guard. PR #4 also removes direct portfolio writes and decision buttons from the operator deposit/withdrawal queues while preserving request records. | Fail-closed; operator queues are read-only; investment schemas/provider/ledger remain unverified. | Recover deployed entity schemas and RLS; verify provider, custody/legal authority, ledger, dual-control and reconciliation before enabling. |
| Support lifecycle | Recovered Support implementation stores a note locally rather than proving a persistent server-side ticket lifecycle. | Incomplete source behavior; live exposure unverified | Implement durable ticket creation, assignment, status transitions, notification delivery and audit evidence. |
| Discovery inventory | Recovered housing discovery contains hard-coded example listings and estimated values. | Not verified live inventory | Do not present these as real listings; require sourced inventory or an honest unavailable state. |
| Provider status | Provider environment values and integration names exist in repository configuration. | Configuration is not proof of connectivity or entitlement | Verify credentials, contract, server integration, callbacks, reconciliation and operational ownership before claiming live service. |
| Member desktop shell | `src/components/vantoris/MemberLayout.jsx` still constrains member routes to a 430px shell; Home's own max-width cannot exceed that parent. | Member desktop navigation/layout remains incomplete. | Add responsive desktop navigation and wider page content while preserving mobile bottom navigation, floating command dock, session timeout and every member route. |

## CI configuration discrepancy

The current `.github/workflows/recovery-build.yml` declares `pull_request` targets `main` and `recovery/merge-vantoris-live`, and also declares `workflow_dispatch`. Therefore a PR targeting the recovery branch is **configured** to trigger the workflow. The latest commit-associated PR workflow lookup returned no runs for this work-branch head; this is evidence of no returned run, not evidence that the workflow's branch filter excludes the PR. Investigate Actions enablement, workflow state, event delivery and run visibility. Do not describe the workflow as branch-filtered away.

## Evidence and limitations

- Route existence is verified from the router source in this branch only.
- The full customer-visible behavior, actual Base44 deployment, RLS, provider contracts, live data, account continuity and production runtime have not been verified.
- No customer data or production configuration was read or changed.
- GitHub Actions run #657 passed install, Deno runtime/payment/migration checks, AI-path guard, entity/RLS validation, lint, typecheck and Vite build. The PostgreSQL integration test was ignored because `AVCU_LEDGER_TEST_DATABASE_URL` was not configured.
- Browser viewport QA, authenticated Base44 API checks and deployed RLS tests remain outstanding.
- The route list is a preservation baseline. Any proposed route consolidation or removal requires explicit founder approval and a verified migration plan.


## Additional Home, Accounts and Investment findings

| Area | Source evidence | Current classification | Required action |
|---|---|---|---|
| Home dashboard | PR #4 distinguishes failed Account/Card/Investment/Activity queries from empty results, removes the consolidated wealth total until currency and valuation sources are verified, expands Home's own max width and qualifies unverified benefits copy. | Improved component behavior; member parent shell still limits the route to 430px and balances remain client-query sourced. | Complete the responsive member shell, verify deployed RLS and currency semantics, and use server-authorized data before showing a consolidated wealth figure. |
| Currency model | `src/lib/formatCurrency.js` formats every amount as USD; the versioned `Account` schema has no currency field. | Currency metadata gap in the recovered source | Verify deployed account currency semantics. Add explicit currency and conversion/freshness metadata through a reviewed migration before multi-currency aggregation. Never add USD amounts to non-USD amounts. |
| Investment entity contracts | The member and operations UI reference `InvestmentPortfolio`, `InvestmentTransaction`, `InvestmentDepositRequest`, `InvestmentWithdrawalRequest` and `InvestmentSignal`; none has a corresponding JSONC entity schema in the current 18-file versioned schema directory. | Versioned contract missing; live Base44 schema unknown | Recover the exact deployed entity definitions and RLS before modifying investment screens or claiming the repository fully describes the backend. |
| Investment dashboard | `src/pages/operations/InvestmentDashboard.jsx` loads investment records with errors converted to empty arrays and computes AUM/cash/invested totals in the browser. | Unverified data source and potentially misleading zero totals | Move aggregate reporting to a server-authorized, currency-aware source with freshness and valuation timestamps. Show unavailable/error states separately from verified zero. |
| Accounts workspace | `src/pages/Accounts.jsx` currently wraps `MoveMoney`; account detail is a separate route at `/accounts/:id`. | Route exists, but dedicated account overview capability is not yet evidenced | Design an account list/detail workspace without losing payment entry points, statements, account detail or existing routes. Keep disabled payment actions clearly unavailable. |
| Payment controls | `src/pages/MoveMoney.jsx` explicitly disables payment/deposit operations and labels displayed values as recorded account balances rather than verified available funds. | Fail-closed guard and truthful warning present in source | Preserve the guard until a verified server-side ledger and approved processing workflow exist. Audit all other UI surfaces for inconsistent “available” or “sent” claims. |

## Current CI result

GitHub Actions run [#657](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43307304580) completed successfully for commit `827c9d0`. Dependency installation, JavaScript syntax check, Oracle runtime checks, payment-store unit tests, migration tests, browser-AI execution guard, entity/RLS validation, lint, typecheck and Vite production build passed. Test results: Oracle runtime 2 passed; payment-store 2 passed/1 ignored; migration checks 6 passed. The PostgreSQL integration test was ignored because `AVCU_LEDGER_TEST_DATABASE_URL` was not configured. Browser viewport QA and production authenticated-session checks remain outstanding.


## CI investigation and correction

- The first complete Deno run exposed a misplaced assertion: the migration test expected runtime SQL locking text inside the migration file, although `FOR UPDATE SKIP LOCKED` is correctly implemented in the worker source. The test now checks the migration's claimable-row index and separately checks the worker implementation.
- The next run then exposed a workflow permission defect: the migration test reads `base44/functions/_shared/paymentStore.ts`, but the Deno command granted read access only to `migrations` and `base44/entities`.
- The workflow permission was corrected on `recovery/merge-vantoris-live` (the PR base branch) to include `base44/functions/_shared`. A fresh PR-triggered run is required to verify this correction and continue through the AI-path checks, entity/RLS validation, lint, typecheck and build.
- The PostgreSQL integration test was **ignored** because `AVCU_LEDGER_TEST_DATABASE_URL` was not present in the CI environment. This means no PostgreSQL concurrency/ledger integration result has been established by these runs.
- Latest PR check `43307304580` completed successfully: Deno runtime tests, AI-path guard, entity/security validation, lint, typecheck, and production build all passed. This is branch CI evidence only; it does not establish live production or database integration correctness.


## Follow-up correction — first-party member transfer boundary

The member transfer panel no longer performs recipient lookup against Zelle-specific records or displays an external-network enrollment prompt. It now states that first-party member-to-member transfers are unavailable until the institution has a verified member directory, recipient consent, server-side authorization, funds reservation, dual-control policy where required, and an audited ledger lifecycle. The screen explicitly confirms that no recipient lookup, payment instruction, transfer request, or account change has been created. A regression test protects this boundary.


## Route preservation regression guard (13 November 2026)

The route preservation register is now checked against the actual React Router declarations in CI. The regression test verifies that the documented public, member and operations route inventory remains present in `src/App.jsx`; it also checks that the inventory has not silently collapsed below its recorded breadth. This is a source-level preservation check, not proof that each route is deployed or accessible to a given role.


## Account-detail missing-value correction (13 November 2026)

The account-detail page had a local formatter that converted `null` and blank strings to numeric zero before formatting. It now rejects null, undefined and whitespace-only values before numeric coercion, while preserving a genuine numeric zero. The financial-formatting test suite includes a regression guard. This prevents missing account balances or transaction amounts from appearing as $0.00.
