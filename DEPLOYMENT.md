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

## 6. Vercel Deployment (Current Working)

`vercel.json` already exists and is valid for this Vite SPA.

Current config:

- Framework: `vite`
- Build: `npm run build`
- Output: `dist`
- Rewrite all routes to `index.html`

Steps:

1. Import repository into Vercel
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Deploy

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
