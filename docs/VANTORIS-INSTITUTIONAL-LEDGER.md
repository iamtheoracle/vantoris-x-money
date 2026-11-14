# Vantoris institutional ledger — migration and verification runbook

## Authority and boundaries

Vantoris administers this PostgreSQL database. The `vantoris_ledger` schema is the institutional record for member liabilities, institutional capital, internal clearing, journals, holds and audit. A browser, Base44, a sponsor bank, Plaid, ACH, Fedwire, a card network or an assistant is not in the posting path.

The current migration set is a replacement foundation. It does **not** import existing members, create accounts, establish permanent capital, or invent opening balances. Do not point the application at it until migrations are applied to a Vantoris-administered database, member-data reconciliation is complete, staff/MFA credentials are provisioned, and the offline integration and browser tests pass.

## Migration state

The twenty-three files are ordered and must be applied once, in order, to an empty Vantoris-administered PostgreSQL database:

1. `migrations/001_avcu_payment_control_plane.sql` — Vantoris ledger schema, member/account registry, immutable journals and entries, operations, holds, audit and staff approval records.
2. `migrations/002_avcu_backend_grants.sql` — least-privilege runtime grants. Requires the runtime role to exist.
3. `migrations/003_avcu_outgoing_funds_holds.sql` — one atomic internal-transfer function. It locks both accounts in deterministic order, verifies active membership and source ownership, checks available funds, creates and captures a hold, posts a balanced journal, updates the operation and appends audit in the same database transaction.
4. `migrations/004_avcu_payment_audit_hardening.sql` — blocks UPDATE, DELETE and TRUNCATE on audit events.
5. `migrations/005_avcu_payment_outbox_claims.sql` — explicitly retires the external projection/outbox design.
6. `migrations/006_vantoris_identity_and_sessions.sql` — Vantoris member/staff identities, credential records, session hashes, MFA factor storage, encrypted identity documents and legacy identity crosswalks.
7. `migrations/007_vantoris_session_rls.sql` — session issue/revoke functions and PostgreSQL row-level security for member and staff reads.
8. `migrations/008_vantoris_auth_rate_limits.sql` — database-backed login throttling, session-bound CSRF verification and audited member statement access.
9. `migrations/009_vantoris_staff_controls.sql` — Vantoris staff roles/capabilities, MFA-gated proposal/approval functions and independent two-person approval constraints.
10. `migrations/010_vantoris_permanent_capital_protection.sql` — append-only, dual-approved permanent-capital floor; blocks member-liability account creation before capital is funded and rejects journals that impair it.
11. `migrations/011_vantoris_approved_journal_posting.sql` — posts approved manual journals and reversals through immutable, balanced journal entries; no balance-edit operation exists.
12. `migrations/012_vantoris_member_transfer_limits.sql` — append-only, dual-approved member limits; single and UTC-day totals are enforced under a per-member lock before a transfer is claimed.
13. `migrations/013_vantoris_member_activation_mfa.sql` — staff-issued one-time member activation and password-reset tokens, plus encrypted TOTP enrollment and session creation after successful code verification.
14. `migrations/014_vantoris_staff_profile.sql` — session-bound staff profile/capability resolution and dispatch of approved manual journals, reversals and limit changes.
15. `migrations/015_vantoris_totp_replay_protection.sql` — database-enforced one-use TOTP time-steps for member and staff MFA.
16. `migrations/016_vantoris_capital_floor_workflow.sql` — capital floor proposals, independent approval and server-side posting; the old two-session setter is no longer executable by the application role.
17. `migrations/017_vantoris_mfa_mandatory.sql` — database constraints prevent MFA from being disabled for member or staff credentials.
18. `migrations/018_vantoris_reversal_reason_audit.sql` — requires the staff-supplied reason and records it in the reversal journal and immutable audit event.
19. `migrations/019_vantoris_identity_document_workflow.sql` — encrypted Vantoris document intake/retrieval, immutable evidence and review history, and staff identity decisions.
20. `migrations/020_vantoris_staff_approval_separation.sql` — database trigger rejects an approval row when the approver's Vantoris staff reference equals the proposal's proposer reference.
21. `migrations/021_vantoris_journal_balance_trigger_row_fix.sql` — corrects deferred journal-balance trigger row handling for both journal and journal-entry trigger events.
22. `migrations/022_vantoris_member_assistant_rate_limits.sql` — adds member-scoped minute/day assistant request counters; stores counters only, never prompts or responses, and is not required by core ledger services.
23. `migrations/023_vantoris_manual_journal_currency_integrity.sql` — derives approved manual-journal currency from the locked ledger accounts, rejects mixed currencies and out-of-range cents, and makes a successful posting retry return its original journal.

These migrations have **not been verified as applied** to any live Vantoris database. A file in Git is not an applied migration. Record the actual database name, server identity, migration owner, execution timestamp and checksums in the institution's controlled change record after a successful application.

## Roles and connection separation

Use a dedicated empty disposable database for integration testing. Never use the production URL for tests.

The founder-approved runtime identity is `avcu_backend`. Migration 002 retains the historical privilege-group name `vantoris_backend`; do not treat the names as interchangeable or connect the application as `vantoris_backend`.

For a **new disposable database**, provision a non-login privilege group and a separate login identity before migration 002:

```sql
CREATE ROLE vantoris_backend
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE avcu_backend
  LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
  PASSWORD '<generated-secret>';
GRANT vantoris_backend TO avcu_backend;
```

Migration 002 grants the legacy privilege set to the non-login group. PostgreSQL role membership gives `avcu_backend` those inherited privileges; the application must connect as `avcu_backend`. The CI database must verify that the runtime login inherits the required schema/table/function privileges and cannot write journals or audit rows directly.

For an existing institutional database, do not run these statements blindly. A DBA must inspect existing roles, memberships, active sessions, ownership and effective grants, then provision/cut over `avcu_backend` under a reviewed change and recovery plan. Do not revoke or disable any existing login until dependencies and cutover are verified. No production role change is authorized by this repository task.

The migration owner is separate and retains schema ownership. The `VANTORIS_LEDGER_DATABASE_URL` secret must contain a server-side connection URL authenticated as `avcu_backend`; never use a `VITE_` variable, browser storage or a client bundle. Members never receive this credential.

## Apply and verify

After a clean disposable database is provisioned:

```sh
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_avcu_payment_control_plane.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/002_avcu_backend_grants.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/003_avcu_outgoing_funds_holds.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/004_avcu_payment_audit_hardening.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/005_avcu_payment_outbox_claims.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/006_vantoris_identity_and_sessions.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/007_vantoris_session_rls.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/008_vantoris_auth_rate_limits.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/009_vantoris_staff_controls.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/010_vantoris_permanent_capital_protection.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/011_vantoris_approved_journal_posting.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/012_vantoris_member_transfer_limits.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/013_vantoris_member_activation_mfa.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/014_vantoris_staff_profile.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/015_vantoris_totp_replay_protection.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/016_vantoris_capital_floor_workflow.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/017_vantoris_mfa_mandatory.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/018_vantoris_reversal_reason_audit.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/019_vantoris_identity_document_workflow.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/020_vantoris_staff_approval_separation.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/021_vantoris_journal_balance_trigger_row_fix.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/022_vantoris_member_assistant_rate_limits.sql
psql "$VANTORIS_LEDGER_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/postgres/vantoris-ledger.integration.sql
```

The SQL integration script uses synthetic members and rolls back its fixtures. It must be run as a controlled test/migration owner, not as the runtime role. Run concurrency tests with two independent sessions before treating double-spend prevention as verified. A single-session SQL test cannot prove a concurrent race is safe.

## Ledger semantics

- Positive cents are debits; negative cents are credits.
- Member deposit/liability accounts are credit-normal: posted member balance is `-SUM(journal_entries.amount_cents)`.
- Available balance is posted balance less active holds.
- A $100 opening liability requires a balanced journal: debit the appropriate Vantoris clearing/capital source account +10,000 and credit the member liability account −10,000. The institution must determine the actual source account from its verified books; this example is not an instruction to invent capital.
- A $30 internal transfer debits the sender's liability +3,000 and credits the receiver's liability −3,000.
- No balance column is editable. Corrections are new journals; posted entries are never rewritten.
- The internal-transfer database function is called inside one transaction. The hold, journal, hold capture, operation state and audit either all commit or all roll back.

## Not yet implemented / release blockers

- **Existing-member preservation:** no legacy member export, account export or financial history has been imported. The crosswalk schema exists, but no source-to-target reconciliation, permission mapping, balance proof or rollback has been performed. Do not replace the current member directory or point production at this schema.
- **Capital evidence:** the database now enforces an append-only, dual-approved permanent-capital floor and blocks member-liability account creation until capital is funded. The actual Vantoris capital amount, capital account and opening journal have not been supplied or posted. Do not invent them.
- **Member identity and MFA:** first-party member sign-in, activation, password reset, TOTP enrollment, session cookies, CSRF checks, rate limiting and account-scoped APIs have been added. They have not been exercised against a real PostgreSQL instance or browser test environment.
- **Member account opening:** there is no completed staff workflow to create a new member liability account and its verified opening journal. Existing members must be imported and reconciled before account access is enabled.
- **Staff identity:** separate staff sign-in, MFA session resolution, capability-based RLS, a restricted staff workspace, one-time member activation/recovery token issuance and controlled financial action UI have been added. Staff accounts, MFA factors and role assignments still require controlled provisioning; no staff directory/role-management UI exists.
- **Identity review:** first-party encrypted document intake, member-scoped retrieval, capability-gated staff retrieval, Vantoris review decisions, immutable evidence and append-only review history are implemented in code. The encryption key has not been provisioned, migrations have not been applied, and no live database/browser tests or key-rotation/retention procedure have been verified.
- **Financial approvals:** PostgreSQL now enforces proposer/approver separation and provides approved posting functions for manual journals, reversals and member limit changes. These workflows have not been applied or verified against the institution's database. Staff UI and integration coverage are still incomplete for edge cases.
- **Limits:** no real member transfer limits have been supplied. Transfers intentionally fail closed until an authorized Vantoris process establishes each member's limits.
- **Statements and operations:** member statements and scoped account/activity APIs have been added, but complete statement reconciliation, pagination, audit review screens and operations reporting remain incomplete.
- **Testing and resilience:** PostgreSQL CI run 43618034707 passed ordered migrations 001–022, restricted runtime-role verification, synthetic ledger/capital/transfer/limit/staff/session integration, member/staff syntax, MFA cryptography and migration contract tests. Recovery build 43618034865 passed Deno/runtime/security checks, ESLint, TypeScript and the Vite production build. These are disposable CI results only; multi-session no-overdraft concurrency, forced rollback/hold-release, backup scheduling, restore verification and incident recovery remain release blockers. No institutional database or production deployment was changed.
- **Base44 removal:** active member and staff routes no longer use Base44. The SDK dependency, Vite plugin, client adapter, app-parameter adapter and active assistant runtime have been removed; Netlify has no Base44 API proxy. Legacy Base44 function and unlinked page source files remain in the repository and must be audited, archived or deleted after the existing-member source reconciliation is complete. The Codex workflow file is deleted from this branch; no production or main-branch change has been made.


Do not enable member transfers or claim institutional production readiness until these blockers are closed with evidence. No external payment rail is enabled by this migration.
