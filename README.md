# Vantoris X Money

Member banking app restyled to **X Money UI**, with full Vantoris/Base44 backend and isolated ops admin dashboard.

**Repo:** https://github.com/iamtheoracle/vantoris-x-money  
**Netlify site:** https://vantoris-x-money.netlify.app  
**Netlify dashboard:** https://app.netlify.com/projects/vantoris-x-money

## Fixes applied (local + pushed core files)

1. **MemberRoute import** in `App.jsx` — was missing; would crash authenticated routes
2. **Dead sheet UI removed** from Home — quick actions always go to MoveMoney
3. **Tabs via `?tab=`** — Account / Rewards / Activity share Home; BottomNav links to them
4. **MoveMoney `?action=`** — opens send / request / add panel from query string
5. **Ops isolation** — MemberRoute redirects ops users to `/operations`; admin layout unchanged

## Quick actions (kept)

Deposit · Send · Request → `/move-money?action=…` (Zelle, QR, transfers, deposits intact).

## What’s in this repo so far

- `netlify.toml`, Vite/PostCSS/jsconfig, `index.html`
- `src/components/MemberRoute.jsx`, `OperationsRoute.jsx`
- `src/components/vantoris/BottomNav.jsx`, `MemberLayout.jsx`
- README

**Still need the full app tree** from the working clone (`~448` files under Base44/Vantoris) for a complete production build.

## Finish deploy (recommended)

From a machine with the full fixed tree and GitHub write access:

```bash
# Option A — push full tree to this repo
cd /path/to/vantoriss-fixed
git remote add xmoney https://github.com/iamtheoracle/vantoris-x-money.git
git push xmoney feature/x-money-member-ui:main --force

# Option B — link Netlify to the repo in UI
# Site settings → Build & deploy → Connect to Git → iamtheoracle/vantoris-x-money
# Build command: npm run build
# Publish directory: dist
```

Local Netlify CLI (from project root):

```bash
npm install
npm run build
npx netlify deploy --prod --dir=dist --site=35d1b417-d469-4745-9673-15b8cb5fdbe4
```

## Local dev

```bash
npm install
npm run dev
```

Requires Base44 backend env/config as in the original Vantoris app.
