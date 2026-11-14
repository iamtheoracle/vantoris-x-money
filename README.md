# Vantoris Private Institution

Vantoris is the institution. This repository contains its member-facing application and restricted staff workspace. The application is not the institution's source of truth.

## Institutional authority

- Vantoris administers its own PostgreSQL database and the `vantoris_ledger` schema.
- Vantoris journals are the only source of member posted balances and holds.
- Member balances are liabilities of Vantoris; permanent institutional capital is separately recorded and protected.
- Internal member transfers are Vantoris-to-Vantoris ledger operations. No sponsor bank, Plaid, ACH, Fedwire, card processor, Base44 or assistant is in that path.
- Staff authentication is separate from member authentication. Financial changes use server-side capability checks, independent approval and immutable journals.
- The assistant is optional and isolated. It has no ledger posting permissions.

## Current migration branch

Work is taking place on `migration/remove-base44-and-codex`. `main` and production have not been changed.

Implemented in this branch:
- First-party member sign-in, activation, password recovery, mandatory TOTP MFA and replay prevention.
- First-party staff sign-in, MFA session validation, capability resolution and a restricted staff workspace.
- PostgreSQL-backed member account/activity/statement APIs and internal transfer posting.
- Dual-approved manual journals, reversals, transfer limits and permanent capital floor proposals.
- No Base44 Vite plugin, Base44 SDK dependency, Stripe SDK dependency, Base44 API proxy or Codex GitHub Actions workflow in the active application configuration.

Not yet complete:
- Existing member/account/transaction import and reconciliation; no member data has been migrated.
- Application of migrations 001–019 to a Vantoris-administered database; no live database has been changed.
- Staff account/MFA provisioning and staff role-management workflow.
- Identity-document encryption key provisioning, retention/rotation procedures and live database/browser verification; member account opening, messaging and service-case workflows.
- Replacement or archival of all remaining legacy Base44 function and page source files.
- Disposable PostgreSQL integration execution, concurrency testing, browser QA, backup/restore proof and external-network-blocked acceptance testing.
- Production deployment and release approval.

The member/staff UI intentionally shows unavailable states where the Vantoris-owned workflow is not ready. It must not fabricate accounts, balances, identity decisions, messages, cards, investment holdings, orders or provider statuses.

## PostgreSQL setup

Use a new disposable PostgreSQL database for tests. Create the restricted runtime role before migration 002 and apply migrations 001–019 in numeric order. Follow [the institutional ledger runbook](docs/VANTORIS-INSTITUTIONAL-LEDGER.md).

Required server-side secrets:
- `VANTORIS_LEDGER_DATABASE_URL`
- `VANTORIS_MFA_ENCRYPTION_KEY` (32 random bytes, base64 encoded)
- `VANTORIS_MFA_KEY_VERSION`
- `VANTORIS_DOCUMENT_ENCRYPTION_KEY_V1` (32 random bytes, base64 encoded)
- `VANTORIS_DOCUMENT_KEY_VERSION`

Never use a `VITE_` prefix for credentials. Never point integration tests at production.

## Validation and release

The repository contains a PostgreSQL integration script, migration contract tests and syntax/authentication tests. A workflow file exists, but no successful run has been verified for this branch yet. Do not claim tests pass until the run output is observed.

Do not merge or deploy without explicit authorization. Do not import or replace existing member records until a source export, stable identity crosswalk, financial reconciliation, permissions mapping and rollback plan have been verified.
