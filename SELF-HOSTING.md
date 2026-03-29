# Self-Hosting Guide

## Quick Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env`

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

3. Set up database and Supabase functions

- Apply `database-setup.sql`
- Deploy required functions (analysis, payment, admin, traffic/usage)

4. Run app

```bash
npm run dev
```

5. Verify production build

```bash
npm run build
```

## Required Frontend Env Vars

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Required Backend Secrets (Supabase)

At minimum, configure:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- AI provider keys used by your functions (Gemini/OpenAI as configured)
- Payment provider secrets if payment flows are used

## Admin Access

- Login route: `/bosspage-login`
- Dashboard route: `/bosspage`

Current admin UI sections:

- Dashboard
- User Management
- Payments
- Plans and Pricing
- AI Assistant
- Manage Creators
- Traffic Analytics
- Usage Analytics

## Current Public and Auth Routes

- `/`, `/youtube-analyzer`, `/seo-optimizer`
- SEO tools: `/reel-*` pages
- `/guides/:slug`
- `/blog`, `/blog/:slug`
- `/about`, `/contact`, `/partnership`, `/collaboration`, `/promotion`
- `/privacy-policy`, `/terms`, `/sitemap-page`, `/pricing`
- `/login`
- `/creator-login`, `/creator-dashboard`

## Production Hosting

This project is a Vite SPA. For any host:

- Build command: `npm run build`
- Output directory: `dist`
- Configure fallback/rewrite of all paths to `index.html`

`vercel.json` is included for Vercel and already configured.
