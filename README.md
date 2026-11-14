# Vantoris Private Institution

Vantoris is the institution. This repository contains its member-facing application and restricted staff workspace. The application is not the institution's source of truth.

## Institutional authority

- Vantoris administers its own PostgreSQL database and the `vantoris_ledger` schema.
- Vantoris journals are the only source of member posted balances and holds.
- Member balances are liabilities of Vantoris; permanent institutional capital is separately recorded and protected.
- Internal member transfers are Vantoris-to-Vantoris ledger operations. No sponsor bank, Plaid, ACH, Fedwire, card processor, Base44 or assistant is in that path.
- Staff authentication is separate from member authentication. Financial changes use server-side capability checks, independent approval and immutable journals.
- Vantoris Intelligence is optional and informational only. Its first-party endpoint requires a member session, CSRF validation and database-backed request limits; it receives no account or staff records and has no financial or elevated permissions.

## Current migration branch

Work is taking place on `migration/remove-base44-and-codex`. `main` and production have not been changed.

Implemented in this branch:
- First-party member sign-in, activation, password recovery, mandatory TOTP MFA and replay prevention.
- First-party staff sign-in, MFA session validation, capability resolution and a restricted staff workspace.
- PostgreSQL-backed member account/activity/statement APIs and internal transfer posting. The member UI selects only active-member USD liability accounts; the server remains authoritative for limits and posting.
- Dual-approved manual journals, reversals, transfer limits and permanent capital floor proposals.
- No Base44 Vite plugin, Base44 SDK dependency, Stripe SDK dependency, Base44 API proxy or Codex GitHub Actions workflow in the active application configuration.
- A first-party `/api/oracle` informational assistant endpoint, member-session/CSRF checks, database-backed minute/day limits and browser-session-only chat history. It calls only a configured Vantoris private OpenAI-compatible model endpoint; no provider configuration has been verified.

Not yet complete:
- Existing member/account/transaction import and reconciliation; no member data has been migrated.
- Application of migrations 001–023 to a Vantoris-administered database; disposable CI has passed the full 001–023 sequence and integration suite. No live database has been changed.
- Staff account/MFA provisioning and staff role-management workflow.
- Identity-document encryption key provisioning, retention/rotation procedures and live database/browser verification; member account opening, messaging and service-case workflows.
- Replacement or archival of all remaining legacy Base44 function and page source files.
- Multi-session transfer concurrency and forced-rollback tests, browser QA, backup/restore proof and external-network-blocked acceptance testing.
- Assistant model configuration and durable cross-device conversation history; current chat history is held only in the browser session.
- Production deployment and release approval.

The member/staff UI intentionally shows unavailable states where the Vantoris-owned workflow is not ready. It must not fabricate accounts, balances, identity decisions, messages, cards, investment holdings, orders or provider statuses.

### Existing feature availability — not changed in this implementation batch

- The Home action guard currently keeps Deposit, Request and QR actions unavailable; the Send action remains the internal member-to-member transfer path.
- The current ledger schema is USD-only. Migration 023 derives journal currency from its ledger accounts but does not enable EUR or multi-currency banking.
- The Member QR page states that payment QR is not enabled and links to internal transfers.
- Card information and investment holdings remain unavailable until genuine issuance/verified asset records exist.
- Staff withdrawal decisions remain unavailable; no replacement balance or manual client-side posting was added.
- ACH, Fedwire, card-network and other external money rails remain unconfigured/unavailable.
- The /operations/* route remains behind the staff gate but resolves to the shared StaffPortal; distinct legacy operations screens are still incomplete.
- WhatsApp support remains available when VITE_BUSINESS_WHATSAPP_NUMBER is configured. The legacy Base44 AppConfiguration lookup has been replaced with Vantoris deployment configuration; no number is invented when unset.

## PostgreSQL setup

Use a new disposable PostgreSQL database for tests. Create the restricted runtime role before migration 002 and apply migrations 001–023 in numeric order. Follow [the institutional ledger runbook](docs/VANTORIS-INSTITUTIONAL-LEDGER.md).

Required server-side secrets:
- `VANTORIS_LEDGER_DATABASE_URL`
- `VANTORIS_MFA_ENCRYPTION_KEY` (32 random bytes, base64 encoded)
- `VANTORIS_MFA_KEY_VERSION`
- `VANTORIS_DOCUMENT_ENCRYPTION_KEY_V1` (32 random bytes, base64 encoded)
- `VANTORIS_DOCUMENT_KEY_VERSION`
- Optional Vantoris Intelligence: `VANTORIS_PRIVATE_LLM_URL`, `VANTORIS_PRIVATE_LLM_MODEL`, `VANTORIS_PRIVATE_LLM_KEY` (server-side only; no external-provider fallback; if unset, the assistant reports unavailable)

Never use a `VITE_` prefix for credentials. Never point integration tests at production.

## Validation and release

Latest verified CI on the migration branch:
- PostgreSQL run 43618747104: passed migrations 001–023, restricted runtime-role verification, disposable ledger integration (including assistant limits, manual-journal currency derivation, idempotent retry, reversal currency preservation and the current USD-only account constraint), member/staff syntax checks, MFA cryptography tests and migration contract tests.
- Recovery build run 43618747097: passed Oracle/runtime tests, assistant security-boundary checks, browser financial-mutation checks, internal-transfer truthfulness checks, entity/security rules, lint, typecheck and production Vite build.
These are CI/disposable-environment results only. No institutional database, production deployment, merge or external money rail was changed.

Do not merge or deploy without explicit authorization. Do not import or replace existing member records until a source export, stable identity crosswalk, financial reconciliation, permissions mapping and rollback plan have been verified.
