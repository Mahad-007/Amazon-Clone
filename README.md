# Amazon Clone

A rebuild of [amazon.com](https://www.amazon.com) — the core shopping flow, built from scratch in 24 hours.

**Live:** _(deploying — link goes here)_

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Data / Auth | Supabase (Postgres, Auth, Storage) |
| Hosting | Vercel |

## Scope

The goal is a shopping experience that actually works end to end, not a pixel-perfect static copy of the homepage. Priority order:

1. **Browse** — homepage rails, category pages, product detail
2. **Search & filter** — query, department, price, rating, sort
3. **Cart** — add/remove/quantity, persisted across sessions
4. **Auth** — sign up, sign in, account
5. **Checkout** — address, payment (mock), order placement
6. **Orders** — order history and detail

### Deliberately not built

Tracked as the build goes, and explained in the walkthrough: seller/vendor tooling, Prime membership, reviews with media, recommendations from real ML, Amazon's ads surface, returns, and anything requiring a real payment processor.

## Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

## `.agent-logs/`

This repo was built with an AI coding agent. Every prompt and response is captured to [`.agent-logs/`](.agent-logs) by a hook in [`.claude/settings.json`](.claude/settings.json) running [`scripts/capture.mjs`](scripts/capture.mjs), and committed incrementally alongside the code it produced.
