# Vantoris institutional ledger — migration and verification runbook

## Authority and boundaries

Vantoris administers this PostgreSQL database. The `vantoris_ledger` schema is the institutional record for member liabilities, institutional capital, internal clearing, journals, holds and audit. A browser, Base44, a sponsor bank, Plaid, ACH, Fedwire, a card network or an assistant is not in the posting path.

The current migration set is a replacement foundation. It does **not** import existing members, create accounts, establish permanent capital, or invent opening balances. Do not point the application at it until member-data reconciliation and the server-side authentication/authorization service are complete.

## Migration state

The fifteen files are ordered and must be applied once, in order, to an empty Vantoris-administered PostgreSQL database:

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

These migrations have **not been verified as applied** to any live Vantoris database. A file in Git is not an applied migration. Record the actual database name, server identity, migration owner, execution timestamp and checksums in the institution's controlled change record after a successful application.

## Roles and connection separation

Use a dedicated empty disposable database for integration testing. Never use the production URL for tests.

A DBA creates a server-only runtime role before migration 002. The role must be a LOGIN role with a strong generated password, and must not be a superuser or have database/role creation privileges:

```sql
CREATE ROLE vantoris_backend
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
  PASSWORD '<generated-secret>';
```

The migration owner is separate and retains schema ownership. The runtime credential is stored only in a server-side secret named `VANTORIS_LEDGER_DATABASE_URL`; never use a `VITE_` variable, browser storage or a client bundle. Members never receive this credential.

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
- **Identity review:** the schema stores encrypted document evidence and Vantoris review records, but document upload, secure retrieval, review decisions, retention and member-facing status APIs are not complete.
- **Financial approvals:** PostgreSQL now enforces proposer/approver separation and provides approved posting functions for manual journals, reversals and member limit changes. These workflows have not been applied or verified against the institution's database. Staff UI and integration coverage are still incomplete for edge cases.
- **Limits:** no real member transfer limits have been supplied. Transfers intentionally fail closed until an authorized Vantoris process establishes each member's limits.
- **Statements and operations:** member statements and scoped account/activity APIs have been added, but complete statement reconciliation, pagination, audit review screens and operations reporting remain incomplete.
- **Testing and resilience:** a disposable PostgreSQL integration script and CI workflow cover synthetic ledger, capital, transfer, limit, staff, activation and RLS cases. No CI run has been observed for this migration branch; multi-session concurrency tests, backup scheduling, restore verification and incident recovery remain release blockers.
- **Base44 removal:** Base44 has not been fully removed. The member-critical paths have first-party replacements, but other member/admin pages, `@base44/sdk`, legacy functions and Oracle assistant/runtime paths still require inventory and replacement. The Codex workflow file is deleted from this branch; no production or main-branch change has been made.


Do not enable member transfers or claim institutional production readiness until these blockers are closed with evidence. No external payment rail is enabled by this migration.
