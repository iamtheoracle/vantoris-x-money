# Vantoris X Money — Build Tracker

**Product identity:** Vantoris X Money (not Vantoris Private Institution, not AVCU).
**Repository:** `iamtheoracle/vantoris-x-money`
**Base branch:** `main`
**Working branch:** `work/xmoney-independent-runtime`
**Base/starting HEAD:** `792cfa325bdb778363433eb1c1783089c44b71f3`
**Tracker created:** 2026-11-15
**Authority:** this tracker records repository evidence only. It does not authorize a production migration, money movement, provider activation, merge or deployment.

## Founder-approved architecture constraints

- Vantoris X Money remains its own product and institutional authority.
- It must not be merged with Vantoris Private Institution, AVCU, Ashcombe Private Bank or Group Headquarters.
- Base44 must not be required at build time, runtime, data, authentication, authorization or operations.
- Vantoris-owned PostgreSQL is the authority for member identity, sessions, account records, posted balances, holds, journals, statements, transfers and audit evidence.
- Member and staff authentication/permissions are distinct. Server authorization and least privilege are mandatory; client-supplied roles/IDs are not authority.
- Financial mutations require authorization, idempotency, immutable audit, transaction integrity and required independent approval/confirmation.
- No fabricated balances, provider states, issued cards, investment holdings, settlement, external rails or operational status.
- Preserve existing approved capabilities and records. No destructive reset, data rewrite or removal by assumption.
- Never merge, deploy, force-push, alter production data or apply production migrations without explicit authorization and evidence.

## Repository verification

- GitHub repository metadata confirms public, non-archived repository `iamtheoracle/vantoris-x-money`, default branch `main`.
- `main` HEAD at tracker creation: `792cfa325bdb778363433eb1c1783089c44b71f3`.
- Working branch created from that exact HEAD: `work/xmoney-independent-runtime`.
- GitHub compare confirms working branch initially identical to `main` (0 ahead / 0 behind).
- No pre-existing `BUILD_TRACKER.md` or `docs/BUILD_TRACKER.md` was found on `main`.
- Main `README.md` identifies the product as Vantoris X Money but states that the full application tree is missing and Base44 configuration is still required.
- Main `package.json` contains `@base44/sdk` and `@base44/vite-plugin`; main `vite.config.js` actively installs the Base44 Vite plugin.
- Main `src/App.jsx`, `src/main.jsx`, `netlify/functions/member-auth.mjs` and `docs/VANTORIS-INSTITUTIONAL-LEDGER.md` are absent on `main` (GitHub contents API returned 404). Main contains an AVCU-labelled migration `migrations/001_avcu_payment_control_plane.sql`; this is not accepted as Vantoris X Money's authoritative ledger.
- The full recovered application exists on other branches, but the examined `migration/remove-base44-and-codex` branch changes product identity in `README.md` and `package.json` to **Vantoris Private Institution**. Its large recovered tree and Vantoris-specific migrations are not safe to transplant into X Money without an audited product/source separation. Do not rename that branch's product or merge its code into X Money as a shortcut.

## Branch overlap audit (relative to main)

All four recovered branches share merge base `b72e4b274292975166f7376873351507c55947b9`, are diverged from `main` by 10 commits behind, and contain extensive overlapping recovered application source. They are not safe to merge by name alone.

| Branch | Ahead | Behind | Status | Finding |
|---|---:|---:|---|---|
| `migration/remove-base44-and-codex` | 1615 | 10 | diverged | Full recovered tree; README/package identify Vantoris Private Institution, not X Money. |
| `recovery/merge-vantoris-live` | 824 | 10 | diverged | Large overlapping recovered tree; requires product identity and content-level reconciliation. |
| `work/private-institution-programme` | 1138 | 10 | diverged | Explicit private-institution programme; do not merge into X Money. |
| `feat/private-investment-heritage-design` | 865 | 10 | diverged | Large overlapping recovered tree; requires product identity and content-level reconciliation. |

The branches above were inspected read-only. No other branch was modified.

## Fix queue

1. **BLOCKED — establish the complete authoritative X Money source tree.** Main is a partial Base44 shell; the largest recovered branch explicitly identifies as Vantoris Private Institution. Required: locate an X Money-specific complete source snapshot/commit or perform a file-by-file provenance review proving which recovered files belong to X Money, while preserving the Private Institution product separately. Acceptance: complete route/API/schema inventory; no cross-product identity, member, ledger or secret leakage; founder-approved source manifest.
2. **BLOCKED — obtain an executable checkout and record exact-HEAD baseline.** Required: terminal-backed checkout of `work/xmoney-independent-runtime`, Node compatible with its package lock, and disposable PostgreSQL for any database tests. Acceptance: clean git status, install from lockfile, execute every declared test/lint/typecheck/build/migration contract command and record exact output. No test suite is declared in main `package.json`.
3. **PLANNED — remove Base44 from the X Money build/runtime only after source recovery.** Audit all imports, plugins, entity/function calls, environment variables, auth/session paths and operational jobs. Acceptance: no Base44 package, plugin, endpoint or required credential; clean build and route coverage; no feature loss.
4. **PLANNED — establish Vantoris-owned PostgreSQL schema, migrations, RLS and least-privilege roles.** Acceptance: clean disposable PostgreSQL migration from zero, upgrade path, constraint/transaction tests, cross-member and staff isolation tests, immutable audit, idempotency and concurrency tests.
5. **PLANNED — recover and verify member and staff lifecycles.** Preserve member applications, KYC evidence, activation, MFA, recovery, sessions, staff provisioning, capability assignment and dual-control. Acceptance: lifecycle tests, server-side authorization tests, audit evidence and fail-closed behavior.
6. **PLANNED — recover every approved member, operations and institutional capability.** Maintain a route/feature preservation register; unavailable integrations must be explicit unavailable states, not mock success.
7. **PLANNED — production readiness evidence.** Data-source reconciliation, backup/restore, key management, incident controls, browser QA, CI, release review and operational runbooks. No deployment or production migration is implied.

## Found, not fixed

- Main `README.md` claims a full Base44 backend but simultaneously says the full application tree is missing.
- Main `vite.config.js` activates Base44; package manifest includes Base44 SDK/plugin.
- Main includes an AVCU payment-control migration; product ownership and intended use are not established for X Money.
- Recovered migration branch contains Vantoris Private Institution identity and a substantial independent PostgreSQL implementation. It is not evidence that the same source is X Money.
- Other recovered branches overlap substantially and diverge from main. No merge was attempted.
- No local repository checkout, Node runtime, npm install, PostgreSQL server or project test execution was available in this chat execution environment. GitHub file APIs are not a substitute for executing tests.
- No CI run on the new working branch/HEAD was observed.

## Baseline at tracker creation

- HEAD: `792cfa325bdb778363433eb1c1783089c44b71f3`.
- Working tree: not observable through GitHub contents API; no local checkout exists in the execution environment. Do not report clean.
- `npm test`: NOT RUN; no test script is declared in main `package.json`.
- `npm run lint`: NOT RUN; no executable checkout/dependencies.
- `npm run build`: NOT RUN; no executable checkout/dependencies.
- Typecheck: NOT DECLARED in main `package.json`.
- PostgreSQL/migration tests: NOT RUN; no local PostgreSQL or database credentials.
- Baseline result: BLOCKED, not passed.

## Execution log — 2026-11-15

- Founder clarified target as **Vantoris X Money**. Do not treat Vantoris Private Institution as the same product.
- Created working branch `work/xmoney-independent-runtime` from `main` HEAD `792cfa325bdb778363433eb1c1783089c44b71f3`.
- First safe item was to establish this tracker and record exact source/branch evidence. No application code was changed.
- Stopped at fix queue item 1: the available complete recovered branch explicitly belongs to Vantoris Private Institution; main is only a partial X Money shell. The next queue item (baseline) is also blocked because no executable checkout/runtime is available.
- Files changed: `BUILD_TRACKER.md` only.
- Tests before/after: NOT RUN / NOT RUN for the reasons above. No code change was made, so no test result is implied.
- Delivery: built — no product code; tested — not run; security verified — no; CI verified — no; merged — no; deployed — no; operational — not established.
- Exact next dependency: recover the complete X Money-specific source package/commit or provide evidence for a file-by-file provenance reconciliation; then run the working branch in a terminal-backed environment and execute the full baseline before implementation.


## Required ecosystem dependency — Vantoris Base

Vantoris Base is a required shared-infrastructure dependency in the wider Vantoris completion plan. It is not optional and must not be confused with the Base44 vendor SDK/platform or with the legacy `base44/` source folder retained in recovered branches.

### X Money integration boundary

- X Money must retain its own PostgreSQL database, member identity, staff identity, ledger, balances, payment operations, audit records, financial authority and release controls.
- Base may provide explicitly authorised platform services such as organisation registry, service identity, scoped integration contracts, notifications, document infrastructure, monitoring or group-level coordination.
- Base must not become the X Money ledger, hold member financial records in an unrestricted shared database, or grant Group HQ staff direct money-movement authority.
- Shared authentication, if eventually approved, does not replace X Money server-side authorisation. Every X Money request must still resolve the actual member/staff actor, resource ownership, action and X Money policy on the server.
- Any integration must use versioned APIs/events, dedicated service identities, least-privilege scopes, signed/replay-protected webhooks, audit correlation and defined failure behaviour. No client-supplied tenant, role, account or approval claim is trusted.
- X Money must continue to fail closed and preserve its local authoritative records if Base is unavailable. Base outage must not create, approve, post or settle financial operations.

### Current Base evidence and blocker

- The group master tracker records the dedicated Base workstream and acceptance criteria: https://github.com/iamtheoracle/vantoriss/blob/feat/vantoris-institutional-world/docs/MASTER_COMPLETION_TRACKER.md
- GitHub repository inventory did not identify an authoritative `vantoris-base` repository.
- Institutional Link / Group HQ remains the known Base44 application, but previous Base44 sandbox access was blocked by exhausted workspace integration credits. Do not retry its sandbox tools until access is restored.
- `oracle-control` is a separate Oracle Arc administrative control plane, not Vantoris Base.
- The legacy `base44/` directory in recovered VPI source is historical application code, not the shared Vantoris Base service.

### Acceptance dependency

Before X Money can be declared complete within the connected Vantoris ecosystem, the authoritative Base implementation must be identified, its relevant services verified, and X Money's authorised integration contract and failure-isolation tests must pass. This is an explicit ecosystem completion gate; it does not block independent X Money source recovery or safe local engineering work.


## Recovery branch identity conflict — source inspection update (15 November 2026)

The large branch `recovery/merge-vantoris-live` is **not yet accepted as a clean, authoritative X Money source tree**, despite its README heading identifying Vantoris X Money.

### What the branch actually contains

- 426 tracked tree entries, including 324 under `src/`, 62 under `base44/`, 5 SQL migrations, 2 test files, and only two Netlify function files (`ask.mjs`, `market.mjs`).
- Its `package.json` uses the generic name `base44-app` and still includes `@base44/sdk`, `@base44/vite-plugin`, Stripe browser SDK packages and the Base44 Vite plugin.
- Its `index.html` title is `Vantoris — Verified Member Banking`, canonical URL is `https://vantorispip.sbs`, and Open Graph title is `Vantoris — Private Investment & Payments`, not a clean X Money identity.
- Its `docs/` directory contains AVCU-specific payment-rail, ACH/Fedwire, provider-gateway, transaction ownership and payment-store documents.
- Its migrations create the `avcu_payments` schema and AVCU payment/ledger tables. The migration tests are named and written for AVCU.
- Its recovery workflow injects an AVCU ledger test database secret and a Base44 app ID/server URL. These are not evidence of a dedicated X Money backend or production source identity.
- The branch README says it restores the original Vantoris app from `The-Oracle-Arc/vantoris-live`, but also says source recovery remains incomplete and more entities/functions/workflows/components still need to be recovered.

### Pull request and CI evidence

- PR #2 is open, draft, unmerged and currently not mergeable; it contains 824 commits and 375 changed files.
- Latest inspected head: `d0a68ddbfe7551835744624f39ff73445f6694e4`.
- [Recovery build check — run 43307051683](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43307051683) failed in the Oracle runtime validation step.
- Oracle runtime tests: 2 passed.
- Payment store contract tests: 2 passed, 1 ignored because the disposable PostgreSQL URL was not configured.
- Payment migration contract tests: 5 passed, 1 failed. The failing assertion expects `FOR UPDATE SKIP LOCKED` in `migrations/005_avcu_payment_outbox_claims.sql`; the inspected migration adds claim columns and an index but does not contain that locking clause. Subsequent entity validation, lint, typecheck and build steps were skipped.
- No live Base44 RLS verification, PostgreSQL provider-store integration, authenticated browser QA or production deployment is established by this run.

### Decision for source preservation

This branch contains useful historical UI and recovery work, but its X Money README conflicts with AVCU-specific migrations/docs, Vantoris PIP canonical branding and generic Base44 app configuration. It cannot be treated as a clean X Money source manifest without resolving those conflicts.

Do not merge PR #2 into X Money `main`, rename the branch, or transplant files into VPI/AVCU until the product/file-level provenance review is complete. Preserve the branch and its existing PR history. Recover the original X Money product specification, route map, identity, data ownership and exact source lineage before selecting any files.

The VPI branch `migration/remove-base44-and-codex` remains a separate source-declared VPI implementation and must not be used to fill X Money gaps.

### Required next recovery action

Build a file-level provenance matrix for `recovery/merge-vantoris-live`: each route, component, entity, function, migration, asset and configuration file must be classified as X Money, VPI, AVCU, generic legacy/shared, or unresolved, with commit/source evidence. Only verified X Money-owned files may be retained in an X Money recovery branch. Do not delete or move unresolved files; preserve them pending review.
