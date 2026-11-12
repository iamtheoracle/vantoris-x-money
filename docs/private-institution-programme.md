# Vantoris Private Institution — Transformation Programme

## Purpose and authority

This programme evolves the existing Vantoris application into **Vantoris Private Institution**. It is a continuation of the existing product, not a replacement application.

Preserve existing customers, identities, accounts, balances, transaction history, documents, permissions, service requests, staff access, and all existing product capabilities. Do not manufacture records, backfill invented history, change balances, or present unverified provider status as live.

The product name is **Vantoris Private Institution**. The repository slug, Netlify project name, existing routes, database identifiers, and provider configuration are technical identifiers; do not rename them as part of visual branding without a separately reviewed migration plan.

No production deployment, production data mutation, provider activation, financial execution, account issuance, or merge to a protected branch is authorized by this programme.

## Critical production-source reconciliation

### Verified observations (12 November 2026)

- Netlify project: `vantorispip`.
- Production domain: `https://www.vantorispip.sbs`.
- Netlify site ID: `d46e0386-ee5a-4a62-a519-6e393a025e97`.
- Published deploy: `6af43e1567f5c6fef318f25f`, state `ready`, published 11 November 2026.
- Published deploy commit reference: `f27e446ce724078925a0a583dd66ad3a77e1adcc`.
- The commit reference is not resolvable in `iamtheoracle/vantoris-x-money`.
- The deploy reports `deploy_source=agent_runner`, `has_source_zip=true`, and no Netlify Functions or Edge Functions.
- A live public fetch of the production domain returned HTTP 402 and Base44's “Vantoris is currently unavailable” page. Netlify's `ready` state is therefore not proof that the customer application is available.
- GitHub `main` contains a small Vite application skeleton. Its README says the full application tree is still missing.
- `recovery/merge-vantoris-live` contains the substantially restored application, but its recovery PR #2 is still open and draft.
- `feat/private-investment-heritage-design` contains heritage/identity work in draft PR #3, based on the recovery branch. It is not a complete platform transformation.
- PR #2 and PR #3 have no review submissions recorded. The latest queried commit-associated workflow-run endpoint returned no PR-triggered workflow runs for either current head.
- The recovery README includes a force-push suggestion for `main`. This programme explicitly prohibits force-pushing or overwriting existing branch history.

### Release-blocking dependency

Recover and reconcile the exact source archive used by the published Netlify deployment, then identify the actual Base44 application, backend entities, functions, policies, and data environment serving existing customers. Compare that source with GitHub `main`, the recovery branch, and the heritage branch.

Do not merge a recovery branch, connect a different production source, or deploy a replacement until the source and backend identity are proven and customer-data continuity is demonstrated. The Netlify deploy record confirms a source ZIP exists, but the available connector did not expose a safe source-archive download operation. The archive recovery path remains open.

## Initial risk register

| ID | Area | Finding | Status | Required next action |
|---|---|---|---|---|
| P0-01 | Production source | Published commit SHA is not in the GitHub repository; deployment source is Agent Runner. | Blocked | Recover source ZIP and prove exact source-to-deploy correspondence. |
| P0-02 | Customer availability | Public domain returned HTTP 402 with Base44 app-unavailable page. | Verified outage at inspection time | Establish Base44 app/account availability with owner; verify app URL and authenticated customer path without using customer credentials. |
| P0-03 | Backend identity | Live Base44 entities, functions, RLS, and customer data have not been inspected or matched to the repository. | Unverified | Identify the correct Base44 project and inspect deployed policies/data safely. |
| P1-01 | Financial approvals | Recovered `Approvals.jsx` attempts browser-side Account balance and Transaction status updates. | Source defect confirmed; live exposure unverified | Replace with a server-authorized, transactional, audited workflow; preserve dual control and fail closed until verified. |
| P1-02 | Support | Recovered Support page stores a note only in local component state; it does not create a persistent ticket. | Source limitation confirmed; live exposure unverified | Implement persistent server-side ticket lifecycle and truthful delivery status. |
| P1-03 | Investment | Investment mutations are explicitly disabled pending a trusted provider, ledger, and authorization workflow. | Guard present | Preserve the guard; verify provider/custody/legal arrangements and transactional ledger before enabling. |
| P1-04 | Desktop operations | Recovered AdminLayout constrained the operations workspace to a 430px phone shell at desktop widths. | Responsive desktop shell implemented in PR #4; browser/build verification pending | Run responsive and route QA at mobile, tablet and desktop widths; preserve the mobile drawer and every workspace route. |
| P1-05 | Client dashboard | Recovered Home aggregates Account balances and portfolio values in the browser. | Source behavior confirmed | Verify authoritative source, currency handling, access policies, and server-side aggregation before presenting consolidated wealth. |
| P1-06 | Product identity | Heritage branch labels the product “Vantoris Private Investment”, not the approved “Vantoris Private Institution”. | Source mismatch confirmed | Correct the complete customer-facing identity after production-source reconciliation; preserve investment as a core capability. |
| P1-07 | Legacy contamination | Recovery configuration and migrations contain AVCU-specific ledger naming and configuration. | Source contamination confirmed | Trace all references and dependencies; plan a safe Vantoris-native namespace migration without changing live configuration prematurely. |
| P1-08 | Housing discovery | Recovered discovery source includes hard-coded property examples and estimated figures. | Source content requires audit | Remove unverified examples from customer-facing live inventory; show only sourced listings or a clear unavailable state. |
| P1-09 | Flight discovery | OpenSky tracking is present; commercial rights and any booking provider integration are unverified. | Unverified | Separate public flight tracking from commercial booking; verify provider contract and live inventory before claiming booking capability. |

Statuses describe repository/deployment evidence only; they do not imply a defect is currently exposed to live customers unless explicitly stated.

## Product preservation register

All current routes and service areas must be inventoried and retained. Each capability receives one of these evidence states: **Verified live**, **Implemented but unverified**, **Unavailable / fail-closed**, **Insecure**, **Incomplete**, **Missing**, or **Blocked by external dependency**.

The initial inventory includes:

- Client identity, authentication, sessions, profile, account access, account details, statements and documents.
- Home/wealth overview, cash and savings accounts, cards, transactions, activity and notifications.
- Investments, portfolios, holdings, allocation, performance, market information, watchlists, investment requests and reports.
- Treasury, FX, transfers, payment requests, deposits, withdrawals, reconciliation, audit and payment-provider operations.
- Travel: flights, flight tracking, hotels, cars and related services.
- Property and housing discovery.
- HeroBox: catalogue, care packages, giving, orders, humanitarian cases, volunteers, shipping and impact reporting.
- Messaging, member support, service requests and Concierge/Oracle assistance.
- Operations, staff workspaces, member servicing, KYC, approvals, finance, reports, security, integrations, configuration, monitoring and administration.

No capability is removed simply because its current provider is unavailable. It must be retained with an honest status and a secure, usable unavailable state until its dependency is resolved.

## Approved institutional design direction

### Brand system

- Product identity: **Vantoris Private Institution**.
- Core institutional palette: midnight navy, warm ivory/stone, restrained antique brass and slate neutrals.
- Typography: refined editorial serif for institutional headings; highly legible sans-serif for interface and data; monospaced numerals only where they improve financial comparison.
- Visual character: discreet, distinguished, architectural, private and composed. Do not copy another institution's brand, logo, exact screens or proprietary assets.
- Preserve Vantoris's own emblem and original artwork. Do not invent a founding year, regulatory status, custody relationship, banking licence or institutional affiliation.

### Wealthsimple-inspired usability (not brand copying)

Apply these interaction patterns within Vantoris's own visual identity:

- **Home:** clearly distinguish verified cash/liquidity from investments; show a consolidated wealth figure only when all included balances are authoritative, compatible in currency, current and access-authorized. Support individual account balances, recent activity, notices, hide-balance control, and pin/reorder preferences.
- **Invest:** dedicated investment workspace with portfolio value, performance over selectable periods, accounts, holdings, asset allocation, gains/losses, activity, watchlists and reports. Display provider/data freshness and unavailable states; never synthesize positions or performance.
- **Accounts:** separate account list and detail views, account-specific activity/statements, cards, and authorized payment entry points. Keep liquidity and investment valuation distinct.
- **Desktop:** slim persistent side navigation, spacious information hierarchy, readable dense tables, sortable/customizable columns where useful, expandable charts, and keyboard-accessible controls.
- **Mobile:** responsive cards and detail views, accessible touch targets, no forced swipe gestures, no unnecessary navigation depth.
- Apply the shared design system to Treasury, travel, property, HeroBox, Concierge and staff workspaces without flattening their distinct workflows.

## Engineering and security acceptance criteria

- Preserve account/profile/session/delegate distinctions and existing customer identifiers.
- Enforce authentication and authorization on the server. Never trust client-supplied roles, owner IDs, workspace selection, balances or approval status.
- Use database constraints, transactions, row-level security, least-privilege roles, idempotency, append-only audit records, reconciliation and tested reversal semantics for financial workflows.
- Financial approval must be a server-side transaction with maker/checker separation where required; no browser-side balance mutation.
- Preserve MFA, session security, privacy, abuse controls, rate limits, incident logging and staff/admin separation.
- Protect sensitive member data and minors where applicable. Keep secrets out of source and client bundles.
- AI assistants must use scoped permissions, avoid unrestricted private/financial/admin access, and require confirmation for consequential actions.
- Synthetic fixtures belong only in isolated test infrastructure and must never enter live customer views.
- No external payment, investment, custody, card, travel, property, shipping or donation provider is considered active until credentials, contracts, server integration, callbacks/webhooks, reconciliation, operational controls and acceptance tests are verified.

## Verification and release gates

1. Recover and identify the exact production source and backend.
2. Establish customer-data continuity and a rollback/recovery plan.
3. Complete a route-by-route and capability-by-capability preservation register.
4. Audit authentication, authorization, data ownership, RLS, staff roles, audit trails and secrets.
5. Fix high-risk server-side workflow defects before redesigning dependent screens.
6. Implement the institutional design system and Wealthsimple-inspired Home, Invest and Accounts patterns on the verified source.
7. Complete remaining client services and internal workspaces without removing routes.
8. Run install, lint, typecheck, build, unit, integration, PostgreSQL concurrency/ledger, role-matrix and browser tests. Tests requiring unavailable credentials or production data must be marked unverified, not passed.
9. Verify accessibility, responsive behavior, empty/loading/error states, financial calculations, currency boundaries and audit lifecycle.
10. Obtain explicit release authorization before merge or production deployment.

A successful static build is not proof of application availability, deployed authorization, provider connectivity, financial correctness or production readiness.

## Implementation added on the work branch

- `src/components/vantoris/AdminLayout.jsx`: replaces the fixed 430px operations phone shell with a persistent desktop sidebar and a mobile-only navigation drawer. The content area now uses a responsive, readable desktop width while retaining the existing routed page outlet and floating assistant dock.
- `src/components/vantoris/AdminTopBar.jsx`: hides the drawer trigger at desktop widths, expands the search field on desktop, and uses the approved Vantoris Private Institution name in the workspace header.
- The saved workspace preference is checked against the authenticated user's role-derived workspace list before it is applied. This is a navigation/display constraint only; server-side route/data authorization remains mandatory and is not replaced by localStorage.

### Verification status

- The three changed files were read back from the work branch and the expected desktop sidebar, mobile drawer, responsive top bar and workspace allowlist checks were confirmed in source.
- No local dependency install, lint, typecheck, production build or browser viewport test has been run in this environment. The workflow file does include `recovery/merge-vantoris-live` in its `pull_request` target branches and also supports `workflow_dispatch`; the latest commit-associated lookup returned no run for this head. Investigate Actions enablement, event delivery and run visibility rather than attributing the absence to the branch filter. Code remains unverified until a successful CI run and browser QA are completed.
- No customer data, backend policies, financial records, provider configuration, `main` branch or production deployment was changed.

## Current work branch

`work/private-institution-programme` is branched from `recovery/merge-vantoris-live` for review. It contains the programme register and the first responsive operations-workspace implementation. It does not alter `main`, production deployment, Base44 data, or customer records.


## Additional live edge observations (12 November 2026)

A read-only inspection of Netlify edge observability for site `d46e0386-ee5a-4a62-a519-6e393a025e97` covered the 24-hour window ending 12 November 2026 at approximately 22:07 UTC+1.

- The available request-count result contained 10 HTTP 200 responses and one HTTP 404 response. It contained no HTTP 402 response in that sampled window. This does not disprove the earlier HTTP 402 response from the custom domain; it means the 402 was not present in this Netlify sample.
- Recent requests to the `vantorispip.netlify.app` hostname successfully loaded the root document and JavaScript assets.
- The same browser session requested `/api/apps/null/entities/User/me` and received HTTP 200, but Netlify recorded the response content type as `text/html`, not JSON. A request to `/api/apps/public/prod/public-settings/by-id/null` also returned HTTP 200, while `/api/apps/null/analytics/track/batch` returned HTTP 404.
- None of these sampled requests reported a Netlify Function, Edge Function, or server invocation.

### Interpretation and next verification

The literal `null` application identifier and HTML content type on an endpoint expected to return user data are strong indicators of a client/API configuration or routing problem. They are not, by themselves, proof of the exact Base44 failure cause because Netlify edge logs do not expose the response body here.

Before any release or source switch:
1. Obtain the exact production source ZIP and compare its build output and runtime configuration with the published deployment.
2. Identify the correct Base44 application identifier and environment without exposing or changing customer credentials.
3. From an authorized, non-customer test session, inspect the actual response body and content type for the current user/session endpoint; verify that it returns the expected JSON or a truthful authentication error, never the SPA HTML document.
4. Verify the custom domain and Netlify hostname independently, including redirects, DNS, TLS and Base44 availability.
5. Preserve these observations as diagnostic evidence; do not alter the production app ID, environment variables, domain configuration or customer data until the correct app/backend mapping is confirmed.

These edge observations are operational evidence only. They do not establish customer login success, data access, Base44 application identity, or backend authorization.


## CI configuration review (12 November 2026)

The recovery build workflow currently injects a Base44 app identifier, a Base44 server URL, an app base URL, and a test-database secret named for the legacy AVCU ledger. These values are part of the CI job environment, not proof of the production deployment's runtime configuration or backend identity.

- Keep CI credentials and test data isolated from production.
- Verify the app identifier against the owner-confirmed Vantoris Base44 project before treating it as authoritative.
- Verify the legacy-named test database secret points only to an isolated test database. Do not rename or repoint it until its consumers and database target are established.
- The latest work-branch commit has no workflow run returned by the commit-associated PR-run lookup. This is not evidence of a successful build. The workflow supports manual dispatch, but no dispatch was initiated through the available GitHub actions tools.
- No CI environment values, secrets, production variables or backend project settings were changed.
