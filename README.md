# Reelanylizer

AI-powered Instagram and YouTube short-video analysis platform with viral scoring, SEO tooling, premium report generation, and an admin control panel.

## Core Features

- Reel and short-video analysis with structured score cards
- SEO optimizer and SEO landing pages
- Premium report flow and payment integrations
- User auth, creator auth, and creator dashboard
- Admin dashboard with operations and analytics modules
- Supabase-backed backend (DB, auth, edge functions)

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (Postgres, Auth, Edge Functions)
- Charts: Recharts
- PDF: jsPDF + html2canvas

## Working Routes

- `/` Home analyzer
- `/youtube-analyzer` YouTube analyzer
- `/seo-optimizer` SEO optimizer
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

## Admin Panel (Current)

Current sidebar/admin modules exposed in UI:

- Dashboard
- User Management
- Payments
- Plans and Pricing
- AI Assistant
- Manage Creators
- Traffic Analytics
- Usage Analytics

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Build production bundle:

```bash
npm run build
```

## Environment Variables

Frontend variables used by Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Backend secrets should be configured in Supabase Edge Function secrets, not exposed in frontend env.

## Deployment

Vercel is preconfigured with `vercel.json`:

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrite: all paths to `index.html`

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [SELF-HOSTING.md](./SELF-HOSTING.md) for full setup.

## Manuals

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SELF-HOSTING.md](./SELF-HOSTING.md)
- [ADMIN_SETUP.md](./ADMIN_SETUP.md)
- [ADMIN_QUICK_SETUP.md](./ADMIN_QUICK_SETUP.md)
- [ADS-SETUP-GUIDE.md](./ADS-SETUP-GUIDE.md)
