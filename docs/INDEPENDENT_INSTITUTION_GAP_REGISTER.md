# Vantoris Independent Institution — implementation gap register

**Branch:** `migration/remove-base44-and-codex`  
**Status:** active replacement work; not release evidence.  
**Authority:** Vantoris-owned PostgreSQL and the institution's own decisions are authoritative. External networks and assistant services are not dependencies for member accounts, internal journals, balances, statements, or member-to-member transfers.

## Non-negotiable boundaries

- Preserve existing member identities, account relationships, posted journals, transaction history, documents, and audit evidence. No reset, reseed-over-live-data, or silent financial rewrite.
- Never edit migrations 001–005 after they have been applied to an institutional database. Corrections must be forward-only migrations with explicit preconditions and rollback/recovery notes.
- No production database operation is authorized by this repository task. Production migration state and data reconciliation must be verified through Vantoris's database administration evidence.
- The application must fail closed when the institutional database, migration state, session, or authorization check is unavailable.
- No provider, Base44, Plaid, sponsor bank, card network, or assistant call may be required for internal ledger operation.
- Outbound wires remain unavailable until a real Fedwire origination capability in Vantoris's own name is independently evidenced. Approval is not sending; a timeout is not proof of non-acceptance.

## Verified repository contradictions

1. `migrations/001_avcu_payment_control_plane.sql` through `005_avcu_payment_outbox_claims.sql` currently define schema `vantoris_ledger`, not `avcu_payments`. They create the runtime role/grants for `vantoris_backend`, while the agreed deployment contract names `avcu_backend`. Do not paper over this with a second ledger schema or assume role equivalence.
2. `netlify/functions/member-auth.mjs` connects with `VANTORIS_LEDGER_DATABASE_URL` and queries `vantoris_ledger.member_credentials`, `member_mfa_factors`, session/login-control tables and functions. Those objects are not defined by migrations 001–005 as currently checked in. This makes the checked-in authentication implementation incompatible with the five-file schema until forward migrations supply and test the missing objects.
3. `base44/functions/_shared/paymentStore.ts` remains under the Base44 tree, connects through `VANTAGE_LEDGER_DATABASE_URL`, and contains provider-event, Plaid, Base44 projection/outbox, bank-receipt and bank-rail workflows against `avcu_payments`. It is not a valid Vantoris ledger service and must not be used by the application.
4. Member-facing pages still import `@base44/sdk` and call Base44 authentication/entities. Examples confirmed: `src/pages/Apply.jsx`, `src/pages/Profile.jsx`, and `src/components/MemberRoute.jsx`. Removing the SDK before replacing these calls would break existing member access.
5. `.github/workflows/recovery-build.yml` still type-checks and tests Base44 function paths, including Plaid and external bank workflows. CI therefore still treats removed architecture as part of the active application.
6. The current five migrations do not establish the complete authentication/session schema used by the current Netlify member-auth function, nor do they by themselves prove that they were applied to the production database. The repository cannot attest to live migration state.

## Required implementation sequence

### A. Establish one database contract

- Select the canonical schema and role contract without creating parallel ledgers. The founder-approved deployment name is `avcu_backend`; reconcile this with the already-applied migration grants through a DBA-reviewed forward migration/provisioning step.
- Add a migration registry and a single startup migration/verification process. It must verify checksums and ordered application, refuse startup on missing or changed migrations, and run under a migration identity separate from the runtime role.
- Runtime connections must use only `avcu_backend`; secrets must never enter `VITE_*` variables or browser bundles.
- Provide a disposable PostgreSQL test database and run the same ordered migrations there. A missing test database is a failed verification, not a skipped pass.

### B. Complete Vantoris identity and account lifecycle

- Add forward migrations for Vantoris-owned member/staff credentials, password verification, MFA factors, sessions, CSRF binding, login throttling, staff capabilities, account applications, and audit linkage.
- Preserve and reconcile existing member IDs and credentials from verified source records. Do not infer that an account exists from a UI profile.
- Account creation is server/staff controlled and creates one zero-balance member liability account. Capital, clearing, and suspense accounts are provisioned by a controlled institutional seed process, never by member requests.
- Identity review is an institutional decision. Store documents under Vantoris control; no external KYC decision flag is authoritative.

### C. Make the ledger the only posting path

- Replace the legacy payment store with a Vantoris-owned server module that uses the canonical schema and runtime role.
- Expose a single authenticated transfer endpoint that derives the member identity from the server session, validates both member accounts, enforces idempotency, and invokes the database's atomic transfer function.
- Ensure every journal writer is reachable only through controlled posting/reversal functions. No page, import, staff form, or generic entity API may write journal rows.
- Implement ledger-derived balance and statement reads with account ownership checks. Missing data remains null/blank; query failure is an error, never zero.
- Implement proposal/approval flows with distinct staff identities enforced in server/database logic. Staff never type balances.

### D. Remove the old platform and provider paths

- Rewire Apply, Profile, MemberRoute, Home, Accounts, Account Detail, Move Money, Transactions, and Operations to Vantoris APIs while preserving existing member-visible information where source evidence supports it.
- Remove Base44 auth/entity/function/storage dependencies only after replacements are covered by tests. Remove Base44 directories, SDK/configuration, and obsolete environment variables after confirming no active callers remain.
- Remove Plaid, bank webhook/sync, sponsor-bank, ACH/Fedwire adapter, card processor, and external settlement workflows from the internal-money path. Do not leave dormant code reachable from routes or CI.
- Keep cards, investments, wires, Zelle, and external bank funding hidden or explicitly unavailable until separately authorized and genuinely implemented.

### E. Prove the acceptance tests

- Clean disposable PostgreSQL database: ordered migrations, checksums, seed idempotency, startup refusal when a migration is missing.
- Balanced-journal constraint, immutable journal/entries/audit, idempotent post, conflicting idempotency payload rejection, reversal as a new opposite journal.
- Duplicate internal transfer, concurrent double-spend, hold release on failure, and transfer retry without duplicate posting.
- Member session cannot read another member's accounts/statements or invoke staff/posting operations.
- Distinct staff proposer/approver required for manual journal, reversal, and limit change.
- App authentication, balance reads, statements, and internal transfers work with outbound network access blocked.
- Build, lint, typecheck, browser flows, and real PostgreSQL integration tests all run and report actual outcomes.

### F. Separate first payment from external wire

- First payment acceptance requires Vantoris-controlled evidence that funds are in Vantoris's possession, a recording staff member, a different posting staff member, a balanced reserve-to-member journal, idempotency, and an audit event. No screenshot or approval click creates funds.
- A wire request creates a request and exact-amount hold only. A second staff member approves it. Until a Fedwire origination service and Vantoris-owned sending account are evidenced, the terminal state is **approved, not sent**.
- If a future Fedwire send times out, do not release/retry blindly. Resolve whether the message was accepted before changing the hold or initiating another send. A real Fed reference must be stored before any sent state is shown.

## Evidence still required

- DBA evidence that migrations 001–005 are applied, including the database identity, schema objects, migration checksums, and role grants. The repository does not have access to prove this.
- Verified inventory and reconciliation of existing member, account, journal, and audit records before any data migration.
- Confirmation of the database runtime role actually provisioned and its effective privileges.
- Actual isolated PostgreSQL test results; previous CI definitions do not constitute a successful run.
- Proof of any Vantoris-owned reserve account and funds before the first-payment posting path is enabled.
- Separate legal, operational, and technical evidence for any future Fedwire capability. Until then, outgoing wires remain off.

## Current state

- Codex GitHub Actions workflow: removed on this migration branch.
- Base44: **not removed**; SDK and active page callers remain.
- Canonical independent member authentication: **incomplete**; current function expects schema objects absent from migrations 001–005.
- Canonical transfer API: **not verified as wired to the member UI**.
- Live PostgreSQL migration state and existing-member reconciliation: **unverified**.
- External wire origination: **not implemented/authorized**.
- Production database, merge, and deployment: **not changed**.
