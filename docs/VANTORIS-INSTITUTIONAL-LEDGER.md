# Vantoris institutional ledger — migration and verification runbook

## Authority and boundaries

Vantoris administers this PostgreSQL database. The `vantoris_ledger` schema is the institutional record for member liabilities, institutional capital, internal clearing, journals, holds and audit. A browser, Base44, a sponsor bank, Plaid, ACH, Fedwire, a card network or an assistant is not in the posting path.

The current migration set is a replacement foundation. It does **not** import existing members, create accounts, establish permanent capital, or invent opening balances. Do not point the application at it until member-data reconciliation and the server-side authentication/authorization service are complete.

## Migration state

The seven files are ordered and must be applied once, in order, to an empty Vantoris-administered PostgreSQL database:

1. `migrations/001_avcu_payment_control_plane.sql` — Vantoris ledger schema, member/account registry, immutable journals and entries, operations, holds, audit and staff approval records.
2. `migrations/002_avcu_backend_grants.sql` — least-privilege runtime grants. Requires the runtime role to exist.
3. `migrations/003_avcu_outgoing_funds_holds.sql` — one atomic internal-transfer function. It locks both accounts in deterministic order, verifies active membership and source ownership, checks available funds, creates and captures a hold, posts a balanced journal, updates the operation and appends audit in the same database transaction.
4. `migrations/004_avcu_payment_audit_hardening.sql` — blocks UPDATE, DELETE and TRUNCATE on audit events.
5. `migrations/005_avcu_payment_outbox_claims.sql` — explicitly retires the external projection/outbox design.
6. `migrations/006_vantoris_identity_and_sessions.sql` — Vantoris member/staff identities, credential records, session hashes, MFA factor storage, encrypted identity documents and legacy identity crosswalks.
7. `migrations/007_vantoris_session_rls.sql` — session issue/revoke functions and PostgreSQL row-level security for member and staff reads.

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

- Existing member, account, permission and historical transaction migration with source-to-target reconciliation and rollback. The legacy crosswalk table exists, but no live member export has been imported.
- Verified permanent-capital account and documented opening journal evidence.
- A secure API that derives member identity from `resolve_member_session` and the verified session cookie. The current transfer function still accepts a server-supplied member UUID; the API must derive it from the session, never from the request body. A token-bound database wrapper should replace that transitional signature before member transfers are enabled.
- Full two-person approval enforcement and posting functions for reversals, limit changes and manual journals. The proposal/approval tables prevent self-approval, but staff capability authorization and execution workflows remain to be implemented.
- Vantoris-owned identity-document storage, identity review, sign-in, MFA, session revocation, statements, account-scoped read APIs and staff directory/authorization.
- Disposable PostgreSQL integration tests and RLS checks are being added to CI; multi-session concurrency tests, backups and restore verification remain release blockers.
- Replacement of remaining Base44 auth/entity/function dependencies in the application.

Do not enable member transfers or claim institutional production readiness until these blockers are closed with evidence. No external payment rail is enabled by this migration.
