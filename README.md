# Vantoris X Money

Member banking app restyled to **X Money UI**, with full Vantoris backend and isolated ops admin dashboard.

## What this is
- **Member UI**: white/minimal X Money layout (big balance, Deposit / Send / Request, Account · Rewards · Activity)
- **Backend**: Base44 entities (accounts, cards, portfolios, transactions, Zelle / MoveMoney)
- **Ops**: administrators never see the member shell (`MemberRoute` → `/operations`)

## Quick actions
Deposit, Send, and Request route into the full **MoveMoney** flow (Zelle, QR, transfers).

## Local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

Deployed on Netlify as SPA (`netlify.toml` redirects `/*` → `/index.html`).
