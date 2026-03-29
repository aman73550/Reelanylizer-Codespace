# Deployment Guide

This guide is updated to match the current codebase and routes.

## 1. Prerequisites

- Node.js 18+
- npm
- Supabase project
- GitHub repo access (for Vercel)

## 2. Install and Build

```bash
npm install
npm run build
```

If build succeeds, deployable output is in `dist/`.

## 3. Frontend Environment

Create `.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

Only `VITE_*` values should be exposed to frontend.

## 4. Supabase Backend Setup

In Supabase Dashboard:

- Run SQL from `database-setup.sql` (or keep migrations in sync)
- Set Edge Function secrets (admin + AI/payment related)
- Deploy required functions

Recommended functions to deploy:

- `analyze-reel`
- `seo-analyze`
- `generate-master-report`
- `create-payment`
- `verify-payment`
- `create-admin`
- `admin-users`
- `admin-ai-chat`
- `manage-creators`
- `traffic-analytics`
- `usage-analyzer`

Example:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase functions deploy analyze-reel
npx supabase functions deploy seo-analyze
npx supabase functions deploy generate-master-report
npx supabase functions deploy create-payment
npx supabase functions deploy verify-payment
npx supabase functions deploy create-admin
npx supabase functions deploy admin-users
npx supabase functions deploy admin-ai-chat
npx supabase functions deploy manage-creators
npx supabase functions deploy traffic-analytics
npx supabase functions deploy usage-analyzer
```

## 5. Create First Admin

Set secrets in Supabase Edge Function secrets:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Then call `create-admin` function.

## 6. Vercel Deployment (Recommended)

`vercel.json` is configured for a Vite SPA with safe client-side routing fallback.

Current config:

- Framework: `vite`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Routing: serve static files first, then fallback to `index.html`

### 6.1 Vercel Project Settings

In Vercel Project -> Settings -> General:

- Framework Preset: `Vite`
- Root Directory: `.`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`
- Node.js Version: `20.x` (recommended)

### 6.2 Environment Variables in Vercel

In Vercel Project -> Settings -> Environment Variables, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Assign each variable to all environments:

- Production
- Preview
- Development

After changing environment variables, redeploy.

### 6.3 Deploy from Git (Recommended)

1. Import repository into Vercel.
2. Confirm build settings above.
3. Add environment variables for all 3 environments.
4. Trigger deployment.

### 6.4 Deploy from CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.vercel.local
vercel --prod
```

### 6.5 Local Development with Vercel Runtime

```bash
vercel env pull .env.local
vercel dev
```

Use this when you want local behavior to match Vercel environment handling.

### 6.6 Common Vercel Failure Checks

- Blank page with no UI: confirm SPA fallback routing (`routes` with `handle: filesystem` + `index.html` fallback).
- App loads but API/auth fails: verify all `VITE_SUPABASE_*` variables are present in the target environment.
- Works locally, fails on Vercel: verify Node version is 20.x and redeploy after env updates.

## 7. Other Static Hosts

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect is already available in `public/_redirects`

### Cloudflare Pages

- Build command: `npm run build`
- Build output: `dist`

### Generic static hosting

Upload `dist/` and configure SPA fallback to `index.html`.

## 8. Current Routes (Verified)

- `/`
- `/youtube-analyzer`
- `/seo-optimizer`
- `/reel-analyzer`
- `/instagram-reel-analyzer`
- `/reel-seo-optimizer`
- `/reel-hashtag-generator`
- `/reel-caption-generator`
- `/reel-title-generator`
- `/reel-viral-checker`
- `/reel-engagement-calculator`
- `/guides/:slug`
- `/blog`, `/blog/:slug`
- `/about`, `/contact`, `/partnership`, `/collaboration`, `/promotion`
- `/privacy-policy`, `/terms`, `/sitemap-page`, `/pricing`
- `/login`
- `/bosspage-login`, `/bosspage`
- `/creator-login`, `/creator-dashboard`

## 9. Current Admin UI Modules (Verified)

- Dashboard
- User Management
- Payments
- Plans and Pricing
- AI Assistant
- Manage Creators
- Traffic Analytics
- Usage Analytics

## 10. Troubleshooting

- Build fails: run `npm run build` locally first and fix TypeScript/Vite errors.
- Blank page after deploy: verify SPA rewrite to `index.html`.
- Auth/API failures: recheck `VITE_SUPABASE_*` values and Supabase function secrets.
- Admin access blocked: ensure user has `admin` role in `user_roles`.
