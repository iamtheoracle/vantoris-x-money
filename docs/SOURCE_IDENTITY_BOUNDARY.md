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
