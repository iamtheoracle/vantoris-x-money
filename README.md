# Vantoris X Money

A React member money workspace with a refreshed, mobile-friendly Vantoris experience inspired by the clarity and simplicity of modern consumer banking apps.

The full frontend was restored from the supplied app archive. The public welcome page at `/welcome` introduces everyday money and cards, with responsive navigation and expandable help. Signed-out visitors to protected pages reach the welcome page. Members retain their existing account, payment, card, support, and operations routes.

## Local development

Install dependencies with `npm install`, then start `netlify dev --port 8889`. Run `npm run lint` for source lint checks. Netlify handles the production build and SPA routing.

## Scope and service availability

This change refreshes design and user experience. Existing Base44 client integrations were retained; banking services, account eligibility, transfers, identity verification, and card issuance still depend on the configured backend and providers. The welcome-page phone and card illustrations are labeled previews and contain no fabricated account balances or payment results. No claim of SoFi or Chime affiliation is made.

The archive's hardcoded local sign-in shortcut was removed. Authenticated banking and operations flows require real authorized sessions and were not verified against a live member account during this design update.
