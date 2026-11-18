# Vantoris Institutional Portfolio Map and X Money Delivery Plan

**Repository:** `iamtheoracle/vantoris-x-money`  
**Product owner in this repository:** Vantoris X Money only  
**Working branch:** `work/xmoney-independent-runtime`  
**Status:** Planning and source-boundary document; not an implementation or operational certification  
**Authority:** This document organizes the founder-approved institutional portfolio and X Money dependencies. It does not authorize source transfers, database access, migrations, financial operations, merges, deployments, provider activation or launch.

## 1. Governing rule

Vantoris is one connected company with distinct institutions, products and operating spaces. Connection does not mean consolidation of legal identity, customer identity, accounts, ledgers, databases, credentials, permissions, financial authority or release ownership.

This repository is the delivery home for **Vantoris X Money**. It may document the whole Vantoris institutional map and the contracts X Money needs, but it must not become the code, database or release authority for every institution.

Preserve all existing approved functionality and historical source. No destructive reset, silent rename, source transplant, data rewrite, force-push or overwrite by assumption.

## 2. Institutional portfolio — correct placement

| Portfolio unit | Authoritative location currently evidenced | Responsibility | Boundary / placement in this plan |
|---|---|---|---|
| Vantoris Group / public company headquarters | `iamtheoracle/vantoriss`, branch `feat/vantoris-institutional-world` | Group identity, public company information, leadership, history, institutional directory and public enquiry | Group-level presentation and governance. No direct authority over institutional customer accounts or ledgers. |
| Institutional Link / Group Headquarters | Existing Base44 app ID `6af8b50525cd7f7bb57813cc` | Executive office, board, departments, workforce, delegation, institutional directory, group coordination, compliance oversight and shared services | Group coordination workspace. Access is scoped and auditable; no unrestricted institutional database or money-moving authority. Access restoration is a prerequisite to further implementation. |
| Vantoris Base | Authoritative repository/runtime not yet identified | Required shared infrastructure: organisation/service registry, scoped identity and integration contracts, access control, notifications, document infrastructure, workflows, monitoring, administration, recovery and AI governance | Shared platform services only. Not Base44, not Oracle Control, not a legacy `base44/` folder, and not a shared unrestricted financial database. Do not create a duplicate Base. |
| Vantoris Private Institution (VPI) | Recovered source is on branches inside this repository; independent VPI repository/application authority not yet verified | Institutional governance, workforce, research, institutional administration and its own approved member/institutional services | Separate institution and source/runtime. Do not treat VPI source as X Money or transplant it into X Money. Establish independent repository, identity, data, migrations, release and operational ownership. |
| Vantoris X Money | `iamtheoracle/vantoris-x-money` | Independent X Money member product and its own approved account/payment experience | This repository's sole product implementation scope. It must own its own member/staff identity, PostgreSQL data, ledger, balances, holds, payment lifecycle, audit and release controls. |
| Vantoris Credit Union / AVCU | Existing AVCU-specific work is evidenced in other repository history/branches and AVCU-labelled source in recovered branches | Separate credit-union institution and its own members, accounts, payment operations and financial authority | Keep AVCU identities, schemas, migrations, ledgers, providers and workflows separate. AVCU-labelled code in a mixed branch is not automatically X Money code. |
| Ashcombe Private Bank | `iamtheoracle/ashcombe-private-bank` | Independent private bank, Germany-first workstream, client admission, accounts, wealth/treasury and its own banking records | Separate bank, customer identity, PostgreSQL/Prisma data, ledger, permissions, compliance, provider and release authority. No X Money ownership of Ashcombe accounts or money. Switzerland remains separate. |
| T Market | Group division; authoritative product repository/specification not established | Founder-approved T Market purpose and operating model | Preserve the named division. Do not invent a generic marketplace, shop, trading or payment product. Recover the approved specification before implementation. |
| Public editorial and knowledge areas | Vantoris public-site repository and relevant institutional content stores | History, heritage, research, publications, spirituality/philosophy, stories and media | Public or permissioned content only. Keep source provenance, editorial review, rights, publication state and audit. No private institutional data leakage. |

### Independent adjacent systems — not Vantoris Base

- Oracle Control is an Oracle Arc administrative control plane with its own deployment and database. It is not Vantoris Base.
- Oracle Investment Platform is a separate investment platform with its own ledger and authority. It is not an institutional ledger for VPI, X Money, AVCU or Ashcombe.
- Neither may be silently reused as a Vantoris institutional identity, shared database or financial authority.

## 3. What belongs in this X Money repository

This repository must contain and verify:

1. X Money product identity, approved routes, UX and feature-preservation manifest.
2. X Money-specific member and staff authentication, MFA, recovery, sessions and authorization.
3. X Money-owned PostgreSQL schema, migrations, constraints, RLS and least-privilege roles.
4. X Money-owned account records, ledger journals/entries, holds, statements and audit.
5. Payment instruction lifecycle, approvals, idempotency, settlement evidence, returns and compensating reversals, only where supported by real contracts and providers.
6. X Money operations, reconciliation, exception handling, monitoring, incident response and recovery.
7. X Money-specific tests, CI, deployment manifests, runbooks and release evidence.
8. Versioned, least-privilege integration contracts to Base and other institutions where explicitly approved.

This repository may hold institutional boundary maps, dependency registers and integration specifications for the wider portfolio. It must not hold another institution's production records, credentials, migrations, account data or runtime as a shortcut.

## 4. Shared Base integration contract

Base is a required ecosystem dependency, but its authoritative implementation has not yet been identified.

Permitted shared-service candidates, subject to source inspection and explicit contracts:
- Organisation and institution registry.
- Service identity and scoped integration registration.
- Group-level directory and coordination metadata.
- Notifications and delivery infrastructure.
- Document storage infrastructure with institution-owned access policy.
- Workflow orchestration primitives that do not make institution-specific approval decisions.
- Monitoring, operational status and incident coordination.
- Administrative policy catalogue and AI governance controls.

Non-negotiable boundaries:
- Each institution remains authoritative for its own customers/members, accounts, financial records, ledger, approvals, audit and regulatory obligations.
- Base does not become X Money's ledger or hold unrestricted shared financial data.
- Group HQ personnel receive no implicit money movement or customer-record access.
- A shared identity assertion does not replace X Money's server-side actor, resource ownership, action and policy authorization.
- Use versioned APIs/events, dedicated service identities, least-privilege scopes, signed and replay-protected webhooks, correlation IDs and explicit failure behavior.
- X Money remains safe and fail-closed if Base is unavailable. Base downtime must not create, approve, post or settle financial operations.
- No shared database access by default. Data exchange must be purpose-limited, consent/authority-checked where applicable, logged and tested.

## 5. X Money source recovery — first critical dependency

Repository evidence at the time of this plan:
- `main` is a partial shell and its README says the full application tree is missing.
- `main` includes Base44 SDK/plugin dependencies and an AVCU-labelled payment-control migration; neither is accepted as proof of X Money's authoritative runtime or ledger.
- `recovery/merge-vantoris-live` has 426 tracked entries and overlaps with the original upstream `The-Oracle-Arc/vantoris-live`, but is mixed: AVCU-labelled migrations/docs/tests, Vantoris Private Institution metadata and generic Base44 dependencies coexist with the X Money README.
- The upstream comparison found 478 upstream blobs, 379 recovery blobs, 201 identical common blobs, 138 changed common blobs, 139 upstream-only paths and 40 recovery-only paths. Missing paths include entities, server functions, registries, services, workflows and UI/support files.
- `migration/remove-base44-and-codex` identifies itself as Vantoris Private Institution and must remain separate.
- PR #2 (recovery), PR #3 (heritage design) and PR #4 (VPI transformation) must not be assumed to be a coherent X Money release chain.

Required process:
1. Preserve all branches and PR history.
2. Produce a path-level provenance manifest for every route, component, entity, function, migration, asset, provider, secret reference, workflow and configuration file.
3. Classify each item as X Money, VPI, AVCU, Ashcombe, group/Base, generic legacy/shared, or unresolved; attach exact source commit/blob evidence and rationale.
4. Compare changed source against the original upstream and identify semantic changes, not just matching paths.
5. Account for all 139 upstream omissions and decide which approved X Money capabilities require recovery.
6. Keep unresolved files untouched and outside the X Money acceptance manifest.
7. Obtain founder approval for any consequential source transfer or product-boundary change.
8. Only then create a complete X Money-specific executable source tree and test baseline.

## 6. Ordered delivery phases

### Phase 0 — Preserve and establish authority
- Confirm repository, default branch, branch heads, open PRs, issues, exact SHAs and workflow evidence.
- Keep all draft work unmerged.
- Identify the approved X Money product specification and feature inventory.
- Preserve source, records and history; no reset or force-push.

**Exit:** source of truth, branch graph and change authority are documented.

### Phase 1 — Source provenance and feature recovery
- Complete the file-level classification described above.
- Reconcile upstream omissions, changed files and recovery-only additions.
- Identify the complete X Money-specific source tree.
- Preserve the VPI and AVCU workstreams without code/data crossover.

**Exit:** founder-reviewable X Money manifest and complete source snapshot.

### Phase 2 — Executable baseline
- Obtain a terminal-backed checkout of the exact candidate branch.
- Record Node/runtime/package manager versions and clean working-tree state.
- Install from the committed lockfile.
- Run declared syntax, tests, lint, typecheck and production build commands.
- Provision a disposable PostgreSQL instance for migration and integration tests.
- Record every command, output and exact SHA. Not run is not passed.

**Exit:** reproducible baseline with actual test evidence.

### Phase 3 — Independent X Money platform foundation
- Remove Base44 build/runtime/data/auth dependencies only after full source and feature recovery.
- Establish X Money-owned PostgreSQL, ordered migrations, schema constraints, RLS and least-privilege roles.
- Implement secure member/staff identity, MFA, recovery, sessions, actor binding and server-side authorization.
- Implement immutable audit and data-retention/recovery controls.

**Exit:** fresh PostgreSQL replay and security/isolation tests pass without Base44 dependency or feature loss.

### Phase 4 — Accounts and financial record integrity
- Preserve and map existing X Money account and transaction records using source evidence.
- Establish exact minor-unit money arithmetic and currency validation.
- Implement balanced journals, holds, available-balance rules, immutable posted entries and auditable corrections.
- Never invent balances, accounts, customers, beneficiaries, provider states or financial history.
- Keep each other institution's financial records outside X Money.

**Exit:** independently reconciled X Money records and ledger tests.

### Phase 5 — Payment lifecycle and integrations
- Implement instruction creation, authorization, independent approval, submission handoff, per-payment acceptance/rejection, partial-batch outcomes, settlement evidence, returns and linked compensating reversals.
- Add idempotency, concurrency control, replay protection, exception queues and reconciliation.
- Provider adapters remain optional and disabled until an actual provider contract, credentials, legal authority and test evidence exist.
- Manual file preparation/submission is not bank acceptance or settlement.
- Do not claim direct scheme connectivity or instant payment capability without verified implementation and certification.

**Exit:** lifecycle, rollback, retry, duplicate, concurrency and provider contract tests pass against a real test environment.

### Phase 6 — Member and staff product completion
- Restore every approved X Money route and capability in the preservation manifest.
- Complete account overview, transaction history, statements, support and operations surfaces.
- Keep unavailable integrations visibly unavailable; no mock success.
- Complete mobile/tablet/desktop, accessibility, loading, empty and error states.

**Exit:** role-by-role browser tests and route/feature parity evidence.

### Phase 7 — Base and institutional integrations
- First identify Base's authoritative implementation and owner.
- Restore Institutional Link access and inventory its existing services before implementing dependencies.
- Define one versioned contract per integration, with scoped service identity and data minimization.
- Add negative cross-institution tests for X Money, VPI, AVCU, Ashcombe and HQ.
- No direct shared-ledger or shared-customer-database access.

**Exit:** integration and failure-isolation tests pass while every institution retains independent authority.

### Phase 8 — Operations, security and recovery
- Complete staff access reviews, MFA/session revocation, dual-control, audit review and offboarding.
- Implement monitoring, alerting, incident response, backup and demonstrated restore.
- Complete document malware scanning/quarantine if document workflows are in scope.
- Complete dependency/security review, secrets/key management and runbooks.

**Exit:** operational ownership, recovery evidence and independent security acceptance.

### Phase 9 — Pre-release verification
- Exact-head CI green for the candidate commit.
- Fresh PostgreSQL migration replay from empty database and supported upgrade path.
- Unit, integration, end-to-end, authorization, concurrency, rollback, idempotency and lifecycle tests.
- Browser/device/accessibility and performance QA.
- Data continuity, backup restore, incident and rollback rehearsal.
- Legal/provider/operational prerequisites documented separately from engineering.

**Exit:** complete release evidence pack and unresolved blocker register.

### Phase 10 — Founder-controlled launch
- Prepare a product-specific release plan, change list, rollback plan and operational ownership.
- Confirm legal permissions, provider contracts, secrets, production database and monitoring independently.
- Obtain explicit founder approval for merge, deployment, production migrations, provider activation and any live-money operation.
- Verify post-release health and audit evidence.

**Exit:** only the specifically approved product/scope is released. One institution's approval does not authorize another's release.

## 7. Cross-institution dependency map

- Group public website → public institutional directory and verified public content only.
- Institutional Link / HQ → group coordination, board, workforce, compliance oversight and shared-service directory; no implicit access to private customer or ledger data.
- Vantoris Base → scoped shared infrastructure and service contracts; must be identified and independently verified before integrations.
- VPI → independent institution; its source/repository/runtime boundary must be established.
- X Money → this repository's independent product, database, identity, ledger, payment lifecycle and release.
- AVCU → separate credit union; its migrations and payment workflows remain AVCU-owned.
- Ashcombe → separate private bank, Germany-first; its accounts, customer records and banking authority remain in its repository.
- T Market → blocked pending original approved business model.
- Oracle Control and Oracle Investment Platform → adjacent independent systems, not Base and not substitutes for institutional ledgers.

## 8. Readiness must be reported in separate dimensions

For every institution and every capability, report four distinct states:
1. **Built:** source and required application lifecycle exist.
2. **Operational:** deployed/configured services, owners, monitoring and recovery are verified.
3. **Legally authorised:** applicable permissions, contracts and approvals are evidenced.
4. **Commercially launched:** founder-approved release and actual customer/service launch are evidenced.

Never infer one state from another. A route, mock, source file, passing build or CI workflow does not establish operational, legal or commercial readiness.

## 9. Mandatory evidence and reporting format

Every engineering run must report:
- Repository, branch, exact base/head SHA and working-tree evidence.
- Open PRs with exact head/base SHAs, draft/merge state, dependency graph and changed files.
- Open issues and tracker changes.
- Exact workflow/run/job IDs and whether a runner actually executed steps.
- Checks executed, exact commands, outcomes and logs.
- Files changed and why; no unreported side effects.
- Current / Planned / Concept / Found-not-fixed classification.
- Built / Operational / Legally authorised / Commercially launched classification.
- Security, data and cross-institution isolation evidence.
- Blockers, deferrals, reason and next dependency.
- Merge/deployment/production/live-money state.

If GitHub Actions accepts a run but allocates no runner, produces runner ID 0, empty steps or inaccessible logs, classify it as **infrastructure/runner unavailable**, not an application test pass or failure. Inspect service status, repository Actions settings, permissions, billing and support escalation paths without changing security settings blindly.

## 10. Explicit exclusions and controls

- No institution consolidation or shared financial authority.
- No Base44 dependency in the final X Money architecture, but no premature removal before source/feature recovery.
- No mandatory Xapo or other provider API.
- No invented credentials, accounts, balances, transaction histories, providers, bank connectivity, acceptance, settlement, legal permission or operational status.
- No client-side role/ID authority; no unrestricted AI access to private, financial or administrative data.
- No unlicensed regulated finance, real-money wagering or unauthorized money movement.
- No production data mutation, migration, provider activation, merge, deployment, bank submission or live-money operation without explicit founder approval.
- Preserve every existing approved capability and record; document deferrals rather than silently removing them.

## 11. Immediate next dependency

The immediate next task in this repository is **complete X Money source provenance and recovery**, not a VPI merge or a generic platform rewrite.

1. Reconcile PR #2, PR #3 and PR #4 as separate product/source branches.
2. Finish the path-level X Money/VPI/AVCU/shared/unresolved manifest.
3. Recover missing approved X Money source capabilities from the original upstream with semantic review.
4. Establish the executable X Money checkout and exact-head baseline.
5. Then implement the independent PostgreSQL/auth/ledger foundation and the approved X Money product lifecycle.

The wider portfolio remains visible in this plan, but every institution is implemented, tested, operated and released under its own authority.
