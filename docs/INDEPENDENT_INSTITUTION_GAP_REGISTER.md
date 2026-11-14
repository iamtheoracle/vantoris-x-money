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

## Verified repository contradictions — refreshed 2026-11-14

1. **Runtime role contract:** migrations 001–005 grant the historical role `vantoris_backend`, while the founder-approved application login is `avcu_backend`. The runbook and disposable CI provisioning now model `vantoris_backend` as a non-login privilege group and `avcu_backend` as the login member. CI includes a privilege-inheritance check. This is a test-database contract only; production provisioning/cutover still requires DBA review and evidence.
2. **Authentication schema:** the first-party member/staff auth functions use objects introduced across migrations 006–019. The statement that these objects are absent from migrations 001–005 is true only when considering the first five migrations in isolation; it is not an accurate description of the complete 001–024 migration set. The full ordered migration set must pass a clean PostgreSQL run before auth is treated as tested.
3. **Legacy Base44 code:** `base44/functions/_shared/paymentStore.ts` and associated Base44/Plaid/bank-rail functions and entity schemas remain in the repository. They are legacy code, not the authoritative Vantoris ledger service. They must not be reachable from member or staff money workflows and must be removed or archived only after caller and data-preservation checks.
4. **Member route/auth replacement:** current versions of `src/lib/AuthContext.jsx`, `src/pages/Apply.jsx`, `src/pages/Profile.jsx`, and `src/components/MemberRoute.jsx` use Vantoris-owned member-auth endpoints/context; the earlier claim that these exact files still import `@base44/sdk` is stale. A repository-wide audit of every route, hook, component and build-time integration is still required before Base44 can be declared removed.
5. **CI still references legacy architecture:** `.github/workflows/recovery-build.yml` still checks and tests Base44 Oracle/payment functions, Plaid/bank paths, Base44 entity JSON and legacy environment assumptions. It is not yet a clean proof of a Base44-free Vantoris application. Its empty job-level `env:` block was removed to restore workflow execution; the remaining legacy checks still need a deliberate migration.
6. **Migration syntax defects discovered by actual PostgreSQL CI:** clean PostgreSQL execution exposed malformed single-dollar function delimiters in migrations 007, 008, 012, 014 and 016. These were corrected on this branch in separate commits. Disposable PostgreSQL CI run `43621256968` passed bootstrap 000 and migrations 001–024 through the ordered runner, including SHA-256 history recording, role verification, ledger integration, two-session no-overdraft concurrency, identical retry, forced post-hold rollback and migration contract tests. Production application remains unverified.
7. **Migration history/startup gate:** bootstrap 000 creates an append-only migration registry; `scripts/apply-vantoris-migrations.mjs` applies each versioned migration and records its SHA-256 checksum in the same transaction. The build generates a deployment manifest, and member, staff, document and assistant database endpoints verify exact version/filename/checksum history before serving requests. Runtime mismatch tests pass. A legacy database with an existing ledger schema but no history table is refused; controlled production baseline evidence is still required.
8. **Production evidence:** repository files and CI do not prove any institutional database migration state, existing-member reconciliation, real capital funding, staff provisioning, encryption-key provisioning or Netlify production runtime configuration.

## Required implementation sequence

### A. Establish one database contract

- Select the canonical schema and role contract without creating parallel ledgers. The founder-approved deployment name is `avcu_backend`; reconcile this with the already-applied migration grants through a DBA-reviewed forward migration/provisioning step.
- Implemented in source/CI: bootstrap 000, transactional migration runner, SHA-256 history, read-only runtime verification and fail-closed endpoint startup. Remaining: DBA-reviewed baseline for any existing institutional database without history, and verification that production uses the migration identity separate from the runtime role.
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

- Clean disposable PostgreSQL database: ordered bootstrap 000 + migrations 001–024, same-transaction checksums, history verification, seed idempotency, and runtime refusal when history is missing or mismatched.
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
- Production database identity, actual applied-migration history and checksums, and a reviewed baseline/cutover plan. Disposable PostgreSQL CI is now passing; it is not production evidence.
- Proof of any Vantoris-owned reserve account and funds before the first-payment posting path is enabled.
- Separate legal, operational, and technical evidence for any future Fedwire capability. Until then, outgoing wires remain off.

## Current state

- **Assigned branch:** `migration/remove-base44-and-codex`; branch exists and current work is being committed there.
- **Migrations/history:** bootstrap 000 creates append-only history. The runner applies 001–024 in numeric order and records each SHA-256 checksum in the same transaction; runtime endpoints compare the database history with the generated deployment manifest and fail closed on missing/altered/extra rows. Migration 007, 008, 012, 014 and 016 syntax defects were corrected. Migration 006 already installs proposer/approver separation; migration 020 hardens the existing approval path without adding a duplicate trigger. Migration 021 fixes deferred journal-trigger row-shape handling. Migration 022 adds member-scoped assistant minute/day rate limits. Migration 023 derives manual-journal currency from locked accounts, rejects mixed currencies, validates bigint cents and returns the original journal on an identical retry. Migration 024 makes journal-balance and capital-floor trigger checks see the complete ledger under member RLS and explicitly defers journal constraints in the member-transfer posting function. The account/journal schema remains USD-only; no multi-currency banking is enabled. Disposable PostgreSQL run `43621256968` passed bootstrap 000, migrations 001–024, checksum recording/verification, role checks, ledger integration, no-overdraft concurrency, idempotent retry, forced rollback and contract tests. This is not evidence of production application.
- **Runtime role:** documentation and disposable CI now model `avcu_backend` as the runtime LOGIN inheriting the historical `vantoris_backend` privilege group. Production role provisioning and cutover remain unverified and unauthorized.
- **Member authentication:** first-party Netlify functions and React auth context exist in source. Real PostgreSQL/browser behavior, MFA secret provisioning, session revocation and production configuration remain unverified.
- **Staff authentication:** separate staff auth and capability-gated operations endpoints exist in source. Staff identity provisioning, MFA provisioning, role-management UI and real browser authorization tests remain incomplete.
- **Base44:** removed from the current member/staff auth, member transfer, Netlify routing and optional assistant runtime paths. The old `base44/` functions/entities and related legacy tests remain in the repository as unretired source; a repository-wide reference audit and safe archival/deletion are still outstanding. The Vite plugin and Base44 SDK are absent from current `package.json`/`vite.config.js`.
- **Internal transfers:** the first-party member UI and `/api/member-auth?action=transfer` path now call the Vantoris internal ledger workflow. The source selector is limited to USD `member_liability` accounts for an active member status returned by the authenticated server; the server remains authoritative for account ownership, limits, idempotency, available funds and posted journal confirmation. The disposable PostgreSQL integration scenario passed, including internal posting and insufficient-funds rejection. PostgreSQL CI run `43621256968` additionally raced two sessions attempting $70 transfers against a $100 sender balance: exactly one posted and the other failed on available funds. An identical retry returned the original journal; a forced unique-key failure after hold creation rolled back the operation and hold. Browser end-to-end tests remain outstanding.
- **Existing-member preservation:** no verified source export, identity crosswalk, account/journal reconciliation, permission mapping or rollback has been completed. No member data has been migrated.
- **Institutional capital:** capital-floor controls exist in source; actual capital records, reserve evidence and opening journals have not been supplied or posted.
- **Identity documents:** encrypted document workflow exists in source; key provisioning, rotation, retention and live DB/browser verification remain outstanding.
- **Staff operations:** proposal/approval and audit SQL exists. The current `/operations/*` route is gated but resolves to the shared StaffPortal; individual legacy operations pages are not yet restored as distinct workflows. Staff directory/role-management, account opening, verified receipt posting, complete audit/reporting and reconciliation workflows remain incomplete.
- **Assistant:** optional and first-party. The browser chat and `/api/oracle` use Vantoris member-session authentication, CSRF validation and database-backed minute/day rate limits; the server calls only `VANTORIS_PRIVATE_LLM_URL` with `VANTORIS_PRIVATE_LLM_MODEL`. It receives the user's prompt only, has no account/journal/identity/staff record query path, and exposes no elevated commands or financial permissions. Chat history is held in browser `sessionStorage` only; durable cross-device history is not implemented. No private model configuration or live assistant call has been verified. If no private endpoint is configured, it returns unavailable. Core member, ledger and staff workflows do not depend on it.
- **CI/testing:** disposable PostgreSQL workflow `43621256968` passed bootstrap 000, migrations 001–024, checksum recording/verification, runtime-role checks, ledger integration, two-session no-overdraft, identical retry, forced post-hold rollback, member/staff syntax, MFA cryptography and migration contract tests. Recovery build `43621256937` passed generated manifest loading, migration runner/guard tests, Deno/security checks, ESLint, TypeScript and Vite production build. USD-only account policy is verified; multi-currency expansion remains unapproved. Outbound-network-blocked E2E, browser QA and backup/restore proof remain outstanding.
- **External wires and payment rails:** not implemented/authorized. Wire requests must terminate at `approved_not_sent`; no provider or settlement status may be fabricated.
- **Netlify/production:** no merge, deployment, DNS change, production database operation or external payment activation has been performed by this work.

