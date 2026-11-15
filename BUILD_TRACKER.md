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


## Execution update — provenance evidence slice and execution-environment blocker (15 November 2026)

### Repository and branch verification

- **Current — verified:** Repository is `iamtheoracle/vantoris-x-money`; default/base branch is `main`; designated working branch is `work/xmoney-independent-runtime`.
- **Current — verified:** Before this update, GitHub compare confirmed working branch HEAD `a0c37a351501b5cb73c31a9aaab96d86b7c932a6`. After the provenance evidence commit, compare confirmed HEAD `2791a9ae2433dc0d9320d82efbb75d03fba0cd7a`.
- **Current — verified:** Working branch was 4 commits ahead of main before this continuation and 0 behind; its changes were documentation-only. The new provenance commit adds one further commit. No application source, migration or configuration from a recovered branch was merged.
- **Current — verified:** The VPI source branch `migration/remove-base44-and-codex` is exactly at `11ec54f9067db3e8c24bf4b026daf2062a7d5978`; comparing that commit with the branch ref returns identical.
- **Current — verified:** The public-site branch `iamtheoracle/vantoriss:feat/vantoris-institutional-world` is based on `main` and is 52 commits ahead / 0 behind at the comparison performed. The separate `feature/rcc-corporate-history` branch is diverged (4 ahead / 65 behind relative to the Vantoris institutional-world branch) and changes `src/App.jsx`; it was inspected read-only and not merged. This is an overlap warning for future public-site work, not part of this X Money change.

### Fix queue status

1. **BLOCKED — complete authoritative X Money source tree.** A first content-level provenance slice is recorded in `docs/UPSTREAM_RECOVERY_DIFF.md`. It confirms the recovery branch has conflicting X Money self-description, generic Base44 package identity, Vantoris PIP canonical metadata and AVCU-specific payment schema/docs/UI. The separate migration branch identifies as Vantoris Private Institution in `package.json`. The full 138 changed-file review and complete 40/139 path classifications remain outstanding. No source was moved or removed.
2. **BLOCKED — executable exact-HEAD baseline.** A terminal-backed checkout is still unavailable. A clone attempt for `work/xmoney-independent-runtime` failed with `Could not resolve host: github.com`. The GitHub contents/compare APIs cannot execute project commands or expose a local working tree.
3. **PLANNED — Base44 removal, PostgreSQL, identity, lifecycle and capability recovery.** These remain downstream of a verified X Money source manifest and executable baseline.

### Tests and verification

- **Current — verified:** `main/package.json` declares `build`, `lint` and `dev`; it does not declare a `test` or `typecheck` script. It still includes `@base44/sdk` and `@base44/vite-plugin`.
- **Current — verified:** No local checkout was available; `git clone` failed at DNS resolution. Therefore `npm ci`, `npm test`, `npm run lint`, `npm run build`, migration tests and PostgreSQL tests were **NOT RUN** in this continuation. The working tree cannot be reported clean because it is not locally observable.
- **Current — verified:** The new change is documentation-only. No application code, dependency, route, schema, migration, secret, provider setting or runtime behavior changed.
- **Current — verified:** No CI result is claimed for this documentation commit. Prior CI evidence on the VPI branch applies only to its exact commit and is not an X Money baseline.

### Files changed and delivery

- `docs/UPSTREAM_RECOVERY_DIFF.md` — added a sourced first-slice provenance matrix for README, package metadata, canonical branding, AVCU payment migration/docs/UI, payment function and route source.
- `BUILD_TRACKER.md` — this execution update and blocker record.
- Tests before / after: **NOT RUN / NOT RUN** — no terminal checkout or DNS resolution; no `test` script on X Money main. No test pass is implied.
- Built: no product code in this slice; provenance documentation built.
- Tested: not run.
- Security verified: no.
- CI verified: no for this working-branch commit.
- Committed: yes, documentation-only commits on `work/xmoney-independent-runtime`.
- Merged: no.
- Deployed: no.
- Operational: not established.

### Exact next action

1. Restore terminal/network access or provide an executable checkout of `iamtheoracle/vantoris-x-money` at `work/xmoney-independent-runtime`.
2. Verify local HEAD and clean/dirty working tree; run `npm ci`, then every declared lint/build/test/migration command and record output. Provision only a disposable PostgreSQL service for database tests.
3. Continue the file-level provenance matrix for the remaining changed router/authentication files, payment functions/entities and all upstream-only/recovery-only paths. Do not transplant or rename unresolved files.
4. Keep the VPI source on its own branch and preserve its existing migration history. Do not merge, deploy or activate providers.



## Expanded provenance reconciliation — exact tree evidence (15 November 2026)

### Current — source comparison

Compared the complete recursive Git trees:
- Original upstream `The-Oracle-Arc/vantoris-live` at `7ededd1eb4a7b946a9ac50371b33546aad0e0d29`.
- Recovery PR #2 head `iamtheoracle/vantoris-x-money:recovery/merge-vantoris-live` at `d0a68ddbfe7551835744624f39ff73445f6694e4`.

Verified tree counts:
- Upstream blobs: 478.
- Recovery blobs: 379.
- Common paths: 339.
- Byte-identical common blobs: 201.
- Changed common blobs: 138.
- Upstream-only omissions: 139.
- Recovery-only additions: 40.
- PR #2 changed-file list: 375 paths (368 added, 7 modified).

Changed common paths: 107 under `src/`, 20 under `base44/`, 11 root/config/Netlify files.
Upstream-only Base44 omissions (104): 17 agents, 3 connectors, 44 entity schemas, 7 functions, 6 registries, 3 runtime modules, 14 shared services, 9 workflows, 1 other.
Recovery-only additions: 20 Base44 paths, 5 docs, 5 migrations, 2 tests, 4 source paths, 3 GitHub workflow/instruction paths, and 1 root runtime configuration.

The full path-level comparison and the exact omitted-file inventory are recorded in `docs/UPSTREAM_RECOVERY_DIFF.md`.

### Current — critical identity and ownership findings

- Eleven recovery-only files are explicitly AVCU-named: four AVCU docs, five AVCU SQL migrations and two AVCU tests.
- The recovered `base44/functions/oracleRuntime/entry.ts` labels stored history `AVCU Assistant`.
- `netlify/functions/ask.mjs` uses AVCU-prefixed usage/spend keys and hardcoded Base44 app/server fallbacks.
- Recovery package is named `base44-app`, not X Money; it retains Base44 SDK/plugin and Stripe browser dependencies.
- Recovery `index.html` points canonical and Open Graph URLs to `https://vantorispip.sbs`.
- Original upstream also has generic Base44 package identity, so package name alone cannot establish product ownership.
- Original `src/lib/assistantRouter.js` (Vantoris Command divisions) is missing from recovery; recovery has a different Oracle/Nexus runtime surface.
- Legacy upstream SessionService uses process-local memory; MemoryService stores JSON in Base44 entities and its expiry routine only queries expired rows; CapabilityRegistry includes enabled capabilities with empty permission arrays. These are source facts, not accepted production controls.

### Fix queue update

1. **IN PROGRESS — source provenance classification.** Full tree counts and exact path groups are now recorded. Still outstanding: semantic review of all 138 changed blobs, product-owner classification of all 40 recovery-only additions, and required-capability analysis of the 139 omissions. No application files moved.
2. **BLOCKED — executable exact-HEAD test baseline.** Terminal-backed clone failed due DNS resolution for github.com. GitHub APIs support source inspection and commits but cannot run npm/Node/PostgreSQL tests or prove a clean local worktree.
3. **PLANNED — implementation of the next approved X Money slice.** Do not start until the source manifest and executable baseline identify the correct authoritative product files. Keep AVCU and VPI independent.

### Current — delivery and stats

- Documentation updated: `docs/UPSTREAM_RECOVERY_DIFF.md` and this tracker.
- Working branch comparison against `main`: 8 commits ahead, 0 behind at the pre-tracker verification; this tracker correction adds one further commit. Re-verify the resulting HEAD before treating the count as final.
- No app code, migration, dependency, route, provider or secret changed.
- Tests before/after: NOT RUN / NOT RUN; no local checkout.
- Built: provenance documentation only.
- Tested: no.
- Security verified: no.
- CI verified: no for these docs commits.
- Committed: yes, working branch only.
- Merged: no. Deployed: no. Operational: not established.

### Exact next action

Continue semantic comparison of the 138 changed blobs against their exact upstream versions, prioritizing authentication/session, Account/Transaction/User, application/account issuance, AI gateway/runtime and payment paths. For each changed file record upstream behavior, recovery behavior, security/permission differences, product ownership and disposition. Then classify recovery-only paths and assess the omitted source inventory against approved X Money capabilities. Do not transplant unresolved source.

