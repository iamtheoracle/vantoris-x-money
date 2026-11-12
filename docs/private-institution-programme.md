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
- Live checks distinguish the public hosts: `https://www.vantorispip.sbs` and `https://vantorispip.sbs` returned HTTP 402 with Base44's “Vantoris is currently unavailable” page; the exact published Netlify deploy URL `https://main--vantorispip.netlify.app` and immutable deploy permalink `https://6af43e1567f5c6fef318f25f--vantorispip.netlify.app` returned HTTP 200 and the Vantoris login shell; `https://vantoris.base44.app` returned HTTP 200 and the Base44 login page. This does not prove an authenticated session or customer data access. `https://vantoris-platform.netlify.app`, the URL injected by the recovery workflow as `VITE_BASE44_APP_BASE_URL`, returned HTTP 404.
- GitHub `main` contains a small Vite application skeleton. Its README says the full application tree is still missing.
- `recovery/merge-vantoris-live` contains the substantially restored application, but its recovery PR #2 is still open and draft.
- `feat/private-investment-heritage-design` contains heritage/identity work in draft PR #3, based on the recovery branch. It is not a complete platform transformation.
- PR #2 and PR #3 have no review submissions recorded. The latest queried commit-associated workflow-run endpoint returned no PR-triggered workflow runs for either current head.
- The Netlify site's environment-variable listing returned an empty array. Recent edge observability showed a request to `/api/apps/null/entities/User/me` returning HTTP 200 with `text/html` rather than the expected JSON, plus a `/api/apps/null/analytics/track/batch` 404. This is consistent with a missing/mismatched app identifier or routing configuration, but the exact cause is not proven without the deployed source and response body.
- The recovery README includes a force-push suggestion for `main`. This programme explicitly prohibits force-pushing or overwriting existing branch history.

### Release-blocking dependency

Recover and reconcile the exact source archive used by the published Netlify deployment, then identify the actual Base44 application, backend entities, functions, policies, and data environment serving existing customers. Compare that source with GitHub `main`, the recovery branch, and the heritage branch.

Do not merge a recovery branch, connect a different production source, or deploy a replacement until the source and backend identity are proven and customer-data continuity is demonstrated. The Netlify deploy record confirms a source ZIP exists, but the available connector did not expose a safe source-archive download operation. The archive recovery path remains open.

## Initial risk register

| ID | Area | Finding | Status | Required next action |
|---|---|---|---|---|
| P0-01 | Production source | Published commit SHA is not in the GitHub repository; deployment source is Agent Runner. | Blocked | Recover source ZIP and prove exact source-to-deploy correspondence. |
| P0-02 | Customer availability | Custom apex and `www` domains return HTTP 402; the exact Netlify deploy URL and direct Base44 URL return login shells with HTTP 200. | Custom-domain failure confirmed; authenticated access unverified | Verify DNS, redirects, TLS, Base44 custom-domain binding and the authenticated API path using an authorized non-customer test session. Do not change live domain or app settings without approval. |
| P0-03 | Backend identity | Live Base44 entities, functions, RLS, and customer data have not been inspected or matched to the repository. | Unverified | Identify the correct Base44 project and inspect deployed policies/data safely. |
| P1-01 | Financial approvals | Legacy `Approvals.jsx` attempted browser-side Account balance and Transaction status updates. | Browser-side actions removed; inbox is read-only in PR #4. A secure generic approval workflow is still missing. | Implement a server-authorized, transactional, idempotent and audited lifecycle before re-enabling any decision; preserve maker/checker separation. |
| P1-02 | Support | Recovered Support page stores a note only in local component state; it does not create a persistent ticket. | Source limitation confirmed; live exposure unverified | Implement persistent server-side ticket lifecycle and truthful delivery status. |
| P1-03 | Investment | Member investment mutations remain disabled; operator deposit/withdrawal queues are now read-only and their browser-side portfolio writes were removed in PR #4. Investment entity schemas are absent from the versioned repository. | Fail-closed; live Base44 schema and provider state unverified. PostgreSQL investment ledger not established. | Preserve the guards and request history. Recover deployed investment entity definitions/RLS and verify legal authority, custody/provider, ledger, dual-control and reconciliation before enabling. |
| P1-04 | Desktop operations | Recovered AdminLayout constrained the operations workspace to a 430px phone shell at desktop widths. | Responsive desktop sidebar/mobile drawer and wider content implemented; CI build passes. Browser viewport QA pending. | Run keyboard, accessibility, route and viewport QA at mobile, tablet and desktop widths; preserve all workspaces and mobile navigation. |
| P1-05 | Client dashboard | Home now distinguishes failed data queries from genuine empty results and withholds a consolidated wealth total; individual recorded account balances still come from client-side Base44 queries. | Safer empty/error states implemented; server-authorized aggregation and currency metadata remain unverified. Parent `MemberLayout` still constrains the customer shell to 430px. | Verify deployed RLS and currency semantics, then build a server-authorized, currency-aware wealth summary and responsive member shell. Never sum incompatible currencies or show a fabricated total. |
| P1-06 | Product identity | Heritage branch labels the product “Vantoris Private Investment”, not the approved “Vantoris Private Institution”. | Source mismatch confirmed | Correct the complete customer-facing identity after production-source reconciliation; preserve investment as a core capability. |
| P1-07 | Legacy contamination | Recovery configuration and migrations contain AVCU-specific ledger naming and configuration. | Source contamination confirmed | Trace all references and dependencies; plan a safe Vantoris-native namespace migration without changing live configuration prematurely. |
| P1-08 | Housing discovery | Recovered discovery source includes hard-coded property examples and estimated figures. | Source content requires audit | Remove unverified examples from customer-facing live inventory; show only sourced listings or a clear unavailable state. |
| P1-09 | Flight discovery | OpenSky tracking is present; commercial rights and any booking provider integration are unverified. | Unverified | Separate public flight tracking from commercial booking; verify provider contract and live inventory before claiming booking capability. |
| P1-10 | Currency and investment data contracts | `formatCurrency.js` formats every amount as USD; Account schema has no currency field; investment entities have no versioned JSONC schemas. | Repository contract gap; deployed semantics unknown. | Recover deployed schemas and currency semantics; add reviewed migrations and conversion/freshness provenance before multi-currency aggregation or investment performance reporting. |
| P1-11 | Customer navigation shell | `MemberLayout.jsx` still wraps member routes in a 430px-wide container, even though Home itself now supports a wider layout. | Desktop member layout not yet implemented. | Add a responsive desktop navigation shell while retaining existing mobile navigation and all routes; test all member pages for overflow and layout regressions. |

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
- `src/pages/operations/Approvals.jsx`: removes direct browser-side Account/Transaction writes and makes the legacy inbox read-only, with links to the dedicated operations queues.
- `src/pages/operations/InvestmentDeposits.jsx` and `InvestmentWithdrawals.jsx`: retain request records and recorded statuses but remove browser-side portfolio balance mutations and approval/rejection actions until a server-authorized investment ledger workflow exists.
- `src/pages/Home.jsx`: differentiates data-access failures from genuinely empty results, withholds consolidated wealth totals until currency/valuation provenance is established, expands its own content width, and qualifies unverified rewards/benefits copy. The parent member shell still needs desktop work.

### Verification status

- Source readback confirmed the desktop sidebar/mobile drawer, role-allowlisted workspace preference, read-only financial queues and data-aware Home states.
- GitHub Actions run [#657](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43307304580) completed successfully for commit `827c9d0`. Dependency install, JavaScript syntax check, Oracle runtime checks, payment-store unit tests, migration tests, browser-AI execution guard, entity/RLS validation, lint, typecheck and Vite production build all passed. Test results: Oracle runtime 2 passed; payment-store 2 passed/1 ignored; migration checks 6 passed. The PostgreSQL integration test was ignored because `AVCU_LEDGER_TEST_DATABASE_URL` was not configured.
- No browser viewport QA, live Base44 authenticated-session test, deployed RLS test or production API test has been run. CI success is not production readiness.
- No customer data, backend policies, financial records, provider configuration, `main` branch or production deployment was changed.
- No customer data, backend policies, financial records, provider configuration, `main` branch or production deployment was changed.

## Current work branch

`work/private-institution-programme` is branched from `recovery/merge-vantoris-live` for review. It contains the programme and route registers, responsive operations shell, data-aware Home improvements, and fail-closed financial queue corrections. It does not alter `main`, production deployment, Base44 data, or customer records.


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


## Financial display integrity correction (12 November 2026)

The member Home previously coerced absent or invalid account balances and transaction amounts to numeric zero using `Number(value) || 0`. This could display a fabricated $0.00 for a missing, malformed, or unavailable source value.

Changes committed on `work/private-institution-programme`:
- `src/lib/formatCurrency.js` now formats verified zero as $0.00 but returns `Value unavailable` for null, undefined, empty, non-numeric, NaN, and infinite inputs.
- `src/pages/Home.jsx` passes raw account balances to the formatter and does not coerce missing transaction amounts to zero or display an invented positive/negative sign.
- `tests/financial-formatting.test.ts` covers verified zero, valid amounts, missing/invalid values, and the browser-side account-number issuance guard.
- `.github/workflows/recovery-build.yml` runs the new Deno test.

Verification notes:
- Source-level checks confirm the old `Number(a.balance) || 0` and `Number(tx.amount) || 0` coercions are absent from Home.
- GitHub Actions run #739 was created for commit `3bbce268bd7ca7f1605a0be59d6645490e56f8f9`, but was still pending at the last inspection; no passing result is claimed.
- PR #4 remains draft and unmerged. Its head is one commit ahead of the recovery base in one direction but the refs are reported as diverged (104 commits ahead, 1 behind); GitHub currently reports the PR as not mergeable. Do not force-update or rebase the branch through a blind ref move. Resolve the single missing-base ancestry safely after identifying the exact commit and checking for conflicts.


## Heritage collection and print artwork (12 November 2026)

The current work branch now includes the following reviewable presentation work:
- Four original 1050 × 660 SVG card-art editions: Obsidian, Ivory, Meridian and Atelier. The artwork contains no PAN, CVV, EMV credential or payment-network mark and is explicitly described as design artwork, not an issued card.
- A responsive card-art gallery on the landing page, card workspace and brand identity page. A dedicated print action opens a print-only layout with two 3.375 × 2.125 inch card faces per row; vector SVGs remain scalable.
- Four historical finance editorial cards with a short story, date/milestone, portrait credit and source link: Giovanni di Bicci de' Medici (1397), Sir Francis Baring (1762), Mayer Amschel Rothschild (1769/1810) and J. Pierpont Morgan (1871/1895).
- A separate Hambros Bank remembrance corner with a 1839 / 1921 / 1926 / 1998 chronology, an original architectural illustration, and explicit no-succession/no-affiliation wording. It is a historical tribute only.
- Heritage content appears on the public landing page, member Home and investment workspace. Remote portrait images have a graceful unavailable state; their external source resolution and reproduction terms remain subject to final print verification.
- The Brand Identity page no longer displays a fabricated card number or fictional executive name/contact address. The landing page no longer publishes the unverified UK or US telephone numbers; client services directs authenticated users to verified in-account contact details.

Financial presentation corrections:
- Currency formatting accepts an explicit ISO currency code, distinguishes absent values from genuine zero, and refuses to infer a currency when a source field is missing.
- Home account balances and transaction activity now use each record's stored currency field rather than assuming USD.
- Investment portfolio values use the same validated formatter and do not coerce missing values to zero.
- New Deno tests cover currency provenance, heritage dates/sources, Hambros non-affiliation language and the four credential-free SVG assets. The recovery workflow runs these tests.

Brand decision:
- The approved customer-facing identity for this repository is **Vantoris Private Institution**. “Vantoris X Money” remains only the historical repository/technical identifier, not customer-facing product branding. “Vantage” was discussed in an earlier wording exchange, but the subsequent clarification explicitly returned the product identity to Vantoris Private Institution. Do not introduce Vantage as a competing brand or perform a broad repository rename.

Verification:
- The previously completed GitHub Actions run #741 passed on commit `82b272df59af74c97fe42d27acba0e8dccc26fe1`, including install, runtime/security checks, entity/RLS validation, lint, typecheck and production build. That run predates the heritage/print and currency-provenance commits in this section.
- A fresh CI run is required for the latest head before these changes can be called verified. Browser print-preview QA and live portrait-source checks remain outstanding.
- No customer data, Base44 records, provider settings, production environment, deployment, or financial execution was changed.
