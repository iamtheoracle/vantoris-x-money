# Product identity and source boundary audit

**Branch inspected:** `migration/remove-base44-and-codex`  
**Repository containing this branch:** `iamtheoracle/vantoris-x-money`  
**Audit purpose:** preserve product identity and prevent accidental source, database or financial-authority crossover between Vantoris Private Institution (VPI), Vantoris X Money and AVCU.

## Evidence observed

### Vantoris Private Institution source on this branch

- The branch `package.json` declares the package name `vantoris-private-institution`.
- The branch README names the product Vantoris Private Institution.
- The README describes a Vantoris-owned PostgreSQL database and `vantoris_ledger` schema.
- The README describes separate member and staff authentication, server-side capability checks, independent approval and immutable journals.
- The README describes internal Vantoris-to-Vantoris ledger operations and explicitly states that no sponsor bank, Plaid, ACH, Fedwire, card processor, Base44 or assistant participates in that internal posting path.
- The README states that this implementation has not been merged to `main` or deployed.
- The README lists substantial remaining work, including member-data import/reconciliation, production migration baseline, staff provisioning and role management, identity-document key/retention controls, account opening, messaging, service cases, browser QA, backup/restore proof and production release approval.

### Related recovered branch

The `work/private-institution-programme` route preservation register records:
- 6 public/authentication routes.
- 35 member routes.
- 62 operations routes.
- 18 Base44 entity schemas.
- 11 server-function entry points.
- 5 SQL migration files.
- 5 test files.

The same register identifies those five migrations as AVCU-labelled:
`001_avcu_payment_control_plane.sql`, `002_avcu_backend_grants.sql`, `003_avcu_outgoing_funds_holds.sql`, `004_avcu_payment_audit_hardening.sql`, and `005_avcu_payment_outbox_claims.sql`.

This naming/provenance conflict is unresolved. Do not assume the migrations belong to VPI merely because they are present on a VPI-labelled branch. Do not apply, rename, transplant or reuse them until ownership, schema semantics and migration history are independently established.

### Vantoris X Money main

The `main` README identifies this repository as Vantoris X Money and states that its full application tree is missing. The recovered VPI branch therefore does not establish a complete X Money implementation.

## Required product boundary

| Product | Current source evidence | Boundary rule |
|---|---|---|
| Vantoris Private Institution | Recovered implementation on branches inside the X Money repository; package and README identify VPI | Treat as VPI source, but do not claim independent repository ownership, merge or deployment. |
| Vantoris X Money | Main branch README identifies X Money; full application tree reported missing | Recover an X Money-specific source tree and manifest. Do not fill gaps with VPI code. |
| AVCU | Separate credit-union product and separate repository history | No AVCU identity, member records, ledger authority, migrations or branding may be imported into VPI or X Money without explicit approval and provenance proof. |

## Required reconciliation before source movement

1. Preserve all existing branches, commits and route inventories.
2. Produce separate file-level manifests for VPI and X Money covering routes, components, entities, functions, migrations, tests, assets, environment variables and integrations.
3. Establish the authoritative VPI repository/application and release owner.
4. Recover the complete X Money source from its own provenance; identify the exact source commit and missing files.
5. Trace the origin and intended database/schema of every AVCU-labelled migration. Verify checksums, dependencies, data assumptions and target ownership before use.
6. Establish independent PostgreSQL databases, identity domains, server-side authorization, audit trails, backups and release pipelines.
7. Add cross-product negative tests proving that VPI credentials and identifiers cannot access X Money or AVCU resources, and vice versa.
8. Run each product's migrations from an empty disposable PostgreSQL database and prove transaction, concurrency, idempotency and recovery behaviour.
9. Do not merge, deploy, migrate live data or enable external financial rails as part of source reconciliation.

## Status

- **Source evidence recorded:** yes, on this branch.
- **VPI product identity in this branch:** source-declared as Vantoris Private Institution.
- **Independent VPI repository/application:** not yet verified.
- **X Money complete source tree:** not established.
- **AVCU migration provenance:** unresolved.
- **Production migration or data movement:** not performed.
- **Merge/deployment:** not performed.

This document is an evidence and preservation record. It does not authorise product consolidation or imply that any financial or institutional service is operational.


## Expanded source inventory and current CI evidence (15 November 2026)

### Recovered branch inventory

At the inspected branch commit, the Git tree contains 480 tracked tree entries, including:

- `src/`: 328 entries covering the application router, shared UI, member workspace, operations workspace, identity context, assistant client, page components and styles.
- `base44/`: 62 entries, including 18 legacy entity schemas, 11 server-function entry points, shared payment code and the older Guardian/Nexus/Oracle/Orbit/Spark runtime files.
- `migrations/`: 25 SQL files: bootstrap `000` and ordered versions `001`–`024`.
- `netlify/functions/`: 9 function files for member/staff authentication, documents, staff actions, migration guard, Oracle assistant, market and compatibility ask routes.
- `tests/`: 12 entries, including member-authentication, migration runner/guard, financial formatting, operational truthfulness, migration contracts and disposable PostgreSQL integration/concurrency tests.

This is a substantial recovered VPI application source tree. It is not proof of an independent VPI repository, production source continuity or deployment.

### Base44 source distinction

The `base44/` directory is legacy application source retained in this branch. The branch README and package configuration describe the active VPI app as using first-party Netlify functions and a Vantoris-owned PostgreSQL ledger, with no Base44 SDK/Vite plugin in the active application configuration. The legacy files are not the Vantoris Base infrastructure described in the group architecture plan. They must be inventoried and safely archived or retired only after route/function/entity parity and historical-data continuity are proven.

### Migration filename clarification

The first five migration filenames retain the `avcu` label, but direct inspection of their SQL bodies shows Vantoris-specific schema and comments, including the `vantoris_ledger` schema, Vantoris-owned members/accounts/journals, `vantoris_backend` grants and internal-transfer functions. The migration contract tests explicitly assert Vantoris table/function names.

The PostgreSQL CI workflow creates:
- `vantoris_backend` as a restricted NOLOGIN role; and
- `avcu_backend` as a CI runtime login that inherits `vantoris_backend` grants.

The workflow then verifies the inherited least-privilege grants. Therefore the `avcu_backend` CI login and legacy filenames are naming artifacts in this recovered branch; they are not, by themselves, proof that AVCU production data or an AVCU ledger is being used. However, repository history and original migration provenance have not yet been independently established. Preserve the filenames and checksums; do not rename or rewrite already-recorded migrations. Record provenance as unresolved until the source history is traced.

### Current branch CI — exact head commit

The documentation commit `b62b2b53d9b2f83242c66ba7f19a46ea2390c447` triggered two successful workflows:

- [Vantoris institutional ledger PostgreSQL — run 43669234464](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43669234464): passed on PostgreSQL 16. Verified ordered migrations and SHA-256 history, restricted runtime-role inheritance, ledger integration SQL, seeded concurrent-transfer race and forced rollback, member-auth cryptography and migration contract tests.
- [Recovery build check — run 43669234441](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43669234441): passed. Verified syntax, migration runner/manifest, Oracle runtime checks, assistant and browser-side mutation guards, entity/security checks, Deno test suites, ESLint, TypeScript typecheck and Vite production build.

These results apply to the recovered VPI branch commit only. They do not prove that VPI is independently hosted, merged, deployed, connected to production member data, or ready for live banking. The PostgreSQL database was disposable CI infrastructure; no production database was migrated.

## Updated status

- Recovered VPI application source tree: inspected and inventoried.
- VPI package/README identity: source-declared and consistent on this branch.
- VPI PostgreSQL migration/test pipeline: CI-verified on the exact branch commit above.
- VPI build/lint/typecheck: CI-verified on the exact branch commit above.
- Legacy Base44 source archive/parity: outstanding.
- Independent VPI repository/application ownership: outstanding.
- AVCU migration original provenance: outstanding; current SQL content is Vantoris-labelled, filenames retain AVCU labels.
- X Money-specific complete source tree: still not established on `main`.
- Production database, customer-data continuity, backup/restore, browser QA and deployment: not verified.


## Mandatory Vantoris Base integration dependency

Vantoris Base is a required shared-infrastructure workstream for completion of the wider Vantoris ecosystem. It is distinct from the legacy `base44/` directory inventoried above and from the Base44 vendor platform.

VPI retains its own member/staff identity authority, PostgreSQL database, `vantoris_ledger`, posted balances, holds, journals, approvals, audit and operational authority. Base may provide only explicitly authorised shared services through versioned APIs/events and least-privilege service identities. It must not receive unrestricted ledger access, become the financial system of record, or make Group HQ a VPI operator.

VPI must continue to fail closed and preserve local authoritative records during a Base outage. Any future Base integration requires server-side actor/resource/action authorization, signed and replay-protected events, audit correlation, failure/retry contracts and cross-institution negative tests.

The group master tracker records Base as a required ecosystem completion gate: https://github.com/iamtheoracle/vantoriss/blob/feat/vantoris-institutional-world/docs/MASTER_COMPLETION_TRACKER.md

Current blocker: the authoritative Vantoris Base repository/runtime has not been identified, and Institutional Link sandbox access remains unavailable pending restored Base44 workspace integration credits. This does not block safe VPI source recovery, migration verification or independent product engineering, but VPI cannot be declared fully integrated into the Vantoris ecosystem until the Base contract is implemented and verified.
