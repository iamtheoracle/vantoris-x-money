# Vantoris X Money

A React member money workspace with a refreshed, mobile-friendly Vantoris experience inspired by the clarity and simplicity of modern consumer banking apps.

The full frontend was restored from the supplied app archive. The public welcome page at `/welcome` introduces everyday money and cards, with responsive navigation and expandable help. Signed-out visitors to protected pages reach the welcome page. Members retain their existing account, payment, card, support, and operations routes.

## Local development

Install dependencies with `npm install`, then start `netlify dev --port 8889`. Run `npm run lint` for source lint checks. Netlify handles the production build and SPA routing.

## Scope and service availability

This change refreshes design and user experience. Existing Base44 client integrations were retained; banking services, account eligibility, transfers, identity verification, and card issuance still depend on the configured backend and providers. The welcome-page phone and card illustrations are labeled previews and contain no fabricated account balances or payment results. No claim of SoFi or Chime affiliation is made.

The archive's hardcoded local sign-in shortcut was removed. Authenticated banking and operations flows require real authorized sessions and were not verified against a live member account during this design update.

## Money experience and planning guides

The member workspace separates Overview, Accounts, Pay & transfer, Cards, and Activity, with a desktop sidebar and mobile bottom navigation. Activity supports search, status and date filters, and pagination over loaded records. Account fetch failures have an explicit retry state rather than appearing as empty balances.

Bank-transfer requests use a details → review → confirmation journey against the existing request endpoint. The form validates decimal amounts and U.S. routing checksums, keeps the same idempotency key when retrying an unchanged request, and requires a returned request ID before displaying confirmation. Request submission may reserve available funds; it does not confirm bank execution. Person-to-person payments, money requests, deposit execution, and issuer controls remain unavailable until their services are enabled.

The public catalogue links to educational guides at `/learn` for saving, borrowing, home planning, investing, workplace benefits, and security. The savings planner is an unsaved illustration with no interest, fees, or account changes. Workplace guides explain benefit questions to ask an employer; they do not enrol employees or administer benefits.

Run `node --test tests/banking-experience.test.js` for exact-cent parsing, routing-number validation, and activity-filter checks. Browser verification used isolated synthetic records and request responses, not live member funds or provider submissions.
